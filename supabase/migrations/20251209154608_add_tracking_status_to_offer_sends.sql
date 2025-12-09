-- ============================================
-- PHASE 6A: Add tracking_status to offer_sends table
-- ============================================
-- Migration: Add tracking_status column for business-level offer tracking
-- Purpose: Track business status of offers (sent/opened/pdf_viewed/accepted/rejected)
--          separately from technical email delivery status (pending/sent/failed)
-- Author: Claude Code (Phase 6A)
-- Date: 2025-12-09
-- ============================================

-- Add tracking_status column (nullable, backward compatible)
-- NULL values will be treated as 'sent' in the UI for existing records
ALTER TABLE public.offer_sends
  ADD COLUMN IF NOT EXISTS tracking_status text;

-- Add comment for documentation
COMMENT ON COLUMN public.offer_sends.tracking_status IS
  'Business tracking status of the offer: sent (default), opened, pdf_viewed, accepted, rejected. NULL = treat as sent.';

-- No default value to maintain backward compatibility
-- Existing records will have NULL, which UI treats as 'sent'
-- New records will explicitly set tracking_status

-- No indexes needed yet (tracking_status not used for filtering/sorting in Phase 6A)
-- No RLS policy changes needed (existing policies cover new column)
