/**
 * Invoice System Types
 * Complete type definitions for invoice management with Polish compliance (JPK-FA)
 */

// ============================================
// VAT Configuration
// ============================================

export const POLISH_VAT_RATES = {
  ZERO: 0,           // Books, medicine, etc.
  REDUCED_LOW: 5,    // Books, newspapers
  REDUCED_HIGH: 7,   // Basic food, hotel
  STANDARD: 23,      // Standard rate
} as const;

export type VATRate = typeof POLISH_VAT_RATES[keyof typeof POLISH_VAT_RATES];

// ============================================
// Line Items
// ============================================

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;               // szt., h, m, m2, m3, etc.
  unitPrice: number;
  netAmount: number;
  category?: 'Materiał' | 'Robocizna' | 'Usługa' | 'Inne';
  vatRate: VATRate;
  vatAmount: number;
  grossAmount: number;
  notes?: string;
  itemOrder?: number;
}

// ============================================
// Main Invoice Type
// ============================================

export type InvoiceStatus = 'draft' | 'issued' | 'sent' | 'viewed' | 'paid' | 'refunded' | 'cancelled';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'bank_transfer' | 'card' | 'cash' | 'check' | 'other';
export type TaxScheme = 'vat' | 'margin' | 'reverse';

export interface Invoice {
  // Primary Key & Foreign Keys
  id: string;
  user_id: string;
  organization_id?: string;
  project_id?: string;

  // Numbering & Dates
  invoice_number: string;              // FV-2026-001 format
  invoice_date: string;                // ISO date
  due_date: string;                    // ISO date
  issued_at?: string;                  // ISO timestamp
  sent_at?: string;                    // ISO timestamp

  // Client Information (denormalized)
  client_id?: string;
  client_name: string;                 // Required
  client_email?: string;
  client_nip?: string;                 // Tax ID - required for B2B
  client_address?: string;

  // Issuer/Company Information (snapshot)
  issuer_company_name: string;         // Required
  issuer_nip?: string;                 // Tax ID - required
  issuer_address?: string;
  issuer_bank_account?: string;

  // Line Items
  line_items: InvoiceLineItem[];

  // Totals
  net_total: number;
  vat_total: number;
  gross_total: number;
  additional_charges?: number;
  discount_amount?: number;
  discount_percent?: number;

  // Payment Information
  payment_status: PaymentStatus;
  amount_paid: number;
  payment_date?: string;
  payment_method?: PaymentMethod;

  // Invoice Status
  status: InvoiceStatus;

  // Content
  description?: string;
  payment_terms?: string;              // E.g., "30 days net"
  notes?: string;

  // Documents
  pdf_url?: string;
  pdf_generated_at?: string;

  // Tax Compliance (JPK-FA)
  tax_scheme: TaxScheme;               // Default: 'vat'
  reverse_charge?: boolean;

  // Timestamps
  created_at: string;                  // ISO timestamp
  updated_at: string;                  // ISO timestamp
}

// ============================================
// Invoice Operations & Mutations
// ============================================

export interface CreateInvoiceInput {
  project_id?: string;
  client_id: string;
  client_name: string;
  client_email?: string;
  client_nip?: string;
  client_address?: string;

  issuer_company_name: string;
  issuer_nip?: string;
  issuer_address?: string;
  issuer_bank_account?: string;

  invoice_date: string;
  due_date: string;
  line_items: Omit<InvoiceLineItem, 'id' | 'netAmount' | 'vatAmount' | 'grossAmount'>[];

  description?: string;
  payment_terms?: string;
  notes?: string;
  discount_percent?: number;

  tax_scheme?: TaxScheme;
}

export interface UpdateInvoiceInput {
  // Only draft/issued invoices can be updated
  client_email?: string;
  client_nip?: string;
  client_address?: string;

  issuer_nip?: string;
  issuer_address?: string;
  issuer_bank_account?: string;

  due_date?: string;
  line_items?: Omit<InvoiceLineItem, 'id' | 'netAmount' | 'vatAmount' | 'grossAmount'>[];

  description?: string;
  payment_terms?: string;
  notes?: string;
  discount_percent?: number;
}

export interface PublishInvoiceInput {
  // Change status from draft to issued
  issued_at?: string;
}

export interface SendInvoiceInput {
  client_email: string;
  subject?: string;
  message?: string;
  includePdf?: boolean;
}

// ============================================
// Payment Recording
// ============================================

