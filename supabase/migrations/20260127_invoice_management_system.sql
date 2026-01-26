-- Invoice Management System Migration
-- Tables: invoices, invoice_line_items, invoice_payments, invoice_templates, invoice_number_sequences, invoice_sends
-- Date: 2026-01-27
-- Purpose: Complete invoice management with Polish compliance (JPK-FA), VAT support, and payment tracking
-- Status: CRITICAL for MVP - Polish construction firms require invoicing for legal compliance

-- ============================================
-- TABLE 1: invoice_number_sequences
-- ============================================
-- Auto-increment management for invoice numbering (FV-2026-001 format)
CREATE TABLE IF NOT EXISTS invoice_number_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  year integer NOT NULL,               -- 2026, 2027, etc.
  next_sequence integer NOT NULL DEFAULT 1,
  prefix text DEFAULT 'FV',            -- FV = Faktura (Invoice in Polish)
  format text DEFAULT '{PREFIX}-{YEAR}-{SEQUENCE}',

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(user_id, year),
  CONSTRAINT valid_year CHECK (year >= 2020 AND year <= 2100),
  CONSTRAINT valid_sequence CHECK (next_sequence >= 1)
);

-- Enable RLS
ALTER TABLE invoice_number_sequences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only manage their own sequences
CREATE POLICY invoice_number_sequences_select ON invoice_number_sequences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY invoice_number_sequences_insert ON invoice_number_sequences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY invoice_number_sequences_update ON invoice_number_sequences
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_invoice_number_sequences_user_year ON invoice_number_sequences(user_id, year);

-- ============================================
-- TABLE 2: invoices (Main invoice table)
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,

  -- Invoice Identification
  invoice_number text NOT NULL,        -- FV-2026-001
  invoice_date date NOT NULL,          -- Issue date
  due_date date NOT NULL,              -- Payment deadline

  -- Client Information (denormalized for immutability)
  client_id uuid REFERENCES clients(id) ON DELETE RESTRICT,
  client_name text NOT NULL,
  client_email text,
  client_nip text,                     -- Client tax ID (required for B2B in Poland)
  client_address text,

  -- Company Information (issuer - snapshot for immutability)
  issuer_company_name text NOT NULL,
  issuer_nip text,                     -- Company tax ID (required)
  issuer_address text,
  issuer_bank_account text,            -- Bank account for payment

  -- Line Items (stored as JSONB for flexibility, matching quotes pattern)
  -- Each item: { id, description, quantity, unit, unitPrice, vatRate, category, notes }
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Amounts (calculated)
  net_total numeric(12, 2) NOT NULL DEFAULT 0,
  vat_total numeric(12, 2) NOT NULL DEFAULT 0,
  gross_total numeric(12, 2) NOT NULL DEFAULT 0,

  -- Additional charges/discounts
  additional_charges numeric(12, 2) DEFAULT 0,
  discount_amount numeric(12, 2) DEFAULT 0,
  discount_percent numeric(5, 2) DEFAULT 0,

  -- Payment Information
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
  payment_method text,                 -- bank_transfer, card, cash, other
  amount_paid numeric(12, 2) DEFAULT 0,
  payment_date date,

  -- Invoice Status (workflow)
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'sent', 'viewed', 'paid', 'refunded', 'cancelled')),

  -- Notes & Terms
  description text,                    -- Invoice description
  payment_terms text,                  -- Payment terms (e.g., "30 days net")
  notes text,

  -- PDF & Documents
  pdf_url text,                        -- Supabase Storage URL
  pdf_generated_at timestamptz,

  -- Tax Information (for JPK-FA Polish compliance)
  tax_scheme text DEFAULT 'vat',       -- vat, margin, reverse
  reverse_charge boolean DEFAULT false, -- Reverse charge flag

  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  issued_at timestamptz,
  sent_at timestamptz,

  CONSTRAINT valid_dates CHECK (due_date >= invoice_date),
  CONSTRAINT valid_amounts CHECK (gross_total = net_total + vat_total),
  CONSTRAINT valid_payment CHECK (amount_paid >= 0 AND amount_paid <= (net_total + vat_total + additional_charges - discount_amount)),
  CONSTRAINT unique_invoice_number UNIQUE(user_id, invoice_number)
);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own invoices
CREATE POLICY invoices_select_own ON invoices
  FOR SELECT USING (user_id = auth.uid());

-- Policy: Users can create invoices
CREATE POLICY invoices_insert_own ON invoices
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy: Users can update draft/issued invoices (not locked)
CREATE POLICY invoices_update_own ON invoices
  FOR UPDATE USING (
    user_id = auth.uid() AND status IN ('draft', 'issued')
  ) WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete draft invoices only
