-- ============================================
-- Add decision audit fields to offer_approvals
-- PR#4: Acceptance/Rejection with Audit Trail
-- ============================================

-- Add missing columns for decision tracking and security audit
ALTER TABLE offer_approvals
ADD COLUMN rejected_at TIMESTAMPTZ,
ADD COLUMN ip_hash VARCHAR(64),
ADD COLUMN user_agent TEXT;

-- Ensure rejected_at is set when status is 'rejected'
-- (Note: approved_at is already managed by the Edge Function)
ALTER TABLE offer_approvals
ADD CONSTRAINT rejected_at_consistency
  CHECK (
    (status = 'rejected' AND rejected_at IS NOT NULL) OR
    (status != 'rejected')
  );

-- Create index for faster lookups by ip_hash (for audit/fraud detection)
CREATE INDEX idx_offer_approvals_ip_hash
  ON offer_approvals(ip_hash)
  WHERE ip_hash IS NOT NULL;

-- Create index for faster lookups by status
CREATE INDEX idx_offer_approvals_status
  ON offer_approvals(status);

-- Migrate existing data: approved records get approved_at set to created_at if missing
UPDATE offer_approvals
SET approved_at = created_at
WHERE status = 'approved' AND approved_at IS NULL;

-- Migrate existing data: rejected records get rejected_at set to created_at if missing
UPDATE offer_approvals
SET rejected_at = created_at
WHERE status = 'rejected' AND rejected_at IS NULL;
