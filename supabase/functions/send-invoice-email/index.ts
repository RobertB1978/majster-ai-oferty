/**
 * Send Invoice Email
 * Serverless function to send invoices via email (Resend integration)
 * Similar to send-offer-email but for invoices
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
const frontendUrl = Deno.env.get('FRONTEND_URL')!;

const supabase = createClient(supabaseUrl, supabaseServiceRole);

interface SendInvoiceEmailRequest {
  invoiceId: string;
  clientEmail: string;
  subject?: string;
  message?: string;
  includePdf?: boolean;
}

interface InvoiceData {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  client_name: string;
  gross_total: number;
  issuer_company_name: string;
  pdf_url?: string;
}

// ============================================
// Email Template
// ============================================

function generateEmailHTML(invoice: InvoiceData, customMessage?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #fff;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
        .header {
          background: linear-gradient(135deg, #0066FF 0%, #0052CC 100%);
          color: white;
          padding: 20px;
          border-radius: 8px 8px 0 0;
          margin: -20px -20px 20px -20px;
        }
        h1 {
          margin: 0;
          font-size: 24px;
        }
        .invoice-number {
          font-size: 14px;
          opacity: 0.9;
        }
        .invoice-details {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .total {
          font-size: 18px;
          font-weight: bold;
          color: #0066FF;
        }
        .button {
          display: inline-block;
          background: #0066FF;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 4px;
          margin-top: 20px;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 12px;
          border-top: 1px solid #ddd;
          padding-top: 20px;
        }
        .message {
          background: #e8f4f8;
          border-left: 4px solid #0066FF;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Nowa Faktura</h1>
          <p class="invoice-number">Numer: ${invoice.invoice_number}</p>
        </div>

        <p>Szanowni Państwo,</p>

        <p>Wysyłamy Państwu fakturę z naszej firmy <strong>${invoice.issuer_company_name}</strong>.</p>

        <div class="invoice-details">
          <div class="detail-row">
            <span>Numer faktury:</span>
            <strong>${invoice.invoice_number}</strong>
          </div>
          <div class="detail-row">
            <span>Data wystawienia:</span>
            <strong>${new Date(invoice.invoice_date).toLocaleDateString('pl-PL')}</strong>
          </div>
          <div class="detail-row">
            <span>Termin płatności:</span>
            <strong>${new Date(invoice.due_date).toLocaleDateString('pl-PL')}</strong>
          </div>
          <div class="detail-row total">
            <span>Kwota brutto:</span>
            <span>${invoice.gross_total.toLocaleString('pl-PL', {
              style: 'currency',
              currency: 'PLN',
            })}</span>
          </div>
        </div>

        ${customMessage ? `<div class="message">${customMessage}</div>` : ''}

        <p>Aby pobrać pełny dokument, kliknij poniżej:</p>
        <a href="${frontendUrl}/invoices/${invoice.id}" class="button">
          Pobierz Fakturę
        </a>

        <p>
          Jeśli masz pytania dotyczące tej faktury, prosimy o kontakt.
        </p>

        <div class="footer">
          <p>Wiadomość została wysłana automatycznie przez system Majster.AI</p>
          <p>© ${new Date().getFullYear()} Majster.AI</p>
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

    const { invoiceId, clientEmail, subject, message, includePdf } =
      (await req.json()) as SendInvoiceEmailRequest;

    if (!invoiceId || !clientEmail) {
      return new Response(
        JSON.stringify({
          error: 'invoiceId and clientEmail are required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid email address',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch invoice
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

    // Generate email content
    const emailSubject =
      subject || `Faktura ${invoiceData.invoice_number} od ${invoiceData.issuer_company_name}`;
    const emailHTML = generateEmailHTML(invoiceData, message);

    // Send via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'invoices@majster.ai',
        to: clientEmail,
        subject: emailSubject,
        html: emailHTML,
        reply_to: 'support@majster.ai',
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.json();
      console.error('Resend API error:', resendError);
      return new Response(
        JSON.stringify({
          error: 'Failed to send email',
          details: resendError,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const resendData = await resendResponse.json();

    // Record in invoice_sends table
    const { data: send, error: sendError } = await supabase
      .from('invoice_sends')
      .insert([
        {
          invoice_id: invoiceId,
          user_id: invoice.user_id,
          client_email: clientEmail,
          subject: emailSubject,
          message: message,
          status: 'sent',
          tracking_status: 'sent',
          sent_at: new Date().toISOString(),
          pdf_url: invoiceData.pdf_url,
        },
      ])
      .select()
      .single();

    if (sendError) {
      console.warn('Failed to record invoice send:', sendError);
      // Don't fail the operation if logging fails
    }

    // Update invoice status
    await supabase
      .from('invoices')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invoice sent successfully',
        send_id: send?.id,
        email_id: resendData.id,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Send invoice email error:', error);
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
