-- Controlled device ownership review. Device identity fields remain immutable;
-- only authorized staff may change the review state, with an audited reason.
CREATE POLICY device_records_case_update_policy ON device_records
  FOR UPDATE USING (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM memberships m
       WHERE m.organization_id = device_records.organization_id
         AND m.user_id = nullif(current_setting('app.current_user_id', true), '')::uuid
         AND m.status = 'active'
         AND m.role IN ('organization_admin', 'investigator')
    )
  )
  WITH CHECK (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM memberships m
       WHERE m.organization_id = device_records.organization_id
         AND m.user_id = nullif(current_setting('app.current_user_id', true), '')::uuid
         AND m.status = 'active'
         AND m.role IN ('organization_admin', 'investigator')
    )
  );

GRANT UPDATE (ownership_status) ON device_records TO iptirs_app;

CREATE FUNCTION protect_device_record_identity() RETURNS trigger
LANGUAGE plpgsql AS $device_guard$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
    OR NEW.case_id IS DISTINCT FROM OLD.case_id
    OR NEW.device_type IS DISTINCT FROM OLD.device_type
    OR NEW.manufacturer IS DISTINCT FROM OLD.manufacturer
    OR NEW.model IS DISTINCT FROM OLD.model
    OR NEW.identifier_type IS DISTINCT FROM OLD.identifier_type
    OR NEW.identifier_ciphertext IS DISTINCT FROM OLD.identifier_ciphertext
    OR NEW.identifier_fingerprint IS DISTINCT FROM OLD.identifier_fingerprint
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Device identity fields are immutable; only ownership review status may change.'
      USING ERRCODE = '55000';
  END IF;
  RETURN NEW;
END;
$device_guard$;

CREATE TRIGGER device_records_protect_identity
  BEFORE UPDATE ON device_records
  FOR EACH ROW EXECUTE FUNCTION protect_device_record_identity();
