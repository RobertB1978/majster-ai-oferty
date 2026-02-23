-- Add vat_rate column to pdf_data table
-- null  = seller is VAT-exempt (zwolniony z VAT)
-- 0     = 0% rate
-- 5     = 5% rate
-- 8     = 8% reduced rate (most renovation/construction services)
-- 23    = 23% standard rate

ALTER TABLE pdf_data
  ADD COLUMN IF NOT EXISTS vat_rate integer;
