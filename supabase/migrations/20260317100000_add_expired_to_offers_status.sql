-- Migration: add EXPIRED to offers.status CHECK constraint
-- PR: schema gap fix — EXPIRED was missing from allowed statuses
-- Safe: DROP + ADD CONSTRAINT only, no data changes, no table alterations.

ALTER TABLE public.offers
  DROP CONSTRAINT IF EXISTS offers_status_check;

ALTER TABLE public.offers
  ADD CONSTRAINT offers_status_check
    CHECK (status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'ARCHIVED', 'EXPIRED'));

COMMENT ON COLUMN public.offers.status IS
  'Offer lifecycle: DRAFT → SENT → ACCEPTED | REJECTED | ARCHIVED | EXPIRED';
