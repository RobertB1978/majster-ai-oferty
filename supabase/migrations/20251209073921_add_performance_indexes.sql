-- ============================================
-- Performance Optimization: Add Missing Indexes
-- Issue: B5 - Missing database indexes
--
-- This migration adds performance indexes based on real query analysis
-- from the application codebase. All queries were analyzed from:
-- - src/hooks/useNotifications.ts
-- - src/hooks/useOfferApprovals.ts
-- - src/hooks/useExpirationMonitor.ts
-- - src/hooks/useProjects.ts
-- - supabase/functions/send-expiring-offer-reminders/index.ts
--
-- Impact: Improves query performance on high-traffic tables
-- Risk: Very low - only adding indexes, no schema or data changes
-- ============================================

-- ===========================================
-- NOTIFICATIONS TABLE
-- ===========================================
-- Query pattern: .eq('user_id', X).order('created_at', DESC).limit(50)
-- Also supports: .eq('user_id', X).eq('is_read', false)
-- Source: src/hooks/useNotifications.ts:22-26, 68-69
--
-- This composite index covers:
-- 1. Filtering by user_id (RLS + explicit filter)
-- 2. Filtering by is_read status (for unread notifications)
-- 3. Sorting by created_at DESC (most recent first)
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
ON public.notifications(user_id, is_read, created_at DESC);

COMMENT ON INDEX idx_notifications_user_read_created IS
'Optimizes notification queries filtered by user and read status, sorted by creation date';

-- ===========================================
-- OFFER_APPROVALS TABLE
-- ===========================================

-- Index 1: Main query for fetching offer approvals by project
-- Query pattern: .eq('project_id', X).order('created_at', DESC)
-- Source: src/hooks/useOfferApprovals.ts:27-31
CREATE INDEX IF NOT EXISTS idx_offer_approvals_project_created
ON public.offer_approvals(project_id, created_at DESC);

COMMENT ON INDEX idx_offer_approvals_project_created IS
'Optimizes queries fetching offer approvals for a specific project, sorted by creation date';

-- Index 2: Expiration monitor queries
-- Query pattern: .eq('user_id', X).eq('status', 'pending').lte('expires_at', Y).gte('expires_at', Z)
-- Source: src/hooks/useExpirationMonitor.ts:41-45
--
-- This composite index covers:
-- 1. Filtering by user_id (owner of the offer)
-- 2. Filtering by status (pending offers only)
-- 3. Range filtering by expires_at (expiring soon)
CREATE INDEX IF NOT EXISTS idx_offer_approvals_user_status_expires
ON public.offer_approvals(user_id, status, expires_at);

COMMENT ON INDEX idx_offer_approvals_user_status_expires IS
'Optimizes expiration monitor queries filtering by user, pending status, and expiration date range';

-- Index 3: Edge function queries for expiring offers
-- Query pattern: .eq('status', 'pending').gte('expires_at', X).lte('expires_at', Y)
-- Source: supabase/functions/send-expiring-offer-reminders/index.ts:70-72
--
-- This index supports queries without user_id filter (service_role queries)
CREATE INDEX IF NOT EXISTS idx_offer_approvals_status_expires
ON public.offer_approvals(status, expires_at);

COMMENT ON INDEX idx_offer_approvals_status_expires IS
'Optimizes edge function queries for pending offers filtered by expiration date range';

-- ===========================================
-- PROJECTS TABLE
-- ===========================================
-- Query pattern: .order('created_at', DESC) with RLS filtering by user_id
-- Source: src/hooks/useProjects.ts:29-32
--
-- Note: idx_projects_user_id already exists from migration 20251205160746
-- This composite index provides additional optimization for sorted queries
-- combining user_id (from RLS) with created_at DESC ordering
CREATE INDEX IF NOT EXISTS idx_projects_user_created
ON public.projects(user_id, created_at DESC);

COMMENT ON INDEX idx_projects_user_created IS
'Optimizes queries fetching recent projects for a user, sorted by creation date';

-- ============================================
-- END OF MIGRATION
-- ============================================
