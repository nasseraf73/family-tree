-- =============================================================
-- Migration 0003: Add CHECK constraint to prevent base64 photo URLs
-- Phase: P0.1
-- Safety: Safe (constraint only validates new/updated rows by default)
-- Pre-requisite: Migration 0002 must run first and the SELECT COUNT(*)
--                must return 0 for "data:"" photo URLs.
-- Purpose: Make sure no future code path can insert base64 data again.
--
-- Data impact: NONE (no rows are modified; only schema is updated)
-- =============================================================

-- Step 1: Verify no bad data exists
-- (if this returns > 0, run migration 0002 first)
DO $$
DECLARE
  bad_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bad_count
  FROM persons
  WHERE photo_url IS NOT NULL AND photo_url LIKE 'data:%';

  IF bad_count > 0 THEN
    RAISE EXCEPTION 'Found % rows with data: photo_url. Run migration 0002 first.', bad_count;
  END IF;
END $$;

-- Step 2: Add the constraint (idempotent via IF NOT EXISTS pattern)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_photo_url_no_data'
  ) THEN
    ALTER TABLE persons
    ADD CONSTRAINT chk_photo_url_no_data
    CHECK (photo_url IS NULL OR photo_url !~ '^data:');
  END IF;
END $$;

-- =============================================================
-- DOWN (rollback):
-- ALTER TABLE persons DROP CONSTRAINT IF EXISTS chk_photo_url_no_data;
-- =============================================================