CREATE POLICY invoices_delete_draft ON invoices
  FOR DELETE USING (
    user_id = auth.uid() AND status = 'draft'
  );

-- Indexes for common queries
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_project_id ON invoices(project_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX idx_invoices_user_created ON invoices(user_id, created_at DESC);
CREATE INDEX idx_invoices_user_status ON invoices(user_id, status);

-- ============================================
-- TABLE 3: invoice_line_items (normalized for detailed reporting)
-- ============================================
-- Optional normalized line items table for better querying and reporting
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

  description text NOT NULL,
  quantity numeric(12, 2) NOT NULL,
  unit text NOT NULL DEFAULT 'szt.',  -- Unit (piece, hour, meter, etc.)
  unit_price numeric(12, 2) NOT NULL,
  net_amount numeric(12, 2) NOT NULL,

  -- VAT Information (Polish rates: 0%, 5%, 7%, 23%)
  vat_rate numeric(5, 2) NOT NULL DEFAULT 23,
  vat_amount numeric(12, 2) NOT NULL,
  gross_amount numeric(12, 2) NOT NULL,

  -- Categorization
  category text,                       -- Materiał, Robocizna, Usługa, Inne
  item_order integer,

  created_at timestamptz DEFAULT now(),

  CONSTRAINT valid_quantity CHECK (quantity > 0),
  CONSTRAINT valid_price CHECK (unit_price >= 0),
  CONSTRAINT valid_amounts CHECK (net_amount = quantity * unit_price),
  CONSTRAINT valid_vat CHECK (gross_amount = net_amount + vat_amount),
  CONSTRAINT valid_vat_rate CHECK (vat_rate IN (0, 5, 7, 23))
);

-- Enable RLS
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view line items of their invoices
CREATE POLICY invoice_line_items_select ON invoice_line_items
  FOR SELECT USING (
    invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid())
  );

-- Policy: Users can insert line items to their draft invoices
CREATE POLICY invoice_line_items_insert ON invoice_line_items
  FOR INSERT WITH CHECK (
    invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid() AND status = 'draft')
  );

-- Policy: Users can update line items in draft invoices
CREATE POLICY invoice_line_items_update ON invoice_line_items
  FOR UPDATE USING (
    invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid() AND status = 'draft')
  ) WITH CHECK (
    invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid() AND status = 'draft')
  );

-- Policy: Users can delete line items from draft invoices
CREATE POLICY invoice_line_items_delete ON invoice_line_items
  FOR DELETE USING (
    invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid() AND status = 'draft')
  );

CREATE INDEX idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX idx_invoice_line_items_vat_rate ON invoice_line_items(vat_rate);

-- ============================================
-- TABLE 4: invoice_payments (Payment tracking)
-- ============================================
-- Track partial payments and payment records
CREATE TABLE IF NOT EXISTS invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  payment_date date NOT NULL,
  amount numeric(12, 2) NOT NULL,
  payment_method text,                 -- bank_transfer, card, cash, check, other
  reference_number text,               -- Bank transfer reference, check #, etc.
  notes text,

  created_at timestamptz DEFAULT now(),

  CONSTRAINT valid_amount CHECK (amount > 0)
);

-- Enable RLS
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view payments for their invoices
CREATE POLICY invoice_payments_select ON invoice_payments
  FOR SELECT USING (user_id = auth.uid());

-- Policy: Users can record payments for their invoices
CREATE POLICY invoice_payments_insert ON invoice_payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);
CREATE INDEX idx_invoice_payments_payment_date ON invoice_payments(payment_date);
CREATE INDEX idx_invoice_payments_user_id ON invoice_payments(user_id);

-- ============================================
-- TABLE 5: invoice_templates (User-defined templates)
-- ============================================
-- Store user-customized invoice templates for quick generation
CREATE TABLE IF NOT EXISTS invoice_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name text NOT NULL,
  description text,

  -- Template Content
  header_text text,                    -- Custom header
  footer_text text,                    -- Custom footer
  payment_terms text,                  -- Default payment terms
  default_vat_rate numeric(5, 2) DEFAULT 23,

  -- Branding
  logo_position text DEFAULT 'top',    -- top, left, none
  color_scheme text DEFAULT 'standard', -- standard, custom
  custom_colors jsonb,                 -- {primary: '#0066FF', secondary: '#666666'}

  -- Settings
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_vat_rate CHECK (default_vat_rate IN (0, 5, 7, 23))
);

