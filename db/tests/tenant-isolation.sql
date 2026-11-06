\set ON_ERROR_STOP on

-- This script runs as a non-superuser application role so FORCE ROW LEVEL
-- SECURITY is actually exercised. All fixtures are synthetic.
INSERT INTO organizations (id, slug, name) VALUES
  ('10000000-0000-4000-8000-000000000001', 'demo-alpha', 'Demo Alpha'),
  ('10000000-0000-4000-8000-000000000002', 'demo-bravo', 'Demo Bravo');

INSERT INTO users (id, auth_subject, email, display_name) VALUES
  ('20000000-0000-4000-8000-000000000001', 'test|alpha', 'alpha@example.invalid', 'Alpha Test'),
  ('20000000-0000-4000-8000-000000000002', 'test|bravo', 'bravo@example.invalid', 'Bravo Test');

INSERT INTO memberships (organization_id, user_id, role) VALUES
  ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'investigator'),
  ('10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'investigator');

INSERT INTO cases (id, organization_id, case_reference, created_by_user_id, category, summary) VALUES
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'ALPHA-001', '20000000-0000-4000-8000-000000000001', 'phone_theft', 'Synthetic alpha test case'),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'BRAVO-001', '20000000-0000-4000-8000-000000000002', 'phone_theft', 'Synthetic bravo test case');

SET ROLE iptirs_app;
SET app.current_organization_id = '10000000-0000-4000-8000-000000000001';
SET app.current_user_id = '20000000-0000-4000-8000-000000000001';

DO $$
DECLARE visible_cases integer;
BEGIN
  SELECT count(*) INTO visible_cases FROM cases;
  IF visible_cases <> 1 THEN
    RAISE EXCEPTION 'Tenant isolation failed: expected 1 visible case, got %', visible_cases;
  END IF;
  IF EXISTS (SELECT 1 FROM cases WHERE id = '30000000-0000-4000-8000-000000000002') THEN
    RAISE EXCEPTION 'Cross-tenant case became visible';
  END IF;
END;
$$;

DO $$
BEGIN
  BEGIN
    INSERT INTO cases (organization_id, case_reference, created_by_user_id, category, summary)
    VALUES ('10000000-0000-4000-8000-000000000002', 'CROSS-001',
      '20000000-0000-4000-8000-000000000002', 'phone_theft', 'Cross-tenant insert must fail');
    RAISE EXCEPTION 'Cross-tenant insert unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END;
$$;

DO $$
BEGIN
  IF has_table_privilege(current_user, 'audit_events', 'UPDATE')
     OR has_table_privilege(current_user, 'audit_events', 'DELETE') THEN
    RAISE EXCEPTION 'Application role must not mutate or delete audit events';
  END IF;
  IF has_table_privilege(current_user, 'evidence_items', 'UPDATE')
     OR has_table_privilege(current_user, 'evidence_items', 'DELETE') THEN
    RAISE EXCEPTION 'Application role must not mutate or delete evidence records';
  END IF;
END;
$$;

RESET ROLE;
