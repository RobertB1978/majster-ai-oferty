-- ============================================
-- SPRINT 1: Offer System v2 — Full lifecycle + dual-token + email verification
-- Branch: claude/majster-platform-repair-175qb
-- Date: 2026-02-20
-- ============================================

-- ─────────────────────────────────────────────
-- 1. offer_approvals: dual-token + lifecycle
-- ─────────────────────────────────────────────

-- Separate 1-click accept token (distinct from public view token)
ALTER TABLE public.offer_approvals
  ADD COLUMN IF NOT EXISTS accept_token uuid DEFAULT gen_random_uuid() UNIQUE;

-- How the offer was accepted
ALTER TABLE public.offer_approvals
  ADD COLUMN IF NOT EXISTS accepted_via text
    CHECK (accepted_via IN ('email_1click', 'web_button'));

-- When client first viewed the offer
ALTER TABLE public.offer_approvals
  ADD COLUMN IF NOT EXISTS viewed_at timestamptz;

-- When contractor withdrew the offer
ALTER TABLE public.offer_approvals
  ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz;

-- Client's free-text reason for rejection
ALTER TABLE public.offer_approvals
  ADD COLUMN IF NOT EXISTS rejected_reason text;

-- Offer validity deadline (separate from token expiry)
ALTER TABLE public.offer_approvals
  ADD COLUMN IF NOT EXISTS valid_until timestamptz;

-- Full lifecycle status (extends existing 'pending'/'approved'/'rejected')
-- New allowed values: draft, sent, viewed, accepted, rejected, expired, withdrawn
ALTER TABLE public.offer_approvals
  DROP CONSTRAINT IF EXISTS offer_approvals_status_check;

ALTER TABLE public.offer_approvals
  ADD CONSTRAINT offer_approvals_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'draft', 'sent', 'viewed', 'accepted', 'expired', 'withdrawn'));

-- Index for accept_token lookups
CREATE INDEX IF NOT EXISTS idx_offer_approvals_accept_token
  ON public.offer_approvals (accept_token);

-- Index for expiry cron job
CREATE INDEX IF NOT EXISTS idx_offer_approvals_valid_until
  ON public.offer_approvals (valid_until)
  WHERE status NOT IN ('accepted', 'rejected', 'expired', 'withdrawn');

COMMENT ON COLUMN public.offer_approvals.accept_token IS '1-click accept token sent in email — separate from public_token (view-only)';
COMMENT ON COLUMN public.offer_approvals.accepted_via IS 'How the offer was accepted: email_1click or web_button';
COMMENT ON COLUMN public.offer_approvals.viewed_at IS 'When client first opened the public offer URL';
COMMENT ON COLUMN public.offer_approvals.withdrawn_at IS 'When contractor marked the offer as withdrawn';
COMMENT ON COLUMN public.offer_approvals.rejected_reason IS 'Client-provided reason for rejection (free text)';
COMMENT ON COLUMN public.offer_approvals.valid_until IS 'Offer validity deadline (UTC). Cron auto-expires offers past this date.';

-- ─────────────────────────────────────────────
-- 2. profiles: contractor reply-to email verification
-- ─────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS contact_email text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS contact_email_verified boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS contact_email_verified_at timestamptz;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS contact_email_verification_token uuid DEFAULT gen_random_uuid();

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS contact_email_verification_sent_at timestamptz;

COMMENT ON COLUMN public.profiles.contact_email IS 'Reply-To email shown to clients on offers. Must be verified before use.';
COMMENT ON COLUMN public.profiles.contact_email_verified IS 'True only after contractor clicks the verification link.';
COMMENT ON COLUMN public.profiles.contact_email_verified_at IS 'When verification was completed.';
COMMENT ON COLUMN public.profiles.contact_email_verification_token IS 'One-time token for email verification link.';
COMMENT ON COLUMN public.profiles.contact_email_verification_sent_at IS 'When the verification email was last sent.';

-- Index on verification token for fast lookup
CREATE INDEX IF NOT EXISTS idx_profiles_contact_email_verification_token
  ON public.profiles (contact_email_verification_token);

-- ─────────────────────────────────────────────
-- 3. offer_sends: delivery status tracking
-- ─────────────────────────────────────────────

ALTER TABLE public.offer_sends
  ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'queued'
    CHECK (delivery_status IN ('queued', 'sent', 'delivered', 'failed', 'bounced'));

ALTER TABLE public.offer_sends
  ADD COLUMN IF NOT EXISTS delivery_failed_at timestamptz;

ALTER TABLE public.offer_sends
  ADD COLUMN IF NOT EXISTS resend_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.offer_sends
  ADD COLUMN IF NOT EXISTS resend_message_id text;

COMMENT ON COLUMN public.offer_sends.delivery_status IS 'Email delivery lifecycle: queued→sent→delivered|failed|bounced';
COMMENT ON COLUMN public.offer_sends.delivery_failed_at IS 'When the delivery failure was detected';
COMMENT ON COLUMN public.offer_sends.resend_count IS 'Number of resend attempts for this offer email';
COMMENT ON COLUMN public.offer_sends.resend_message_id IS 'Resend API message ID for delivery tracking';

-- Index for failure banner query
CREATE INDEX IF NOT EXISTS idx_offer_sends_delivery_status
  ON public.offer_sends (delivery_status)
  WHERE delivery_status IN ('failed', 'bounced');