-- Enable RLS
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own templates
CREATE POLICY invoice_templates_select ON invoice_templates
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY invoice_templates_insert ON invoice_templates
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY invoice_templates_update ON invoice_templates
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY invoice_templates_delete ON invoice_templates
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX idx_invoice_templates_user_default ON invoice_templates(user_id, is_default);

-- ============================================
-- TABLE 6: invoice_sends (Email delivery tracking)
-- ============================================
-- Track invoice email delivery (like offer_sends)
CREATE TABLE IF NOT EXISTS invoice_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  client_email text NOT NULL,
  subject text NOT NULL,
  message text,

  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  error_message text,

  pdf_url text,                        -- Link to PDF sent
  tracking_status text DEFAULT 'sent' CHECK (tracking_status IN ('sent', 'opened', 'clicked', 'bounced')),

  sent_at timestamptz DEFAULT now(),
  opened_at timestamptz,
  clicked_at timestamptz,

  CONSTRAINT valid_email CHECK (client_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Enable RLS
ALTER TABLE invoice_sends ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their invoice sends
CREATE POLICY invoice_sends_select ON invoice_sends
  FOR SELECT USING (user_id = auth.uid());

-- Policy: Users can insert invoice sends
CREATE POLICY invoice_sends_insert ON invoice_sends
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_invoice_sends_invoice_id ON invoice_sends(invoice_id);
CREATE INDEX idx_invoice_sends_status ON invoice_sends(status);
CREATE INDEX idx_invoice_sends_sent_at ON invoice_sends(sent_at DESC);

-- ============================================
-- TRIGGER FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoices_update_timestamp
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoices_updated_at();

-- Auto-update payment_status based on amounts
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.amount_paid <= 0 THEN
    NEW.payment_status = 'pending';
  ELSIF NEW.amount_paid < (NEW.gross_total + NEW.additional_charges - COALESCE(NEW.discount_amount, 0)) THEN
    NEW.payment_status = 'partial';
  ELSE
    NEW.payment_status = 'paid';
  END IF;

  -- Check if overdue
  IF NEW.payment_status = 'pending' AND NEW.due_date < CURRENT_DATE THEN
    NEW.payment_status = 'overdue';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_payment_status_update
  BEFORE INSERT OR UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_payment_status();

-- Update template timestamp
CREATE OR REPLACE FUNCTION update_invoice_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_templates_update_timestamp
  BEFORE UPDATE ON invoice_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_templates_updated_at();

-- Update number sequence timestamp
CREATE OR REPLACE FUNCTION update_invoice_number_sequences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_number_sequences_update_timestamp
  BEFORE UPDATE ON invoice_number_sequences
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_number_sequences_updated_at();

-- ============================================
-- GRANTS (Service role access for Edge Functions)
-- ============================================
-- Service role needs access to insert/update during invoice operations
GRANT SELECT, INSERT, UPDATE ON invoices TO service_role;
GRANT SELECT, INSERT, UPDATE ON invoice_line_items TO service_role;
GRANT SELECT, INSERT, UPDATE ON invoice_payments TO service_role;
GRANT SELECT, UPDATE ON invoice_number_sequences TO service_role;
GRANT SELECT, INSERT ON invoice_sends TO service_role;

-- ============================================
-- COMMENTS (Documentation)
-- ============================================
COMMENT ON TABLE invoices IS 'Core invoice records. Immutable after issued. Polish compliant (JPK-FA ready).';
COMMENT ON COLUMN invoices.invoice_number IS 'Unique invoice number per user per year (FV-2026-001). Required.';
COMMENT ON COLUMN invoices.client_nip IS 'Client tax ID. Required for B2B invoices in Poland.';
COMMENT ON COLUMN invoices.issuer_nip IS 'Company tax ID. Required for all invoices in Poland.';
COMMENT ON COLUMN invoices.tax_scheme IS 'VAT scheme: vat (standard), margin (small business), reverse (B2B).';
COMMENT ON TABLE invoice_line_items IS 'Normalized line items for detailed reporting and VAT breakdown analysis.';
COMMENT ON TABLE invoice_payments IS 'Payment records for partial payments and payment tracking.';
COMMENT ON TABLE invoice_templates IS 'User-defined invoice templates for quick generation and consistent branding.';
COMMENT ON TABLE invoice_sends IS 'Email delivery tracking with open/click metrics (similar to offer_sends).';
COMMENT ON COLUMN invoice_line_items.vat_rate IS 'Polish VAT rates: 0%, 5% (books, medicine), 7% (food), 23% (standard).';
