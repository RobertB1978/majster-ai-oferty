-- ============================================
-- PHASE 2 AUDIT: PERFORMANCE INDEXES
-- Migration: 20251212163500
-- Description: Add missing indexes identified in Phase 2 audit
-- Impact: Improves query performance for offer followup and project lists
-- ============================================

-- Index 1: offer_sends.tracking_status
-- Purpose: Speed up filtering by tracking status in offer followup queries
-- Estimated impact: 10-50x faster for status-based filters
CREATE INDEX IF NOT EXISTS idx_offer_sends_tracking_status
ON offer_sends(tracking_status);

-- Index 2: offer_sends.sent_at (descending)
-- Purpose: Speed up sorting by sent date in offer lists
-- Estimated impact: 10-100x faster for time-based sorts
CREATE INDEX IF NOT EXISTS idx_offer_sends_sent_at
ON offer_sends(sent_at DESC);

-- Index 3: projects.status
-- Purpose: Speed up filtering by project status (active, completed, etc.)
-- Estimated impact: 10-50x faster for status-based filters
CREATE INDEX IF NOT EXISTS idx_projects_status
ON projects(status);

-- Index 4: projects.created_at (descending)
-- Purpose: Speed up sorting by creation date in project lists
-- Estimated impact: 10-100x faster for time-based sorts
CREATE INDEX IF NOT EXISTS idx_projects_created_at
ON projects(created_at DESC);

-- ============================================
-- VERIFICATION QUERIES
-- Run these after migration to verify indexes exist:
--
-- SELECT indexname, tablename FROM pg_indexes
-- WHERE tablename IN ('offer_sends', 'projects')
-- AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;
-- ============================================
