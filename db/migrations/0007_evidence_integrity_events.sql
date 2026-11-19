-- Evidence integrity incidents are durable, append-only security records.
-- Evidence items remain immutable; a detected incident blocks future downloads.
ALTER TABLE evidence_access_events
  DROP CONSTRAINT evidence_access_events_action_check;
ALTER TABLE evidence_access_events
  ADD CONSTRAINT evidence_access_events_action_check
  CHECK (action IN ('upload', 'view', 'download', 'export', 'quarantine', 'release', 'integrity_failure'));

CREATE TABLE evidence_integrity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  evidence_id uuid NOT NULL,
  actor_user_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('detected')),
  details jsonb NOT NULL CHECK (jsonb_typeof(details) = 'object'),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, evidence_id) REFERENCES evidence_items(organization_id, id),
  FOREIGN KEY (organization_id, actor_user_id) REFERENCES memberships(organization_id, user_id)
);

CREATE UNIQUE INDEX evidence_integrity_one_detection_idx
  ON evidence_integrity_events(organization_id, evidence_id)
  WHERE event_type = 'detected';
CREATE INDEX evidence_integrity_org_evidence_time_idx
  ON evidence_integrity_events(organization_id, evidence_id, occurred_at);

ALTER TABLE evidence_integrity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_integrity_events FORCE ROW LEVEL SECURITY;

CREATE POLICY evidence_integrity_select_policy ON evidence_integrity_events
  FOR SELECT USING (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM memberships m
       WHERE m.organization_id = evidence_integrity_events.organization_id
         AND m.user_id = nullif(current_setting('app.current_user_id', true), '')::uuid
         AND m.status = 'active'
         AND m.role IN ('organization_admin', 'investigator', 'auditor')
    )
  );

CREATE POLICY evidence_integrity_insert_policy ON evidence_integrity_events
  FOR INSERT WITH CHECK (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND actor_user_id = nullif(current_setting('app.current_user_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM evidence_items e
       WHERE e.organization_id = evidence_integrity_events.organization_id
         AND e.id = evidence_integrity_events.evidence_id
    )
  );

CREATE TRIGGER evidence_integrity_events_append_only
  BEFORE UPDATE OR DELETE ON evidence_integrity_events
  FOR EACH ROW EXECUTE FUNCTION reject_immutable_row_mutation();

GRANT SELECT, INSERT ON evidence_integrity_events TO iptirs_app;
