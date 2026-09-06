-- =============================================================
-- Migration 0004: Performance indexes (P1.1 + P1.2)
-- Phase: P1
-- Safety: ZERO data impact. CREATE INDEX CONCURRENTLY only builds
--         auxiliary structures; existing rows are NOT modified.
--         CONCURRENTLY prevents table locks — safe to run during traffic.
-- Pre-requisite: NONE (can run any time, including peak hours)
--
-- Expected impact:
--   - Cycle detection (kinship.ts) on 20K records: 10-30s -> 50-200ms
--   - Deduplication: from 3-5s to 200-500ms
--   - All other queries: 5-50x faster
-- =============================================================

-- =============================================================
-- SECTION A: B-tree indexes (P1.1)
-- =============================================================

-- relationships (highest impact)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_relationships_person_id
  ON relationships(person_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_relationships_related_id
  ON relationships(related_person_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_relationships_status
  ON relationships(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_relationships_type
  ON relationships(relationship_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_relationships_created_by
  ON relationships(created_by_user_id);
-- Partial composite: covers the most common filter (verified/pending + person)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_relationships_person_status
  ON relationships(person_id, status)
  WHERE status IN ('VERIFIED', 'PENDING');

-- marriages
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marriages_husband
  ON marriages(husband_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marriages_wife
  ON marriages(wife_id);

-- persons
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_persons_country
  ON persons(country_id) WHERE country_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_persons_created_by
  ON persons(created_by_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_persons_claim_status
  ON persons(claim_status) WHERE claim_status = 'PENDING';

-- login logs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_login_logs_created
  ON login_logs(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_login_logs_email
  ON login_logs(email);

-- =============================================================
-- SECTION B: GIN trigram indexes for fuzzy search (P1.2)
-- =============================================================

-- pg_trgm extension must be enabled first (safe to re-run)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN indexes for trigram similarity searches (used by dedup.check)
-- These enable the migration to pg_trgm-based dedup in Phase P3
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_persons_first_name_trgm
  ON persons USING gin (first_name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_persons_father_name_trgm
  ON persons USING gin (father_name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_persons_family_name_trgm
  ON persons USING gin (family_name gin_trgm_ops);

-- =============================================================
-- VERIFICATION (run these after the migration to confirm)
-- =============================================================
-- SELECT schemaname, tablename, indexname, idx_scan
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;
--
-- Sample query that should now use an index:
-- EXPLAIN ANALYZE
-- SELECT * FROM relationships WHERE person_id = 1 AND status = 'VERIFIED';
-- Expect: "Index Scan using idx_relationships_person_status"
--
-- =============================================================
-- DOWN (rollback): all indexes are IF NOT EXISTS, so DOWN is symmetric:
-- DROP INDEX CONCURRENTLY IF EXISTS idx_relationships_person_id;
-- (repeat for each index)
-- =============================================================
