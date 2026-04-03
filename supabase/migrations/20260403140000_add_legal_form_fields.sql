-- Migration: Add legal form and registration fields to profiles
-- Purpose: Support differentiation between JDG, sp. z o.o., and other legal forms
-- for proper document rendering (NIP, KRS, REGON, representative info)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS legal_form TEXT NOT NULL DEFAULT 'jdg',
  ADD COLUMN IF NOT EXISTS regon TEXT,
  ADD COLUMN IF NOT EXISTS krs TEXT,
  ADD COLUMN IF NOT EXISTS representative_name TEXT,
  ADD COLUMN IF NOT EXISTS representative_role TEXT DEFAULT 'Prezes Zarządu';

-- Constraint: legal_form must be one of the allowed values
ALTER TABLE profiles
  ADD CONSTRAINT profiles_legal_form_check
  CHECK (legal_form IN ('jdg', 'sp_z_oo', 'spolka_cywilna', 'inne'));

COMMENT ON COLUMN profiles.legal_form IS 'Business legal form: jdg (sole proprietor), sp_z_oo (LLC), spolka_cywilna (civil partnership), inne (other)';
COMMENT ON COLUMN profiles.regon IS 'REGON — Polish Business Registry Number (9 or 14 digits)';
COMMENT ON COLUMN profiles.krs IS 'KRS — Polish National Court Register Number (10 digits, required for sp. z o.o.)';
COMMENT ON COLUMN profiles.representative_name IS 'Legal representative name (person signing documents). For JDG = owner_name.';
COMMENT ON COLUMN profiles.representative_role IS 'Legal representative role/title (e.g. Prezes Zarządu, Właściciel)';
