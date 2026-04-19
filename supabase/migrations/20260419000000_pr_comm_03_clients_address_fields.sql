-- PR-COMM-03: Add structured address fields (postal_code, city) to clients table.
-- The existing `address` column is kept and maps to street.
-- Both columns are nullable so existing records are unaffected.
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT;

COMMENT ON COLUMN public.clients.postal_code IS 'Kod pocztowy klienta (format PL: XX-XXX)';
COMMENT ON COLUMN public.clients.city IS 'Miasto klienta';
