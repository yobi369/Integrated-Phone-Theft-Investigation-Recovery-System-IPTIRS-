-- Phase 3: evidence access audit action extension. Evidence rows are immutable;
-- uploads are inserted only after scanning and private object persistence succeed.
ALTER TABLE evidence_access_events
  DROP CONSTRAINT evidence_access_events_action_check;
ALTER TABLE evidence_access_events
  ADD CONSTRAINT evidence_access_events_action_check
  CHECK (action IN ('upload', 'view', 'download', 'export', 'quarantine', 'release'));

-- Prevent duplicate object references and require evidence to be scanned before
-- it can be marked available. Metadata remains append-only after insertion.
ALTER TABLE evidence_items
  ADD CONSTRAINT evidence_items_storage_key_nonempty
  CHECK (length(trim(object_key)) BETWEEN 1 AND 512),
  ADD CONSTRAINT evidence_items_media_type_allowlist
  CHECK (media_type IN ('application/pdf', 'image/jpeg', 'image/png', 'image/webp'));
