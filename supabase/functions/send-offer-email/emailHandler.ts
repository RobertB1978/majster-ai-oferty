// ============================================
// EMAIL HANDLER - Pure Logic (Testable)
// Phase 7C: Extract core logic for unit testing
// ============================================

import { sanitizeString } from "../_shared/validation.ts";
import { normalizeTrackingStatus } from "../_shared/tracking-status.ts";

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
  /**
   * Send email via external service (e.g., Resend)
   */
  sendEmail: (params: {
    to: string;
    subject: string;
    html: string;
  }) => Promise<{ id: string }>;

  /**
   * Update offer_sends record in database (optional)
   */
  updateOfferSend?: (params: {
    offerSendId: string;
    pdfUrl?: string;
    tracking_status: string;
  }) => Promise<void>;
}

/**
 * Generate HTML content for offer email
 */
export function generateOfferEmailHtml(
  projectName: string,
  message: string
): string {
  const safeProjectName = sanitizeString(projectName);
  const safeMessage = message.replace(/\n/g, '<br>');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 30px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 30px;
          }
          .content {
            background: #f9fafb;
            padding: 25px;
            border-radius: 8px;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
          .project-badge {
            display: inline-block;
            background: #dbeafe;
            color: #1d4ed8;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 14px;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0;">Majster.AI</h1>
          <span class="project-badge">${safeProjectName}</span>
        </div>
        <div class="content">
          ${safeMessage}
        </div>
        <div class="footer">
          <p>Ta wiadomość została wysłana przez Majster.AI</p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Main handler for sending offer email
 * Pure logic with dependency injection for testability
 */
export async function handleSendOfferEmail(
  payload: SendOfferPayload,
  deps: EmailDeps
): Promise<SendOfferResult> {
  const { to, subject, message, projectName, pdfUrl, offerSendId, tracking_status } = payload;

  // Validate required fields (basic checks)
  if (!to?.trim()) {
    return { ok: false, error: "Email recipient is required" };
  }
  if (!subject?.trim()) {
    return { ok: false, error: "Email subject is required" };
  }
  if (!message?.trim()) {
    return { ok: false, error: "Email message is required" };
  }
  if (!projectName?.trim()) {
    return { ok: false, error: "Project name is required" };
  }

  try {
    // Generate HTML email content
    const htmlContent = generateOfferEmailHtml(projectName, message);

    // Send email via external service
    const emailResult = await deps.sendEmail({
      to: to.trim(),
      subject: subject.trim(),
      html: htmlContent,
    });

    console.log(`[send-offer-email] Email sent successfully: ${emailResult.id} to ${to.substring(0, 3)}***`);

    // Update database record if offerSendId provided and updateOfferSend available
    if (offerSendId && deps.updateOfferSend) {
      try {
        await deps.updateOfferSend({
          offerSendId,
          pdfUrl,
          tracking_status: normalizeTrackingStatus(tracking_status),
        });
        console.log(`[send-offer-email] Updated offer_sends record: ${offerSendId}`);
      } catch (dbError) {
        // Email was sent successfully, but DB update failed
        // Don't fail the whole operation, but return a warning
        console.error(`[send-offer-email] Failed to update offer_sends ${offerSendId}:`, dbError);
        return {
          ok: true,
          emailId: emailResult.id,
          warning: "Email sent but database update failed",
        };
      }
    }

    return {
      ok: true,
      emailId: emailResult.id,
    };
  } catch (error) {
    console.error("[send-offer-email] Error in handleSendOfferEmail:", error);

    // Distinguish between email service errors and other errors
    if (error instanceof Error) {
      return {
        ok: false,
        error: error.message || "Failed to send email",
      };
    }

    return {
      ok: false,
      error: "Unknown error occurred while sending email",
    };
  }
}
