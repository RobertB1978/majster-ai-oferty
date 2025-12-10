-- ============================================
-- PHASE 7B: Harden tracking_status to NOT NULL
-- ============================================
-- Migration: Make tracking_status NOT NULL with default 'sent'
-- Purpose: Ensure all offer_sends records have a valid tracking_status
--          Prevents NULL values that could break follow-up logic and stats
-- Author: Claude Code (Phase 7B)
-- Date: 2025-12-09
-- ============================================

-- Step 1: Backfill NULL values to 'sent' (safe default for existing records)
-- This ensures backward compatibility - all old records treated as sent
UPDATE public.offer_sends
  SET tracking_status = 'sent'
  WHERE tracking_status IS NULL;

-- Step 2: Add NOT NULL constraint
-- Now safe because all NULL values have been backfilled
ALTER TABLE public.offer_sends
  ALTER COLUMN tracking_status SET NOT NULL;

-- Step 3: Add DEFAULT 'sent' for new inserts
-- Ensures new records always have a value even if not explicitly provided
ALTER TABLE public.offer_sends
  ALTER COLUMN tracking_status SET DEFAULT 'sent';

-- Update comment to reflect NOT NULL constraint
COMMENT ON COLUMN public.offer_sends.tracking_status IS
  'Business tracking status of the offer: sent (default), opened, pdf_viewed, accepted, rejected. NOT NULL with default ''sent''.';

-- No indexes needed (tracking_status not used for filtering/sorting yet)
-- No RLS policy changes needed (existing policies cover the column)
