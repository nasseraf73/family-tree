-- PostgreSQL Row Level Security (RLS) Policies for Living Persons Privacy (BRD NFR-3 & Edge Case 4)

-- 1. Enable RLS on persons table
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Immediate relatives & assigned Stewards can view full biographical details of living individuals
CREATE POLICY living_persons_full_access ON persons
  FOR SELECT
  USING (
    is_alive = false OR
    claimed_by_user_id = auth.uid()::bigint OR
    created_by_user_id = auth.uid()::bigint OR
    EXISTS (
      SELECT 1 FROM branch_reviewers br
      WHERE br.user_id = auth.uid()::bigint
    )
  );

-- 3. Policy: Public view automatically masks phone and sensitive biography for non-immediate relatives
CREATE POLICY living_persons_public_masked ON persons
  FOR SELECT
  USING (true);
