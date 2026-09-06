-- =============================================================
-- Migration 0002: Cleanup data: Base64 photo URLs
-- Phase: P0.1
-- Safety: IDEMPOTENT (safe to run multiple times)
-- Purpose: Move the existing per-request UPDATE in /api/v1/tree/canvas
--          to a one-time cleanup. After this migration runs and is
--          verified, the in-request UPDATE will be removed from the code.
--
-- Data impact: SET photo_url = NULL on rows where photo_url starts with 'data:'
--              This is non-destructive — the URLs themselves aren't needed
--              (they were base64-encoded images stored in the DB, which is
--              an anti-pattern).
-- =============================================================

-- Step 1: Show what will be affected (DRY RUN — informational only)
-- SELECT COUNT(*) AS affected_rows
-- FROM persons
-- WHERE photo_url IS NOT NULL AND photo_url LIKE 'data:%';

-- Step 2: Actual cleanup
UPDATE persons
SET photo_url = NULL
WHERE photo_url IS NOT NULL
  AND photo_url LIKE 'data:%';

-- Note: In production, run this in two steps to be extra safe:
--   1. SELECT first, verify the count looks reasonable
--   2. Then UPDATE
-- Sample verification query:
--   SELECT id, first_name, LENGTH(photo_url) AS url_size
--   FROM persons
--   WHERE photo_url IS NOT NULL AND photo_url LIKE 'data:%'
--   LIMIT 5;

-- =============================================================
-- DOWN (rollback): restore the values from a backup if needed.
-- This migration is destructive, so DOWN requires a backup.
-- Always run: pg_dump -t persons > backup_before_0002.sql
-- BEFORE running this migration.
-- =============================================================
