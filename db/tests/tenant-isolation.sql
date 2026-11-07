\set ON_ERROR_STOP on

-- Run only after db/tests/seed-tenant-fixtures.sql has been applied as a
-- database administrator. This file is executed as the restricted app role.
SET app.current_auth_subject = 'test|alpha';

DO $$
DECLARE visible_users integer;
BEGIN
  SELECT count(*) INTO visible_users FROM users;
  IF visible_users <> 1 THEN
    RAISE EXCEPTION 'OIDC subject bootstrap exposed unexpected user rows: %', visible_users;
  END IF;
END;
$$;

SET app.current_organization_id = '10000000-0000-4000-8000-000000000001';
SET app.current_user_id = '20000000-0000-4000-8000-000000000001';
SELECT set_config('app.current_role', 'investigator', false);

DO $$
DECLARE before_update timestamptz;
DECLARE after_update timestamptz;
BEGIN
  SELECT updated_at INTO before_update FROM cases
  WHERE id = '30000000-0000-4000-8000-000000000001';
  UPDATE cases SET status = 'under_review'
  WHERE id = '30000000-0000-4000-8000-000000000001';
  SELECT updated_at INTO after_update FROM cases
  WHERE id = '30000000-0000-4000-8000-000000000001';
  IF after_update <= before_update THEN
    RAISE EXCEPTION 'Case updated_at trigger did not advance the timestamp';
  END IF;

  BEGIN
    UPDATE cases SET status = 'recovered'
    WHERE id = '30000000-0000-4000-8000-000000000001';
    RAISE EXCEPTION 'Database unexpectedly allowed a skipped case status transition';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  BEGIN
    UPDATE cases SET case_reference = 'ALTERED-REFERENCE'
    WHERE id = '30000000-0000-4000-8000-000000000001';
    RAISE EXCEPTION 'Case reference was unexpectedly mutable';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    NULL;
  END;
END;
$$;

DO $$
DECLARE visible_staff integer;
BEGIN
  SELECT count(*) INTO visible_staff FROM users;
  IF visible_staff <> 3 THEN
    RAISE EXCEPTION 'Investigator directory scope failed: expected 3 active staff identities, got %', visible_staff;
  END IF;
  IF EXISTS (SELECT 1 FROM users WHERE id IN (
    '20000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000004'
  )) THEN
    RAISE EXCEPTION 'Investigator directory exposed reporter or auditor identities';
  END IF;
END;
$$;

DO $$
DECLARE visible_cases integer;
BEGIN
  SELECT count(*) INTO visible_cases FROM cases;
  IF visible_cases <> 2 THEN
    RAISE EXCEPTION 'Investigator scope failed: expected 2 organization cases, got %', visible_cases;
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
DECLARE visible_cases integer;
DECLARE updated_cases integer;
BEGIN
  PERFORM set_config('app.current_user_id', '20000000-0000-4000-8000-000000000003', false);
  PERFORM set_config('app.current_role', 'reporter', false);
  SELECT count(*) INTO visible_cases FROM cases;
  IF visible_cases <> 1 THEN
    RAISE EXCEPTION 'Reporter scope failed: expected only its own case, got %', visible_cases;
  END IF;

  UPDATE cases SET status = 'closed'
  WHERE id = '30000000-0000-4000-8000-000000000003';
  GET DIAGNOSTICS updated_cases = ROW_COUNT;
  IF updated_cases <> 0 THEN
    RAISE EXCEPTION 'Reporter unexpectedly updated a case';
  END IF;

  PERFORM set_config('app.current_user_id', '20000000-0000-4000-8000-000000000001', false);
  PERFORM set_config('app.current_role', 'investigator', false);
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


DO $$
DECLARE authorization_id uuid;
BEGIN
  INSERT INTO authorization_records (
    organization_id, case_id, requested_by_user_id, purpose,
    requested_action, legal_authority_reference, scope, valid_until
  ) VALUES (
    '10000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'Synthetic test request for workflow boundary',
    'operator_status_check',
    'TEST-LEGAL-REF',
    '{}'::jsonb,
    now() + interval '1 day'
  ) RETURNING id INTO authorization_id;

  BEGIN
    INSERT INTO operator_requests (
      organization_id, case_id, authorization_record_id, created_by_user_id
    ) VALUES (
      '10000000-0000-4000-8000-000000000001',
      '30000000-0000-4000-8000-000000000001',
      authorization_id,
      '20000000-0000-4000-8000-000000000001'
    );
    RAISE EXCEPTION 'Operator request unexpectedly accepted without an approved authorization';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  BEGIN
    INSERT INTO authorization_records (
      organization_id, case_id, requested_by_user_id, purpose,
      requested_action, legal_authority_reference, scope, valid_until,
      status, approved_by_user_id, approved_at
    ) VALUES (
      '10000000-0000-4000-8000-000000000001',
      '30000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000001',
      'Attempted self-approved synthetic request',
      'operator_status_check',
      'TEST-LEGAL-REF',
      '{}'::jsonb,
      now() + interval '1 day',
      'approved',
      '20000000-0000-4000-8000-000000000001',
      now()
    );
    RAISE EXCEPTION 'Requester unexpectedly created an approved authorization';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END;
$$;

DO $$
BEGIN
  IF has_table_privilege(current_user, 'authorization_records', 'UPDATE') THEN
    RAISE EXCEPTION 'Application role must not approve or mutate authorization records directly';
  END IF;
  IF (SELECT rolbypassrls FROM pg_roles WHERE rolname = 'iptirs_auth_workflow') THEN
    RAISE EXCEPTION 'Authorization workflow role must not bypass row-level security';
  END IF;
  IF has_table_privilege(current_user, 'device_records', 'UPDATE') THEN
    RAISE EXCEPTION 'Application role must not rewrite device identity records';
  END IF;
END;
$$;

-- Organization administrator membership visibility and update scope.
SELECT set_config('app.current_user_id', '20000000-0000-4000-8000-000000000007', false);
SELECT set_config('app.current_role', 'organization_admin', false);

DO $$
DECLARE visible_memberships integer;
DECLARE visible_directory_users integer;
DECLARE changed_rows integer;
BEGIN
  SELECT count(*) INTO visible_memberships FROM memberships;
  SELECT count(*) INTO visible_directory_users FROM users;
  IF visible_memberships <> 6 OR visible_directory_users <> 6 THEN
    RAISE EXCEPTION 'Organization admin directory scope failed: memberships %, users %',
      visible_memberships, visible_directory_users;
  END IF;

  UPDATE memberships SET status = 'suspended'
   WHERE organization_id = '10000000-0000-4000-8000-000000000001'
     AND user_id = '20000000-0000-4000-8000-000000000005';
  GET DIAGNOSTICS changed_rows = ROW_COUNT;
  IF changed_rows <> 1 THEN
    RAISE EXCEPTION 'Organization admin could not suspend an organization member';
  END IF;

  UPDATE memberships SET status = 'active'
   WHERE organization_id = '10000000-0000-4000-8000-000000000001'
     AND user_id = '20000000-0000-4000-8000-000000000005';
  GET DIAGNOSTICS changed_rows = ROW_COUNT;
  IF changed_rows <> 1 THEN
    RAISE EXCEPTION 'Organization admin could not reactivate a suspended member';
  END IF;
END;
$$;
