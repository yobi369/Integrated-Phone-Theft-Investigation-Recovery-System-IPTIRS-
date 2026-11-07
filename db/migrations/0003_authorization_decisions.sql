-- Phase 2: independent authorization decisions with separation of duties.
-- The application role cannot directly update authorization records. A narrowly
-- privileged SECURITY DEFINER function performs the single permitted decision.

ALTER TABLE memberships DROP CONSTRAINT memberships_role_check;
ALTER TABLE memberships ADD CONSTRAINT memberships_role_check
  CHECK (role IN ('organization_admin', 'investigator', 'authorization_approver', 'operator_liaison', 'auditor', 'reporter'));

ALTER TABLE authorization_records
  ADD COLUMN decided_by_user_id uuid,
  ADD COLUMN decided_at timestamptz,
  ADD COLUMN decision_reason text;

ALTER TABLE authorization_records
  ADD CONSTRAINT authorization_records_decided_by_fk
  FOREIGN KEY (organization_id, decided_by_user_id)
  REFERENCES memberships(organization_id, user_id);

ALTER TABLE authorization_records
  ADD CONSTRAINT authorization_records_decision_fields_check
  CHECK (
    (status = 'pending_approval' AND decided_by_user_id IS NULL AND decided_at IS NULL AND decision_reason IS NULL)
    OR
    (status IN ('approved', 'rejected')
      AND decided_by_user_id IS NOT NULL
      AND decided_at IS NOT NULL
      AND decision_reason IS NOT NULL
      AND length(trim(decision_reason)) BETWEEN 10 AND 1000)
    OR
    (status IN ('expired', 'withdrawn')
      AND decided_by_user_id IS NULL AND decided_at IS NULL AND decision_reason IS NULL)
  );

-- Approvers may review the case context and relevant authorization record.
DROP POLICY cases_tenant_select ON cases;
CREATE POLICY cases_tenant_select ON cases
  FOR SELECT USING (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM memberships m
      WHERE m.organization_id = cases.organization_id
        AND m.user_id = nullif(current_setting('app.current_user_id', true), '')::uuid
        AND m.status = 'active'
        AND (m.role IN ('organization_admin', 'investigator', 'operator_liaison', 'auditor', 'authorization_approver')
          OR cases.created_by_user_id = m.user_id))
  );

DROP POLICY memberships_staff_read ON memberships;
CREATE POLICY memberships_staff_read ON memberships
  FOR SELECT USING (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND current_setting('app.current_role', true) IN ('organization_admin', 'investigator', 'authorization_approver')
  );

DROP POLICY authorization_records_case_select_policy ON authorization_records;
CREATE POLICY authorization_records_case_select_policy ON authorization_records
  FOR SELECT USING (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND current_setting('app.current_role', true) IN ('organization_admin', 'investigator', 'operator_liaison', 'auditor', 'authorization_approver')
    AND EXISTS (SELECT 1 FROM cases c
      WHERE c.organization_id = authorization_records.organization_id
        AND c.id = authorization_records.case_id)
  );

-- This non-login role has no BYPASSRLS. It can update authorization decisions
-- only through the dedicated row policy and the function below.
CREATE ROLE iptirs_auth_workflow
  NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;

GRANT USAGE ON SCHEMA public TO iptirs_auth_workflow;
GRANT SELECT ON memberships, cases, authorization_records TO iptirs_auth_workflow;
GRANT UPDATE ON authorization_records TO iptirs_auth_workflow;

CREATE POLICY authorization_records_workflow_update ON authorization_records
  FOR UPDATE USING (
    current_user = 'iptirs_auth_workflow'
    AND organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
  ) WITH CHECK (
    current_user = 'iptirs_auth_workflow'
    AND organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
  );

CREATE FUNCTION decide_authorization_record(
  p_authorization_id uuid,
  p_decision text,
  p_reason text
)
RETURNS TABLE (
  id uuid,
  organization_id uuid,
  case_id uuid,
  requested_by_user_id uuid,
  status text,
  decided_by_user_id uuid,
  decided_at timestamptz,
  decision_reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_organization_id uuid := nullif(current_setting('app.current_organization_id', true), '')::uuid;
  v_actor_user_id uuid := nullif(current_setting('app.current_user_id', true), '')::uuid;
  v_role text := current_setting('app.current_role', true);
  v_requester_user_id uuid;
  v_status text;
  v_valid_until timestamptz;
  v_decided_at timestamptz := clock_timestamp();
BEGIN
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Unsupported authorization decision.' USING ERRCODE = '22023';
  END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) NOT BETWEEN 10 AND 1000 THEN
    RAISE EXCEPTION 'A decision reason between 10 and 1000 characters is required.' USING ERRCODE = '22023';
  END IF;
  IF v_organization_id IS NULL OR v_actor_user_id IS NULL
     OR v_role NOT IN ('organization_admin', 'authorization_approver') THEN
    RAISE EXCEPTION 'An authorized approver context is required.' USING ERRCODE = '42501';
  END IF;

  SELECT a.requested_by_user_id, a.status, a.valid_until
    INTO v_requester_user_id, v_status, v_valid_until
    FROM public.authorization_records a
   WHERE a.id = p_authorization_id
     AND a.organization_id = v_organization_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Authorization request not found.' USING ERRCODE = '02000';
  END IF;
  IF v_requester_user_id = v_actor_user_id THEN
    RAISE EXCEPTION 'The requester cannot decide their own authorization request.' USING ERRCODE = '42501';
  END IF;
  IF v_status <> 'pending_approval' OR v_valid_until <= v_decided_at THEN
    RAISE EXCEPTION 'Authorization request is no longer pending or has expired.' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.memberships m
     WHERE m.organization_id = v_organization_id
       AND m.user_id = v_actor_user_id
       AND m.status = 'active'
       AND m.role IN ('organization_admin', 'authorization_approver')
  ) THEN
    RAISE EXCEPTION 'The approver membership is no longer active.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  UPDATE public.authorization_records a
     SET status = p_decision,
         approved_by_user_id = CASE WHEN p_decision = 'approved' THEN v_actor_user_id ELSE NULL END,
         approved_at = CASE WHEN p_decision = 'approved' THEN v_decided_at ELSE NULL END,
         decided_by_user_id = v_actor_user_id,
         decided_at = v_decided_at,
         decision_reason = trim(p_reason)
   WHERE a.id = p_authorization_id
     AND a.organization_id = v_organization_id
     AND a.status = 'pending_approval'
  RETURNING a.id, a.organization_id, a.case_id, a.requested_by_user_id,
            a.status, a.decided_by_user_id, a.decided_at, a.decision_reason;
END;
$$;

GRANT CREATE ON SCHEMA public TO iptirs_auth_workflow;
ALTER FUNCTION decide_authorization_record(uuid, text, text) OWNER TO iptirs_auth_workflow;
REVOKE CREATE ON SCHEMA public FROM iptirs_auth_workflow;
REVOKE ALL ON FUNCTION decide_authorization_record(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION decide_authorization_record(uuid, text, text) TO iptirs_app;
