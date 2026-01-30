/**
 * Generate Invoice PDF
 * Serverless function to generate professional Polish invoice PDFs
 * Uses HTML to PDF conversion with proper formatting
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceRole);

interface GenerateInvoicePdfRequest {
  invoiceId: string;
  template?: 'standard' | 'premium';
}

interface InvoiceData {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  client_name: string;
  client_nip?: string;
  client_email?: string;
  client_address?: string;
  issuer_company_name: string;
  issuer_nip?: string;
  issuer_address?: string;
  issuer_bank_account?: string;
  line_items: InvoiceLineItem[];
  net_total: number;
  vat_total: number;
  gross_total: number;
  payment_terms?: string;
  notes?: string;
}

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  netAmount: number;
  vatRate: number;
  vatAmount: number;
  grossAmount: number;
}

// ============================================
// Helper Functions
// ============================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

// ============================================
// PDF HTML Template
// ============================================

function generateInvoiceHTML(invoice: InvoiceData): string {
  const issuerInfo = `
    <div class="issuer">
      <h3>${invoice.issuer_company_name}</h3>
      ${invoice.issuer_nip ? `<p><strong>NIP:</strong> ${invoice.issuer_nip}</p>` : ''}
      ${invoice.issuer_address ? `<p>${invoice.issuer_address}</p>` : ''}
      ${invoice.issuer_bank_account ? `<p><strong>Konto:</strong> ${invoice.issuer_bank_account}</p>` : ''}
    </div>
  `;

  const clientInfo = `
    <div class="client">
      <h4>Nabywca</h4>
      <p><strong>${invoice.client_name}</strong></p>
      ${invoice.client_nip ? `<p>NIP: ${invoice.client_nip}</p>` : ''}
      ${invoice.client_address ? `<p>${invoice.client_address}</p>` : ''}
      ${invoice.client_email ? `<p>${invoice.client_email}</p>` : ''}
    </div>
  `;

  const _lineItemsHTML = invoice.line_items
    .map(
      (item) => `
    <tr>
      <td>${item.description}</td>
      <td class="center">${item.quantity.toFixed(2)}</td>
      <td class="center">${item.unit}</td>
      <td class="right">${formatCurrency(item.unitPrice)}</td>
      <td class="right">${formatCurrency(item.netAmount)}</td>
      <td class="center">${item.vatRate}%</td>
      <td class="right">${formatCurrency(item.vatAmount)}</td>
      <td class="right">${formatCurrency(item.grossAmount)}</td>
    </tr>
  `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Faktura ${invoice.invoice_number}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Arial', sans-serif;
          font-size: 11pt;
          line-height: 1.4;
          color: #333;
          background: white;
        }

        .container {
          width: 210mm;
          height: 297mm;
          padding: 20mm;
          margin: 0 auto;
          background: white;
        }

        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30mm;
          border-bottom: 2px solid #0066FF;
          padding-bottom: 10mm;
        }

        .issuer {
          flex: 1;
        }

        .issuer h3 {
          font-size: 16pt;
          margin-bottom: 5mm;
          color: #0066FF;
        }

        .issuer p {
          margin-bottom: 3mm;
          font-size: 10pt;
        }

        .invoice-title {
          flex: 1;
          text-align: right;
        }

        .invoice-title h1 {
          font-size: 24pt;
          color: #0066FF;
          margin-bottom: 5mm;
        }

        .invoice-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30mm;
          margin-bottom: 20mm;
        }

        .client {
          background: #f5f5f5;
          padding: 10mm;
          border-radius: 4mm;
        }

        .client h4 {
          margin-bottom: 5mm;
          font-size: 11pt;
          color: #0066FF;
        }

        .client p {
          margin-bottom: 3mm;
          font-size: 10pt;
        }

        .invoice-meta {
          background: #f5f5f5;
          padding: 10mm;
          border-radius: 4mm;
        }

        .meta-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3mm;
          font-size: 10pt;
        }

        .meta-row strong {
          min-width: 80mm;
        }

        table {
          width: 100%;
          margin-bottom: 20mm;
          border-collapse: collapse;
        }

        table th {
          background: #0066FF;
          color: white;
          padding: 5mm;
          text-align: left;
          font-size: 9pt;
          font-weight: bold;
          border: 1px solid #0066FF;
        }

        table td {
          padding: 5mm;
          border: 1px solid #ddd;
          font-size: 10pt;
        }

        table tr:nth-child(even) {
          background: #fafafa;
        }

        .center {
          text-align: center;
        }

        .right {
          text-align: right;
        }

        .totals {
          margin-left: auto;
          width: 60%;
          margin-bottom: 20mm;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 5mm;
          border-bottom: 1px solid #ddd;
        }

        .total-row.final {
          background: #0066FF;
          color: white;
          font-weight: bold;
          font-size: 12pt;
          border-bottom: none;
          border-radius: 4mm;
        }

        .notes {
          background: #f5f5f5;
          padding: 10mm;
          border-radius: 4mm;
          margin-bottom: 20mm;
          font-size: 9pt;
        }

        .footer {
          border-top: 1px solid #ddd;
          padding-top: 10mm;
          text-align: center;
          font-size: 9pt;
          color: #666;
        }

        .page-break {
          page-break-after: always;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="issuer">
            ${issuerInfo}
          </div>
          <div class="invoice-title">
            <h1>FAKTURA</h1>
            <p style="color: #0066FF; font-weight: bold; font-size: 12pt;">${invoice.invoice_number}</p>
          </div>
        </div>

        <div class="invoice-info">
          ${clientInfo}
          <div class="invoice-meta">
            <div class="meta-row">
              <strong>Data wystawienia:</strong>
              <span>${formatDate(invoice.invoice_date)}</span>
            </div>
            <div class="meta-row">
              <strong>Termin płatności:</strong>
              <span>${formatDate(invoice.due_date)}</span>
            </div>
            ${invoice.payment_terms ? `
            <div class="meta-row">
              <strong>Warunki płatności:</strong>
              <span>${invoice.payment_terms}</span>
            </div>
            ` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Lp.</th>
              <th>Opis</th>
              <th>Ilość</th>
              <th>J.m.</th>
              <th>Cena j.</th>
              <th>Wartość netto</th>
              <th>VAT %</th>
              <th>VAT</th>
              <th>Wartość brutto</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.line_items
              .map(
                (item, index) => `
              <tr>
                <td class="center">${index + 1}</td>
                <td>${item.description}</td>
                <td class="center">${item.quantity.toFixed(2)}</td>
                <td class="center">${item.unit}</td>
                <td class="right">${formatCurrency(item.unitPrice)}</td>
                <td class="right">${formatCurrency(item.netAmount)}</td>
                <td class="center">${item.vatRate}%</td>
                <td class="right">${formatCurrency(item.vatAmount)}</td>
                <td class="right">${formatCurrency(item.grossAmount)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Razem netto:</span>
            <span>${formatCurrency(invoice.net_total)}</span>
          </div>
          <div class="total-row">
            <span>Razem VAT:</span>
            <span>${formatCurrency(invoice.vat_total)}</span>
          </div>
          <div class="total-row final">
            <span>RAZEM:</span>
            <span>${formatCurrency(invoice.gross_total)}</span>
          </div>
        </div>

        ${invoice.notes ? `
        <div class="notes">
          <strong>Uwagi:</strong>
          <p>${invoice.notes}</p>
        </div>
        ` : ''}

        <div class="footer">
          <p>Faktura wystawiona automatycznie przez system Majster.AI</p>
          <p>Data wygenerowania: ${formatDate(new Date().toISOString())}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ============================================
// Main Function
// ============================================

serve(async (req: Request) => {
  try {
    // Verify request method
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { invoiceId, template: _template = 'standard' } = (await req.json()) as GenerateInvoicePdfRequest;

    if (!invoiceId) {
      return new Response(JSON.stringify({ error: 'invoiceId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch invoice from database
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (fetchError || !invoice) {
      return new Response(
        JSON.stringify({
          error: 'Invoice not found',
          details: fetchError?.message,
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const invoiceData = invoice as InvoiceData;

    // Generate HTML
    const html = generateInvoiceHTML(invoiceData);

    // For now, return HTML. In production, convert to PDF using external service
    // Options:
    // 1. Puppeteer (requires headless browser)
    // 2. Deno's built-in PDF module (if available)
    // 3. External API (pdfkit, wkhtmltopdf service, etc.)

    // TODO: Integrate with PDF generation service
    // For now, return HTML that can be printed to PDF client-side

    return new Response(
      JSON.stringify({
        success: true,
        html,
        invoiceNumber: invoiceData.invoice_number,
        message: 'HTML generated. Use browser print to PDF or integrate PDF generation service.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Generate invoice PDF error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