export interface RecordPaymentInput {
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number?: string;           // Bank transfer ref, check #, etc.
  notes?: string;
}

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  user_id: string;
  payment_date: string;
  amount: number;
  payment_method?: PaymentMethod;
  reference_number?: string;
  notes?: string;
  created_at: string;
}

// ============================================
// Templates
// ============================================

export type ColorScheme = 'standard' | 'custom';
export type LogoPosition = 'top' | 'left' | 'none';

export interface CustomColors {
  primary?: string;                    // Hex color
  secondary?: string;                  // Hex color
  accent?: string;                     // Hex color
}

export interface InvoiceTemplate {
  id: string;
  user_id: string;

  name: string;
  description?: string;

  // Content
  header_text?: string;
  footer_text?: string;
  payment_terms?: string;
  default_vat_rate: VATRate;

  // Branding
  logo_position: LogoPosition;
  color_scheme: ColorScheme;
  custom_colors?: CustomColors;

  // Settings
  is_default: boolean;
  is_active: boolean;

  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceTemplateInput {
  name: string;
  description?: string;
  header_text?: string;
  footer_text?: string;
  payment_terms?: string;
  default_vat_rate?: VATRate;
  logo_position?: LogoPosition;
  color_scheme?: ColorScheme;
  custom_colors?: CustomColors;
}

// ============================================
// Email Tracking
// ============================================

export type SendStatus = 'pending' | 'sent' | 'failed' | 'bounced';
export type TrackingStatus = 'sent' | 'opened' | 'clicked' | 'bounced';

export interface InvoiceSend {
  id: string;
  invoice_id: string;
  user_id: string;

  client_email: string;
  subject: string;
  message?: string;

  status: SendStatus;
  error_message?: string;
  pdf_url?: string;
  tracking_status: TrackingStatus;

  sent_at: string;
  opened_at?: string;
  clicked_at?: string;
}

// ============================================
// Numbering System
// ============================================

export interface InvoiceNumberSequence {
  id: string;
  user_id: string;
  year: number;
  next_sequence: number;
  prefix: string;                      // Default: 'FV'
  format: string;                      // Default: '{PREFIX}-{YEAR}-{SEQUENCE}'
  created_at: string;
  updated_at: string;
}

// ============================================
// VAT Calculations
// ============================================

export interface VATCalculation {
  netAmount: number;
  vatRate: VATRate;
  vatAmount: number;
  grossAmount: number;
}

export interface VATBreakdown {
  [key: string]: {
    rate: VATRate;
    netAmount: number;
    vatAmount: number;
  };
  total: {
    netAmount: number;
    vatAmount: number;
    grossAmount: number;
  };
}

// ============================================
// Validation Results
// ============================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface InvoiceValidation {
  valid: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[];
}

// ============================================
// JPK-FA Polish Compliance
// ============================================

export interface JPKFACompliance {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface JPKFARecord {
  invoiceNumber: string;
  invoiceDate: string;
  issuer_nip: string;
  issuer_name: string;
  client_nip: string;
  client_name: string;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  vatRate: VATRate;
  tax_scheme: TaxScheme;
}

// ============================================
// Query Filters & Options
// ============================================

export interface InvoiceFilters {
  status?: InvoiceStatus[];
  paymentStatus?: PaymentStatus[];
  dateFrom?: string;
  dateTo?: string;
  clientId?: string;
  projectId?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;                     // Search in invoice number, client name
}

export interface InvoiceSortOptions {
  field: 'invoice_number' | 'invoice_date' | 'due_date' | 'gross_total' | 'created_at';
  direction: 'asc' | 'desc';
}

export interface InvoiceQueryOptions {
  filters?: InvoiceFilters;
  sort?: InvoiceSortOptions;
  limit?: number;
  offset?: number;
}

// ============================================
// Statistics & Reporting
// ============================================

export interface InvoiceStats {
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  averageInvoiceAmount: number;
  averagePaymentTime: number;         // Days
  conversionRate: number;              // Percentage of paid invoices
}

export interface MonthlyInvoiceMetrics {
  month: string;                       // YYYY-MM
  invoiceCount: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

// ============================================
// Response Types
// ============================================

export interface InvoiceResponse {
  success: boolean;
  data?: Invoice;
  error?: string;
}

export interface InvoicesListResponse {
  success: boolean;
  data?: Invoice[];
  total?: number;
  error?: string;
}

export interface GeneratePdfResponse {
  success: boolean;
  pdf_url?: string;
  error?: string;
}

export interface SendInvoiceResponse {
  success: boolean;
  send_id?: string;
  tracking_id?: string;
  error?: string;
}
