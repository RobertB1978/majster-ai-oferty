// ============================================
// EMAIL HANDLER - Sprint 1 v2
// Reply-To + dual action buttons (view & 1-click accept)
// ============================================

import { sanitizeString } from "../_shared/validation.ts";
import { normalizeTrackingStatus } from "../_shared/tracking-status.ts";

// ============================================================
// EMAIL DELIVERY CONFIG VALIDATION
// Pure functions — no Deno.env, fully testable
// ============================================================

/** Domains that cannot be used as sender address in Resend */
export const BLOCKED_SENDER_DOMAINS = [
  'gmail.com', 'yahoo.com', 'yahoo.pl', 'outlook.com',
  'hotmail.com', 'wp.pl', 'onet.pl', 'o2.pl', 'interia.pl',
];

export interface EmailConfigValidationResult {
  valid: boolean;
  /** Top-level error if config cannot be used at all */
  error?: string;
  /** Warnings — config is present but suspicious */
  warnings?: string[];
}

/**
 * Validate email delivery configuration values.
 * Pure function — accepts values already read from env so it can be tested without Deno.env mocks.
 */
export function checkEmailDeliveryConfig(config: {
  resendApiKey: string | undefined;
  senderEmail: string | undefined;
  frontendUrl: string | undefined;
}): EmailConfigValidationResult {
  const { resendApiKey, senderEmail, frontendUrl } = config;
  const warnings: string[] = [];

  if (!resendApiKey) {
    return { valid: false, error: 'RESEND_API_KEY is not set' };
  }
  if (!senderEmail) {
    return { valid: false, error: 'SENDER_EMAIL is not set — must be an address from a domain verified in Resend' };
  }
  if (!frontendUrl) {
    return { valid: false, error: 'FRONTEND_URL is not set — offer links in emails would be broken' };
  }

  // Resend sandbox address — only delivers to the account owner's inbox
  if (senderEmail.endsWith('@resend.dev')) {
    return { valid: false, error: 'SENDER_EMAIL is a Resend sandbox address (resend.dev) — it cannot deliver emails to real clients. Use a domain you own and verify it in Resend.' };
  }

  // Consumer email domains that Resend will reject as sender
  const senderDomain = senderEmail.split('@')[1]?.toLowerCase() ?? '';
  if (BLOCKED_SENDER_DOMAINS.includes(senderDomain)) {
    return {
      valid: false,
      error: `SENDER_EMAIL uses "${senderDomain}" which is a consumer domain — Resend does not allow sending from addresses on domains you don't own (Gmail, Yahoo, etc.). Verify your own domain in Resend and use that.`,
    };
  }

  // Placeholder frontend URL
  if (frontendUrl.includes('your-app') || frontendUrl === 'https://your-app.vercel.app') {
    warnings.push('FRONTEND_URL appears to be a placeholder — update it to the real production URL');
  }

  return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
}

/**
 * Payload for sending an offer email
 */
export interface SendOfferPayload {
  to: string;
  subject: string;
  message: string;
  projectName: string;
  pdfUrl?: string;
  offerSendId?: string;
  tracking_status?: string;
  // Sprint 1: dual-token + reply-to
  publicToken?: string;
  acceptToken?: string;
  replyTo?: string;       // verified contact_email → Reply-To header
  companyName?: string;
  frontendUrl?: string;   // injected from env FRONTEND_URL
}

/**
 * Result of email sending operation
 */
export interface SendOfferResult {
  ok: boolean;
  error?: string;
  emailId?: string;
  warning?: string;
}

/**
 * Dependencies for email handler (mockable in tests)
 */
export interface EmailDeps {
  sendEmail: (params: {
    to: string;
    subject: string;
    html: string;
    replyTo?: string;
  }) => Promise<{ id: string }>;

  updateOfferSend?: (params: {
    offerSendId: string;
    pdfUrl?: string;
    tracking_status: string;
  }) => Promise<void>;
}

/**
 * Generate HTML content for offer email with dual action buttons
 */
