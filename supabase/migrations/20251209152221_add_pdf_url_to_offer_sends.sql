-- ============================================
-- PHASE 5C: Add PDF URL fields to offer_sends table
-- ============================================
-- Migration: Add pdf_url and pdf_generated_at columns
-- Purpose: Store PDF offer links in offer send history
-- Author: Claude Code (Phase 5C)
-- Date: 2025-12-09
-- ============================================

-- Add pdf_url column (nullable, backward compatible)
ALTER TABLE public.offer_sends
  ADD COLUMN IF NOT EXISTS pdf_url text;

-- Add pdf_generated_at column (nullable, backward compatible)
ALTER TABLE public.offer_sends
  ADD COLUMN IF NOT EXISTS pdf_generated_at timestamptz;

-- Add comment for documentation
COMMENT ON COLUMN public.offer_sends.pdf_url IS 'Public URL of generated PDF offer stored in Supabase Storage (company-documents bucket)';
COMMENT ON COLUMN public.offer_sends.pdf_generated_at IS 'Timestamp when PDF was generated and uploaded to storage';

-- No indexes needed yet (pdf_url is not used for filtering/sorting in current phase)
-- No RLS policy changes needed (existing policies cover new columns)
