-- IPTIRS initial institutional data model.
-- Apply with a dedicated, non-superuser application role. The API must set
-- app.current_organization_id and app.current_user_id from a verified identity
-- inside each database transaction. Never accept these values from the browser.
-- The role must not have BYPASSRLS. Do not expose database credentials to Vite.

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 160),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_subject text NOT NULL UNIQUE,
  email text NOT NULL,
  display_name text NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 160),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE memberships (
  organization_id uuid NOT NULL REFERENCES organizations(id),
  user_id uuid NOT NULL REFERENCES users(id),
  role text NOT NULL CHECK (role IN ('organization_admin', 'investigator', 'operator_liaison', 'auditor', 'reporter')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'suspended', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);

CREATE TABLE cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  case_reference text NOT NULL,
  created_by_user_id uuid NOT NULL,
  category text NOT NULL CHECK (category IN ('phone_theft', 'device_loss', 'institutional_asset_loss')),
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'accepted', 'in_progress', 'pending_external_response', 'recovered', 'closed', 'rejected')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  summary text NOT NULL CHECK (length(trim(summary)) BETWEEN 10 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, case_reference),
  FOREIGN KEY (organization_id, created_by_user_id) REFERENCES memberships(organization_id, user_id)
);

CREATE TABLE device_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  case_id uuid NOT NULL,
  device_type text NOT NULL CHECK (device_type IN ('phone', 'tablet', 'laptop', 'other')),
  manufacturer text,
  model text,
  identifier_type text CHECK (identifier_type IN ('imei', 'serial_number', 'asset_tag', 'other')),
  identifier_ciphertext bytea,
  identifier_fingerprint char(64),
  ownership_status text NOT NULL DEFAULT 'unverified' CHECK (ownership_status IN ('unverified', 'claimed', 'evidence_submitted', 'verified', 'disputed', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, case_id) REFERENCES cases(organization_id, id),
  CHECK ((identifier_ciphertext IS NULL) = (identifier_fingerprint IS NULL)),
  CHECK (identifier_fingerprint IS NULL OR identifier_fingerprint ~ '^[0-9a-f]{64}$')
);

CREATE TABLE case_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  case_id uuid NOT NULL,
  actor_user_id uuid NOT NULL,
  event_type text NOT NULL CHECK (length(trim(event_type)) BETWEEN 2 AND 80),
  description text NOT NULL CHECK (length(trim(description)) BETWEEN 1 AND 2000),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, case_id) REFERENCES cases(organization_id, id),
  FOREIGN KEY (organization_id, actor_user_id) REFERENCES memberships(organization_id, user_id)
);

CREATE TABLE evidence_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  case_id uuid NOT NULL,
  uploaded_by_user_id uuid NOT NULL,
  object_key text NOT NULL UNIQUE,
  sha256 char(64) NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  media_type text NOT NULL,
  byte_size bigint NOT NULL CHECK (byte_size BETWEEN 1 AND 52428800),
  evidence_kind text NOT NULL CHECK (evidence_kind IN ('proof_of_ownership', 'purchase_record', 'police_reference', 'photo', 'document', 'other')),
  verification_status text NOT NULL DEFAULT 'pending_scan' CHECK (verification_status IN ('pending_scan', 'available', 'quarantined', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, case_id) REFERENCES cases(organization_id, id),
  FOREIGN KEY (organization_id, uploaded_by_user_id) REFERENCES memberships(organization_id, user_id)
);

CREATE TABLE evidence_access_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  evidence_id uuid NOT NULL,
  actor_user_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('view', 'download', 'export', 'quarantine', 'release')),
  purpose text NOT NULL CHECK (length(trim(purpose)) BETWEEN 5 AND 500),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, evidence_id) REFERENCES evidence_items(organization_id, id),
  FOREIGN KEY (organization_id, actor_user_id) REFERENCES memberships(organization_id, user_id)
);

