-- Organization administrators can inspect membership records in their own
-- organization after withTenantContext has established the verified role.
CREATE POLICY memberships_admin_select_policy ON memberships
  FOR SELECT USING (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND nullif(current_setting('app.current_role', true), '') = 'organization_admin'
  );

CREATE POLICY memberships_admin_update_policy ON memberships
  FOR UPDATE USING (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND nullif(current_setting('app.current_role', true), '') = 'organization_admin'
  )
  WITH CHECK (
    organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
    AND nullif(current_setting('app.current_role', true), '') = 'organization_admin'
  );

CREATE POLICY users_admin_select_policy ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m
       WHERE m.user_id = users.id
         AND m.organization_id = nullif(current_setting('app.current_organization_id', true), '')::uuid
         AND nullif(current_setting('app.current_role', true), '') = 'organization_admin'
    )
  );

GRANT UPDATE (role, status) ON memberships TO iptirs_app;

CREATE FUNCTION protect_membership_identity() RETURNS trigger
LANGUAGE plpgsql AS $
BEGIN
  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id
    OR NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Membership identity fields are immutable.' USING ERRCODE = '55000';
  END IF;
  RETURN NEW;
END;
$;

CREATE TRIGGER memberships_protect_identity
  BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION protect_membership_identity();