export function generateOfferEmailHtml(
  projectName: string,
  message: string,
  opts?: {
    publicToken?: string;
    acceptToken?: string;
    companyName?: string;
    pdfUrl?: string;
    frontendUrl?: string;
  }
): string {
  const safeProjectName = sanitizeString(projectName);
  const safeMessage = sanitizeString(message).replace(/\n/g, '<br>');
  const safeCompanyName = opts?.companyName ? sanitizeString(opts.companyName) : 'Majster.AI';
  const baseUrl = opts?.frontendUrl ?? 'https://majster-ai-oferty.vercel.app'; // TEMP: configure FRONTEND_URL secret in Supabase

  const viewUrl = opts?.publicToken
    ? `${baseUrl}/offer/${opts.publicToken}`
    : null;
  const acceptUrl = opts?.publicToken && opts?.acceptToken
    ? `${baseUrl}/offer/${opts.publicToken}?t=${opts.acceptToken}`
    : null;

  const actionButtons = viewUrl && acceptUrl ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${acceptUrl}"
         style="display:inline-block; background:#16a34a; color:#ffffff; padding:14px 28px; border-radius:6px;
                text-decoration:none; font-size:16px; font-weight:700; letter-spacing:0.5px; margin-bottom:12px; min-width:200px;">
        ✓ AKCEPTUJĘ (1 klik)
      </a>
      <br>
      <a href="${viewUrl}"
         style="display:inline-block; background:#2563eb; color:#ffffff; padding:14px 28px; border-radius:6px;
                text-decoration:none; font-size:15px; font-weight:600; letter-spacing:0.5px; min-width:200px;">
        OGLĄDAM OFERTĘ →
      </a>
    </div>
  ` : viewUrl ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${viewUrl}"
         style="display:inline-block; background:#2563eb; color:#ffffff; padding:14px 28px; border-radius:6px;
                text-decoration:none; font-size:15px; font-weight:600;">
        OGLĄDAM OFERTĘ →
      </a>
    </div>
  ` : '';

  const pdfSection = opts?.pdfUrl ? `
    <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; padding:12px; margin-top:16px; text-align:center;">
      <a href="${opts.pdfUrl}" style="color:#16a34a; text-decoration:none; font-size:14px;">
        📄 Pobierz ofertę w PDF
      </a>
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="pl">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Oferta — ${safeProjectName}</title>
  </head>
  <body style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#1a1a1a;max-width:600px;margin:0 auto;padding:20px;background:#ffffff;">
    <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;padding:30px;border-radius:8px;text-align:center;margin-bottom:24px;">
      <h1 style="margin:0;font-size:24px;">${safeCompanyName}</h1>
      <span style="display:inline-block;background:rgba(255,255,255,0.2);padding:4px 14px;border-radius:20px;font-size:14px;margin-top:10px;">
        ${safeProjectName}
      </span>
    </div>

    <div style="background:#f9fafb;padding:24px;border-radius:8px;border:1px solid #e5e7eb;">
      <div style="white-space:pre-wrap;">${safeMessage}</div>
    </div>

    ${actionButtons}
    ${pdfSection}

    <div style="text-align:center;color:#6b7280;font-size:12px;margin-top:30px;padding-top:20px;border-top:1px solid #e5e7eb;">
      <p style="margin:0 0 4px;">Ta wiadomość została wysłana przez <strong>Majster.AI</strong></p>
      ${viewUrl ? `<p style="margin:0;"><a href="${viewUrl}" style="color:#9ca3af;font-size:11px;">Nie możesz kliknąć przycisku? Użyj tego linku: ${viewUrl}</a></p>` : ''}
    </div>
  </body>
</html>`;
}

/**
 * Main handler for sending offer email
 * Pure logic with dependency injection for testability
 */
export async function handleSendOfferEmail(
  payload: SendOfferPayload,
  deps: EmailDeps
): Promise<SendOfferResult> {
  const {
    to, subject, message, projectName, pdfUrl, offerSendId, tracking_status,
    publicToken, acceptToken, replyTo, companyName, frontendUrl,
  } = payload;

  if (!to?.trim()) return { ok: false, error: "Email recipient is required" };
  if (!subject?.trim()) return { ok: false, error: "Email subject is required" };
  if (!message?.trim()) return { ok: false, error: "Email message is required" };
  if (!projectName?.trim()) return { ok: false, error: "Project name is required" };

  try {
    const htmlContent = generateOfferEmailHtml(projectName, message, {
      publicToken,
      acceptToken,
      companyName,
      pdfUrl,
      frontendUrl,
    });

    const emailResult = await deps.sendEmail({
      to: to.trim(),
      subject: subject.trim(),
      html: htmlContent,
      replyTo: replyTo?.trim() || undefined,
    });

    console.log(`[send-offer-email] Email sent: ${emailResult.id} to ${to.substring(0, 3)}***`);

    if (offerSendId && deps.updateOfferSend) {
      try {
        await deps.updateOfferSend({
          offerSendId,
          pdfUrl,
          tracking_status: normalizeTrackingStatus(tracking_status),
        });
      } catch (dbError) {
        console.error(`[send-offer-email] DB update failed for ${offerSendId}:`, dbError);
        return {
          ok: true,
          emailId: emailResult.id,
          warning: "Email sent but database update failed",
        };
      }
    }

    return { ok: true, emailId: emailResult.id };
  } catch (error) {
    console.error("[send-offer-email] Error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error occurred while sending email",
    };
  }
}