CREATE TABLE authorization_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  case_id uuid NOT NULL,
  requested_by_user_id uuid NOT NULL,
  purpose text NOT NULL CHECK (length(trim(purpose)) BETWEEN 10 AND 1000),
  requested_action text NOT NULL CHECK (requested_action IN ('operator_status_check', 'operator_data_request', 'other_approved_process')),
  legal_authority_reference text NOT NULL CHECK (length(trim(legal_authority_reference)) BETWEEN 3 AND 240),
  scope jsonb NOT NULL CHECK (jsonb_typeof(scope) = 'object'),
  valid_until timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected', 'expired', 'withdrawn')),
  approved_by_user_id uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, case_id) REFERENCES cases(organization_id, id),
  FOREIGN KEY (organization_id, requested_by_user_id) REFERENCES memberships(organization_id, user_id),
  FOREIGN KEY (organization_id, approved_by_user_id) REFERENCES memberships(organization_id, user_id),
  CHECK ((status = 'approved') = (approved_by_user_id IS NOT NULL AND approved_at IS NOT NULL)),
  CHECK (valid_until > created_at)
);

CREATE TABLE operator_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  case_id uuid NOT NULL,
  authorization_record_id uuid NOT NULL,
  created_by_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'prepared' CHECK (status IN ('prepared', 'submitted_out_of_band', 'acknowledged', 'responded', 'declined', 'cancelled')),
  external_reference text,
  response_summary text,
  submitted_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, case_id) REFERENCES cases(organization_id, id),
  FOREIGN KEY (organization_id, authorization_record_id) REFERENCES authorization_records(organization_id, id),
  FOREIGN KEY (organization_id, created_by_user_id) REFERENCES memberships(organization_id, user_id),
  CHECK (status NOT IN ('submitted_out_of_band', 'acknowledged', 'responded', 'declined') OR submitted_at IS NOT NULL),
  CHECK ((status IN ('responded', 'declined')) = (responded_at IS NOT NULL))
);

CREATE TABLE audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  actor_user_id uuid NOT NULL,
  action text NOT NULL CHECK (length(trim(action)) BETWEEN 2 AND 100),
  target_type text NOT NULL CHECK (length(trim(target_type)) BETWEEN 2 AND 80),
  target_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  request_id text,
  previous_hash char(64),
  event_hash char(64) NOT NULL CHECK (event_hash ~ '^[0-9a-f]{64}$'),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, actor_user_id) REFERENCES memberships(organization_id, user_id),
  CHECK (previous_hash IS NULL OR previous_hash ~ '^[0-9a-f]{64}$')
);

CREATE INDEX cases_org_status_created_idx ON cases(organization_id, status, created_at DESC);
CREATE INDEX device_records_org_case_idx ON device_records(organization_id, case_id);
CREATE INDEX device_records_fingerprint_idx ON device_records(organization_id, identifier_fingerprint) WHERE identifier_fingerprint IS NOT NULL;
CREATE INDEX case_events_org_case_time_idx ON case_events(organization_id, case_id, occurred_at DESC);
CREATE INDEX evidence_items_org_case_time_idx ON evidence_items(organization_id, case_id, created_at DESC);
CREATE INDEX authorization_records_org_case_status_idx ON authorization_records(organization_id, case_id, status);
CREATE INDEX operator_requests_org_status_idx ON operator_requests(organization_id, status, created_at DESC);
CREATE INDEX audit_events_org_time_idx ON audit_events(organization_id, occurred_at DESC);

CREATE FUNCTION set_case_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$;

CREATE TRIGGER cases_set_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION set_case_updated_at();

CREATE FUNCTION reject_immutable_row_mutation() RETURNS trigger
LANGUAGE plpgsql AS $
BEGIN
  RAISE EXCEPTION 'This record is append-only; create a new event instead.'
    USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER case_events_append_only
  BEFORE UPDATE OR DELETE ON case_events
  FOR EACH ROW EXECUTE FUNCTION reject_immutable_row_mutation();

CREATE TRIGGER audit_events_append_only
  BEFORE UPDATE OR DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION reject_immutable_row_mutation();

CREATE TRIGGER evidence_items_append_only
  BEFORE UPDATE OR DELETE ON evidence_items
  FOR EACH ROW EXECUTE FUNCTION reject_immutable_row_mutation();

-- Every organization-owned table is protected by row-level security. The API
-- must set both context variables only after authenticating the caller and
-- resolving an active membership. Use SET LOCAL within a transaction.
DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'organizations', 'users', 'memberships', 'cases', 'device_records',
    'case_events', 'evidence_items', 'evidence_access_events',
    'authorization_records', 'operator_requests', 'audit_events'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
  END LOOP;
