-- Synthetic fixtures for the PostgreSQL RLS integration test only.
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
