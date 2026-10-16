BEGIN;

-- Migration 014 added the behavioural catalogue branch but accidentally
-- dropped the existing certification and technical-training mappings from
-- this shared trigger function. Keep every supported extension table here so
-- imports validate against their real catalogue category.
CREATE OR REPLACE FUNCTION catalogue.validate_extension_category()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  actual_category text;
  expected_category text;
BEGIN
  SELECT category_code
  INTO actual_category
  FROM catalogue.courses
  WHERE course_id = NEW.course_id;

  IF TG_TABLE_NAME = 'people_process_details' THEN
    IF actual_category NOT IN ('people-process', 'people-behavioural') THEN
      RAISE EXCEPTION 'Course % belongs to %, not a people/process catalogue track',
        NEW.course_id, actual_category;
    END IF;
    RETURN NEW;
  END IF;

  expected_category := CASE TG_TABLE_NAME
    WHEN 'role_based_details' THEN 'role-based'
    WHEN 'tools_technology_details' THEN 'tools-technology'
    WHEN 'certification_details' THEN 'certifications'
    WHEN 'technical_training_details' THEN 'technical-training'
  END;

  IF actual_category IS DISTINCT FROM expected_category THEN
    RAISE EXCEPTION 'Course % belongs to %, not %',
      NEW.course_id, actual_category, expected_category;
  END IF;

  RETURN NEW;
END;
$$;

INSERT INTO catalogue.schema_migrations (version)
VALUES ('015_restore_extension_category_validation')
ON CONFLICT (version) DO NOTHING;

COMMIT;