END;
$$;

CREATE POLICY organizations_tenant_policy ON organizations
  FOR SELECT USING (
    id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM memberships m
      WHERE m.organization_id = organizations.id
        AND m.user_id = nullif(current_setting('app.current_user_id', true), '')::uuid
        AND m.status = 'active')
  );

CREATE POLICY users_identity_lookup_policy ON users
  FOR SELECT USING (
    auth_subject = nullif(current_setting('app.current_auth_subject', true), '')
    AND status = 'active'
  );

CREATE POLICY memberships_self_policy ON memberships
  FOR SELECT USING (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND user_id = nullif(current_setting('app.current_user_id', true), '')::uuid
  );

CREATE POLICY cases_tenant_select ON cases
  FOR SELECT USING (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM memberships m
      WHERE m.organization_id = cases.organization_id
        AND m.user_id = nullif(current_setting('app.current_user_id', true), '')::uuid
        AND m.status = 'active'
        AND (m.role IN ('organization_admin', 'investigator', 'operator_liaison', 'auditor')
          OR cases.created_by_user_id = m.user_id))
  );

CREATE POLICY cases_tenant_insert ON cases
  FOR INSERT WITH CHECK (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND created_by_user_id = nullif(current_setting('app.current_user_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM memberships m
      WHERE m.organization_id = cases.organization_id
        AND m.user_id = nullif(current_setting('app.current_user_id', true), '')::uuid
        AND m.status = 'active'
        AND m.role IN ('organization_admin', 'investigator', 'reporter'))
  );

CREATE POLICY cases_tenant_update ON cases
  FOR UPDATE USING (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM memberships m
      WHERE m.organization_id = cases.organization_id
        AND m.user_id = nullif(current_setting('app.current_user_id', true), '')::uuid
        AND m.status = 'active'
        AND m.role IN ('organization_admin', 'investigator'))
  ) WITH CHECK (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM memberships m
      WHERE m.organization_id = cases.organization_id
        AND m.user_id = nullif(current_setting('app.current_user_id', true), '')::uuid
        AND m.status = 'active'
        AND m.role IN ('organization_admin', 'investigator'))
  );

CREATE POLICY device_records_case_policy ON device_records
  FOR SELECT USING (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM cases c
      WHERE c.organization_id = device_records.organization_id AND c.id = device_records.case_id)
  );

CREATE POLICY device_records_case_insert_policy ON device_records
  FOR INSERT WITH CHECK (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM cases c
      WHERE c.organization_id = device_records.organization_id AND c.id = device_records.case_id)
  );

CREATE POLICY case_events_case_select_policy ON case_events
  FOR SELECT USING (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM cases c
      WHERE c.organization_id = case_events.organization_id AND c.id = case_events.case_id)
  );

CREATE POLICY case_events_case_insert_policy ON case_events
  FOR INSERT WITH CHECK (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND actor_user_id = nullif(current_setting('app.current_user_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM cases c
      WHERE c.organization_id = case_events.organization_id AND c.id = case_events.case_id)
  );

CREATE POLICY evidence_items_case_select_policy ON evidence_items
  FOR SELECT USING (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM cases c
      WHERE c.organization_id = evidence_items.organization_id AND c.id = evidence_items.case_id)
  );

CREATE POLICY evidence_items_case_insert_policy ON evidence_items
  FOR INSERT WITH CHECK (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND uploaded_by_user_id = nullif(current_setting('app.current_user_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM cases c
      WHERE c.organization_id = evidence_items.organization_id AND c.id = evidence_items.case_id)
  );

CREATE POLICY evidence_access_case_select_policy ON evidence_access_events
  FOR SELECT USING (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM evidence_items e
      WHERE e.organization_id = evidence_access_events.organization_id
        AND e.id = evidence_access_events.evidence_id)
  );

