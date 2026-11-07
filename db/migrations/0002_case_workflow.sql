-- Phase 1 case workflow: assignment history and database-enforced status transitions.
-- Apply after 0001_initial.sql using the migration administrator.

CREATE TABLE case_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  case_id uuid NOT NULL,
  assigned_to_user_id uuid NOT NULL,
  assigned_by_user_id uuid NOT NULL,
  assignment_reason text NOT NULL CHECK (length(trim(assignment_reason)) BETWEEN 5 AND 500),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released')),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz,
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, case_id) REFERENCES cases(organization_id, id),
  FOREIGN KEY (organization_id, assigned_to_user_id) REFERENCES memberships(organization_id, user_id),
  FOREIGN KEY (organization_id, assigned_by_user_id) REFERENCES memberships(organization_id, user_id),
  CHECK ((status = 'released') = (released_at IS NOT NULL))
);

CREATE UNIQUE INDEX case_assignments_one_active_assignee_idx
  ON case_assignments (organization_id, case_id, assigned_to_user_id)
  WHERE status = 'active';
CREATE INDEX case_assignments_case_history_idx
  ON case_assignments (organization_id, case_id, assigned_at DESC);
CREATE INDEX case_assignments_user_active_idx
  ON case_assignments (organization_id, assigned_to_user_id)
  WHERE status = 'active';

ALTER TABLE case_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_assignments FORCE ROW LEVEL SECURITY;

-- The backend sets this role context only after resolving an active membership
-- from the verified OIDC subject. It is transaction-local.
CREATE POLICY memberships_staff_read ON memberships
  FOR SELECT USING (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND current_setting('app.current_role', true) IN ('organization_admin', 'investigator')
  );

CREATE POLICY case_assignments_case_select ON case_assignments
  FOR SELECT USING (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND current_setting('app.current_role', true) IN ('organization_admin', 'investigator', 'operator_liaison', 'auditor')
    AND EXISTS (
      SELECT 1 FROM cases c
      WHERE c.organization_id = case_assignments.organization_id
        AND c.id = case_assignments.case_id
    )
  );

CREATE POLICY case_assignments_create ON case_assignments
  FOR INSERT WITH CHECK (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND assigned_by_user_id = nullif(current_setting('app.current_user_id', true), '')::uuid
    AND status = 'active' AND released_at IS NULL
    AND current_setting('app.current_role', true) IN ('organization_admin', 'investigator')
    AND EXISTS (
      SELECT 1 FROM cases c
      WHERE c.organization_id = case_assignments.organization_id
        AND c.id = case_assignments.case_id
    )
    AND EXISTS (
      SELECT 1 FROM memberships target
      WHERE target.organization_id = case_assignments.organization_id
        AND target.user_id = case_assignments.assigned_to_user_id
        AND target.status = 'active'
        AND target.role IN ('organization_admin', 'investigator')
    )
  );

CREATE POLICY case_assignments_release ON case_assignments
  FOR UPDATE USING (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND current_setting('app.current_role', true) IN ('organization_admin', 'investigator')
    AND status = 'active'
  ) WITH CHECK (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND current_setting('app.current_role', true) IN ('organization_admin', 'investigator')
    AND status = 'released' AND released_at IS NOT NULL
  );

CREATE FUNCTION protect_case_assignment_identity() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id
    OR NEW.case_id IS DISTINCT FROM OLD.case_id
    OR NEW.assigned_to_user_id IS DISTINCT FROM OLD.assigned_to_user_id
    OR NEW.assigned_by_user_id IS DISTINCT FROM OLD.assigned_by_user_id
    OR NEW.assignment_reason IS DISTINCT FROM OLD.assignment_reason
    OR NEW.assigned_at IS DISTINCT FROM OLD.assigned_at THEN
    RAISE EXCEPTION 'Case assignment identity fields are immutable.' USING ERRCODE = '55000';
  END IF;
  IF OLD.status = 'released' THEN
    RAISE EXCEPTION 'Released assignments cannot be reactivated.' USING ERRCODE = '55000';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER case_assignments_protect_identity
  BEFORE UPDATE ON case_assignments
  FOR EACH ROW EXECUTE FUNCTION protect_case_assignment_identity();

CREATE FUNCTION enforce_case_status_transition() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF NOT (
    (OLD.status = 'submitted' AND NEW.status IN ('under_review', 'rejected'))
    OR (OLD.status = 'under_review' AND NEW.status IN ('accepted', 'rejected'))
    OR (OLD.status = 'accepted' AND NEW.status = 'in_progress')
    OR (OLD.status = 'in_progress' AND NEW.status IN ('pending_external_response', 'recovered'))
    OR (OLD.status = 'pending_external_response' AND NEW.status IN ('in_progress', 'recovered'))
    OR (OLD.status = 'recovered' AND NEW.status IN ('in_progress', 'closed'))
  ) THEN
    RAISE EXCEPTION 'Invalid case status transition: % -> %', OLD.status, NEW.status
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER cases_enforce_status_transition
  BEFORE UPDATE OF status ON cases
  FOR EACH ROW EXECUTE FUNCTION enforce_case_status_transition();

GRANT SELECT, INSERT, UPDATE ON case_assignments TO iptirs_app;
