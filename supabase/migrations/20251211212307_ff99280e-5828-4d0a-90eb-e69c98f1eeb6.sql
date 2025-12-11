-- ============================================
-- Performance Optimization: Additional Composite Indexes
-- Context: SUPER-SPRINT C - TOP 3 Database Optimization
--
-- This migration adds composite indexes based on query analysis from:
-- - SUPER-SPRINT A & B pagination implementations
-- - Analytics and Dashboard optimized hooks
-- - Common filtering patterns in the application
--
-- These indexes complement the existing indexes from 20251209073921
-- and specifically target pagination, search, and filter operations.
--
-- Impact: Improves query performance for paginated lists and searches
-- Risk: Very low - only adding indexes, no schema or data changes
-- ============================================

-- ===========================================
-- PROJECTS TABLE - Additional Indexes
-- ===========================================

-- Index 1: Status filtering for projects
-- Query pattern: .eq('user_id', X).eq('status', Y).order('created_at', DESC)
-- Source: src/hooks/useProjects.ts - useProjectsPaginated with status filter
-- Use case: Dashboard status breakdown, filtered project lists
--
-- This index optimizes:
-- 1. Filtering by user_id (RLS)
-- 2. Filtering by status ('Nowy', 'Wycena w toku', etc.)
-- 3. Sorting by created_at DESC
CREATE INDEX IF NOT EXISTS idx_projects_user_status_created
ON public.projects(user_id, status, created_at DESC);

COMMENT ON INDEX idx_projects_user_status_created IS
'Optimizes project queries filtered by user and status, sorted by creation date. Used in pagination and dashboard stats.';

-- ===========================================
-- CLIENTS TABLE
-- ===========================================

-- Index 1: Client search optimization
-- Query pattern: .eq('user_id', X).ilike('name', '%search%').order('created_at', DESC)
-- Source: src/hooks/useClients.ts - useClientsPaginated with search
-- Use case: Client search in paginated lists
--
-- This index optimizes:
-- 1. Filtering by user_id (RLS)
-- 2. Sorting by created_at DESC (for pagination)
-- 3. Supports pattern matching on name (though ILIKE still needs full scan on name)
CREATE INDEX IF NOT EXISTS idx_clients_user_created
ON public.clients(user_id, created_at DESC);

COMMENT ON INDEX idx_clients_user_created IS
'Optimizes client queries by user, sorted by creation date. Base index for paginated client lists.';

-- Index 2: Client name pattern search (trigram index for ILIKE optimization)
-- Query pattern: .ilike('name', '%search%')
-- Source: src/hooks/useClients.ts - search functionality
--
-- This requires pg_trgm extension for efficient LIKE/ILIKE queries
-- Note: Only create if pg_trgm extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_clients_name_trgm
ON public.clients USING gin(name gin_trgm_ops);

COMMENT ON INDEX idx_clients_name_trgm IS
'Trigram index for efficient client name search with ILIKE. Significantly speeds up search queries.';

-- ===========================================
-- CALENDAR_EVENTS TABLE
-- ===========================================

-- Index 1: Event date range queries
-- Query pattern: .eq('user_id', X).gte('event_date', Y).lte('event_date', Z)
-- Source: src/hooks/useAnalyticsStats.ts - weekly events aggregation
-- Use case: Calendar view, analytics, date range filtering
--
-- This index optimizes:
-- 1. Filtering by user_id (RLS)
-- 2. Range filtering by event_date
-- 3. Sorting by event_date
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_date
ON public.calendar_events(user_id, event_date);

COMMENT ON INDEX idx_calendar_events_user_date IS
'Optimizes calendar queries filtered by user and date range. Used in analytics and calendar views.';

-- Index 2: Event type and status filtering
-- Query pattern: .eq('user_id', X).eq('event_type', Y).eq('status', Z)
-- Source: src/hooks/useAnalyticsStats.ts - event type aggregations
-- Use case: Analytics event breakdown, filtered event lists
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_type_status
ON public.calendar_events(user_id, event_type, status);

COMMENT ON INDEX idx_calendar_events_user_type_status IS
'Optimizes event queries filtered by user, type, and status. Used in analytics aggregations.';

-- ===========================================
-- QUOTES TABLE
-- ===========================================

-- Index 1: Quotes by project (most common query)
-- Query pattern: .eq('project_id', X).order('created_at', DESC)
-- Source: Various hooks fetching quotes for a project
-- Use case: Viewing all quotes for a specific project
CREATE INDEX IF NOT EXISTS idx_quotes_project_created
ON public.quotes(project_id, created_at DESC);

COMMENT ON INDEX idx_quotes_project_created IS
'Optimizes quotes queries by project, sorted by creation date. Primary index for project quote lists.';

-- Index 2: User quotes for analytics
-- Query pattern: .eq('user_id', X).order('created_at', DESC)
-- Source: src/hooks/useAnalyticsStats.ts - quote value aggregations
-- Use case: Analytics total value calculations
CREATE INDEX IF NOT EXISTS idx_quotes_user_created
ON public.quotes(user_id, created_at DESC);

COMMENT ON INDEX idx_quotes_user_created IS
'Optimizes quotes queries by user, sorted by creation date. Used in analytics and user quote lists.';

-- ===========================================
-- ITEM_TEMPLATES TABLE
-- ===========================================

-- Index 1: Template category filtering
-- Query pattern: .eq('user_id', X).eq('category', Y).order('created_at', DESC)
-- Source: src/hooks/useItemTemplates.ts - useItemTemplatesPaginated with category filter
-- Use case: Filtering templates by Materiał/Robocizna
CREATE INDEX IF NOT EXISTS idx_item_templates_user_category_created
ON public.item_templates(user_id, category, created_at DESC);

COMMENT ON INDEX idx_item_templates_user_category_created IS
'Optimizes item template queries filtered by user and category, sorted by creation date. Used in paginated template lists.';

-- Index 2: Template name search (trigram index)
-- Query pattern: .ilike('name', '%search%')
-- Source: src/hooks/useItemTemplates.ts - search functionality
CREATE INDEX IF NOT EXISTS idx_item_templates_name_trgm
ON public.item_templates USING gin(name gin_trgm_ops);

COMMENT ON INDEX idx_item_templates_name_trgm IS
'Trigram index for efficient item template name search with ILIKE. Speeds up template search.';

-- ============================================
-- PERFORMANCE ANALYSIS
-- ============================================
--
-- Expected Impact:
-- 1. Projects pagination: 40-60% faster queries (especially with status filter)
-- 2. Client search: 70-80% faster ILIKE queries (with trigram index)
-- 3. Calendar queries: 50-70% faster date range queries
-- 4. Quote aggregations: 30-50% faster (analytics)
-- 5. Item template search: 60-80% faster ILIKE queries
--
-- Storage Impact:
-- - Each B-tree index: ~10-20% of table size
-- - Trigram indexes: ~30-50% of column size
-- - Estimated total: <100 MB for typical dataset (1000 projects, 500 clients)
--
-- Maintenance:
-- - Indexes automatically maintained by PostgreSQL
-- - VACUUM and ANALYZE run automatically on Supabase
-- - No manual maintenance required
--
-- Monitoring:
-- - Use pg_stat_user_indexes to monitor index usage
-- - Use EXPLAIN ANALYZE to verify query plans use indexes
-- - Drop unused indexes after 30 days if pg_stat shows 0 usage
--
-- ============================================
-- END OF MIGRATION
-- ============================================