CREATE POLICY evidence_access_case_insert_policy ON evidence_access_events
  FOR INSERT WITH CHECK (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND actor_user_id = nullif(current_setting('app.current_user_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM evidence_items e
      WHERE e.organization_id = evidence_access_events.organization_id
        AND e.id = evidence_access_events.evidence_id)
  );

CREATE POLICY authorization_records_case_select_policy ON authorization_records
  FOR SELECT USING (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM cases c
      WHERE c.organization_id = authorization_records.organization_id
        AND c.id = authorization_records.case_id)
  );

CREATE POLICY authorization_records_create_policy ON authorization_records
  FOR INSERT WITH CHECK (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND requested_by_user_id = nullif(current_setting('app.current_user_id', true), '')::uuid
    AND status = 'pending_approval'
    AND approved_by_user_id IS NULL AND approved_at IS NULL
    AND EXISTS (SELECT 1 FROM memberships m
      WHERE m.organization_id = authorization_records.organization_id
        AND m.user_id = nullif(current_setting('app.current_user_id', true), '')::uuid
        AND m.status = 'active' AND m.role IN ('organization_admin', 'investigator'))
    AND EXISTS (SELECT 1 FROM cases c
      WHERE c.organization_id = authorization_records.organization_id
        AND c.id = authorization_records.case_id)
  );

CREATE POLICY operator_requests_case_select_policy ON operator_requests
  FOR SELECT USING (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM cases c
      WHERE c.organization_id = operator_requests.organization_id AND c.id = operator_requests.case_id)
  );

CREATE POLICY operator_requests_create_policy ON operator_requests
  FOR INSERT WITH CHECK (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND created_by_user_id = nullif(current_setting('app.current_user_id', true), '')::uuid
    AND status = 'prepared' AND submitted_at IS NULL AND responded_at IS NULL
    AND EXISTS (SELECT 1 FROM memberships m
      WHERE m.organization_id = operator_requests.organization_id
        AND m.user_id = nullif(current_setting('app.current_user_id', true), '')::uuid
        AND m.status = 'active' AND m.role IN ('organization_admin', 'investigator'))
    AND EXISTS (SELECT 1 FROM authorization_records a
      WHERE a.organization_id = operator_requests.organization_id
        AND a.id = operator_requests.authorization_record_id
        AND a.status = 'approved' AND a.valid_until > now())
  );

CREATE POLICY operator_requests_update_policy ON operator_requests
  FOR UPDATE USING (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM memberships m
      WHERE m.organization_id = operator_requests.organization_id
        AND m.user_id = nullif(current_setting('app.current_user_id', true), '')::uuid
        AND m.status = 'active' AND m.role IN ('organization_admin', 'operator_liaison'))
  ) WITH CHECK (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM memberships m
      WHERE m.organization_id = operator_requests.organization_id
        AND m.user_id = nullif(current_setting('app.current_user_id', true), '')::uuid
        AND m.status = 'active' AND m.role IN ('organization_admin', 'operator_liaison'))
  );

CREATE POLICY audit_events_select_policy ON audit_events
  FOR SELECT USING (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM memberships m
      WHERE m.organization_id = audit_events.organization_id
        AND m.user_id = nullif(current_setting('app.current_user_id', true), '')::uuid
        AND m.status = 'active' AND m.role IN ('organization_admin', 'auditor'))
  );

CREATE POLICY audit_events_insert_policy ON audit_events
  FOR INSERT WITH CHECK (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND actor_user_id = nullif(current_setting('app.current_user_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM memberships m
      WHERE m.organization_id = audit_events.organization_id
        AND m.user_id = nullif(current_setting('app.current_user_id', true), '')::uuid
        AND m.status = 'active')
  );

-- Provision this role before applying the migration. It must be non-superuser
-- and must not have BYPASSRLS. Keep this role's credentials server-side only.
GRANT USAGE ON SCHEMA public TO iptirs_app;
GRANT SELECT ON organizations, users, memberships, cases, device_records,
  case_events, evidence_items, evidence_access_events, authorization_records,
  operator_requests, audit_events TO iptirs_app;
GRANT INSERT, UPDATE ON cases, operator_requests TO iptirs_app;
GRANT INSERT ON device_records TO iptirs_app;
GRANT INSERT ON authorization_records TO iptirs_app;
GRANT INSERT ON case_events, evidence_items, evidence_access_events,
  audit_events TO iptirs_app;
