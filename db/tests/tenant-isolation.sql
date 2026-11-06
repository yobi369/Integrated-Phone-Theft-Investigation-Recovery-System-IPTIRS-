\set ON_ERROR_STOP on

-- Run only after db/tests/seed-tenant-fixtures.sql has been applied as a
-- database administrator. This file is executed as the restricted app role.
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
  IF has_table_privilege(current_user, 'device_records', 'UPDATE') THEN
    RAISE EXCEPTION 'Application role must not rewrite device identity records';
  END IF;
END;
$$;
