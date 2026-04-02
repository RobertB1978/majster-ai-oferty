// ============================================
// EMAIL HANDLER TESTS - Phase 7C
// Unit tests for send-offer-email core logic
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleSendOfferEmail,
  generateOfferEmailHtml,
  checkEmailDeliveryConfig,
  getLocaleStrings,
  BLOCKED_SENDER_DOMAINS,
  type EmailDeps,
  type SendOfferPayload
} from './emailHandler.ts';

describe('generateOfferEmailHtml', () => {
  it('should generate valid HTML with sanitized inputs', () => {
    const html = generateOfferEmailHtml('Test Project', 'Hello\nWorld');

    expect(html).toContain('Majster.AI');
    expect(html).toContain('Test Project');
    expect(html).toContain('Hello<br>World');
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('should build offer link using /a/:token (new acceptance system)', () => {
    const html = generateOfferEmailHtml('Projekt', 'Wiadomość', {
      publicToken: 'abc-token-123',
      frontendUrl: 'https://app.majster.ai',
    });

    expect(html).toContain('https://app.majster.ai/a/abc-token-123');
    expect(html).not.toContain('/offer/abc-token-123');
  });

  it('should sanitize dangerous HTML characters in project name', () => {
    const html = generateOfferEmailHtml('<script>alert("xss")</script>', 'Message');

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('should escape HTML special characters in message (SEC-01)', () => {
    const html = generateOfferEmailHtml('Project', '<script>alert("xss")</script>');

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('should preserve newlines as <br> in message after escaping (SEC-01)', () => {
    const html = generateOfferEmailHtml('Project', 'Line 1\n<b>bold</b>\nLine 3');

    expect(html).toContain('Line 1<br>');
    expect(html).not.toContain('<b>bold</b>');
    expect(html).toContain('&lt;b&gt;bold&lt;/b&gt;');
  });

  it('should convert newlines to <br> tags in message', () => {
    const html = generateOfferEmailHtml('Project', 'Line 1\nLine 2\nLine 3');

    expect(html).toContain('Line 1<br>Line 2<br>Line 3');
  });
});

// ============================================================
// getLocaleStrings — locale lookup & fallback
// ============================================================

describe('getLocaleStrings', () => {
  it('returns Polish strings for locale "pl"', () => {
    const s = getLocaleStrings('pl');
    expect(s.acceptButton).toBe('✓ AKCEPTUJĘ (1 klik)');
    expect(s.viewButton).toBe('OGLĄDAM OFERTĘ →');
    expect(s.htmlLang).toBe('pl');
  });

  it('returns English strings for locale "en"', () => {
    const s = getLocaleStrings('en');
    expect(s.acceptButton).toBe('✓ ACCEPT (1 click)');
    expect(s.viewButton).toBe('VIEW QUOTE →');
    expect(s.downloadPdf).toContain('Download');
    expect(s.htmlLang).toBe('en');
  });

  it('returns Ukrainian strings for locale "uk"', () => {
    const s = getLocaleStrings('uk');
    expect(s.acceptButton).toBe('✓ ПРИЙМАЮ (1 клік)');
    expect(s.viewButton).toBe('ПЕРЕГЛЯНУТИ ПРОПОЗИЦІЮ →');
    expect(s.htmlLang).toBe('uk');
  });

  it('falls back to Polish for unsupported locale', () => {
    const s = getLocaleStrings('de');
    expect(s.htmlLang).toBe('pl');
    expect(s.acceptButton).toBe('✓ AKCEPTUJĘ (1 klik)');
  });

  it('falls back to Polish when locale is undefined', () => {
    const s = getLocaleStrings(undefined);
    expect(s.htmlLang).toBe('pl');
  });
});

// ============================================================
// generateOfferEmailHtml — locale-aware labels
// ============================================================

describe('generateOfferEmailHtml locale support', () => {
  const baseOpts = {
    publicToken: 'pub-token',
    acceptToken: 'acc-token',
    frontendUrl: 'https://app.majster.ai',
  };

  it('renders Polish labels by default (no locale)', () => {
    const html = generateOfferEmailHtml('Projekt', 'Wiadomość', baseOpts);
    expect(html).toContain('AKCEPTUJĘ');
    expect(html).toContain('OGLĄDAM OFERTĘ');
    expect(html).toContain('lang="pl"');
  });

  it('renders Polish labels for locale "pl"', () => {
    const html = generateOfferEmailHtml('Projekt', 'Wiadomość', { ...baseOpts, locale: 'pl' });
    expect(html).toContain('AKCEPTUJĘ');
    expect(html).toContain('OGLĄDAM OFERTĘ');
    expect(html).toContain('lang="pl"');
  });

  it('renders English labels for locale "en"', () => {
    const html = generateOfferEmailHtml('Project', 'Message', { ...baseOpts, locale: 'en' });
    expect(html).toContain('ACCEPT (1 click)');
    expect(html).toContain('VIEW QUOTE');
    expect(html).toContain('lang="en"');
    expect(html).not.toContain('AKCEPTUJĘ');
  });

  it('renders Ukrainian labels for locale "uk"', () => {
    const html = generateOfferEmailHtml('Проект', 'Повідомлення', { ...baseOpts, locale: 'uk' });
    expect(html).toContain('ПРИЙМАЮ');
    expect(html).toContain('ПЕРЕГЛЯНУТИ');
    expect(html).toContain('lang="uk"');
    expect(html).not.toContain('AKCEPTUJĘ');
  });

  it('falls back to Polish for unsupported locale', () => {
    const html = generateOfferEmailHtml('Project', 'Message', { ...baseOpts, locale: 'fr' });
    expect(html).toContain('AKCEPTUJĘ');
    expect(html).toContain('lang="pl"');
  });

  it('renders English PDF download label for locale "en"', () => {
    const html = generateOfferEmailHtml('Project', 'Message', {
      ...baseOpts,
      locale: 'en',
      pdfUrl: 'https://example.com/offer.pdf',
    });
    expect(html).toContain('Download quote PDF');
    expect(html).not.toContain('Pobierz ofertę');
  });

  it('renders Ukrainian PDF download label for locale "uk"', () => {
    const html = generateOfferEmailHtml('Проект', 'Повідомлення', {
      ...baseOpts,
      locale: 'uk',
      pdfUrl: 'https://example.com/offer.pdf',
    });
    expect(html).toContain('Завантажити PDF');
    expect(html).not.toContain('Pobierz ofertę');
  });

  it('renders English footer for locale "en"', () => {
    const html = generateOfferEmailHtml('Project', 'Message', { ...baseOpts, locale: 'en' });
    expect(html).toContain('This message was sent via');
    expect(html).not.toContain('Ta wiadomość');
  });

  it('does not alter user-entered projectName or message regardless of locale', () => {
    const html = generateOfferEmailHtml(
      'Remont Dachu 2024',
      'Wycena: 12 500 PLN\nTermin: 30 dni',
      { ...baseOpts, locale: 'en' }
    );
    // User content preserved (dangerous HTML chars sanitized but user text intact)
    expect(html).toContain('Remont Dachu 2024');
    expect(html).toContain('Wycena: 12 500 PLN');
    expect(html).toContain('Termin: 30 dni');
    // System labels follow EN locale, not user content locale
    expect(html).toContain('ACCEPT (1 click)');
  });
});

describe('handleSendOfferEmail', () => {
  let mockDeps: EmailDeps;
  let validPayload: SendOfferPayload;

  beforeEach(() => {
    // Reset mocks before each test
    mockDeps = {
      sendEmail: vi.fn().mockResolvedValue({ id: 'email-123' }),
      updateOfferSend: vi.fn().mockResolvedValue(undefined),
    };

    validPayload = {
      to: 'client@example.com',
      subject: 'Test Offer',
      message: 'This is a test offer message',
      projectName: 'Test Project',
      pdfUrl: 'https://example.com/offer.pdf',
      offerSendId: 'offer-send-123',
      tracking_status: 'sent',
    };
  });

  describe('Happy Path', () => {
    it('should send email and update database successfully', async () => {
      const result = await handleSendOfferEmail(validPayload, mockDeps);

      expect(result.ok).toBe(true);
      expect(result.emailId).toBe('email-123');
      expect(result.error).toBeUndefined();
      expect(result.warning).toBeUndefined();

      // Verify sendEmail was called with correct params
      expect(mockDeps.sendEmail).toHaveBeenCalledOnce();
      expect(mockDeps.sendEmail).toHaveBeenCalledWith({
        to: 'client@example.com',
        subject: 'Test Offer',
        html: expect.stringContaining('Majster.AI'),
      });

      // Verify updateOfferSend was called
      expect(mockDeps.updateOfferSend).toHaveBeenCalledOnce();
      expect(mockDeps.updateOfferSend).toHaveBeenCalledWith({
        offerSendId: 'offer-send-123',
        pdfUrl: 'https://example.com/offer.pdf',
        tracking_status: 'sent',
      });
    });

    it('should send email without updating database if no offerSendId', async () => {
      const payload = { ...validPayload, offerSendId: undefined };
      const result = await handleSendOfferEmail(payload, mockDeps);

      expect(result.ok).toBe(true);
      expect(result.emailId).toBe('email-123');
      expect(mockDeps.sendEmail).toHaveBeenCalledOnce();
      expect(mockDeps.updateOfferSend).not.toHaveBeenCalled();
    });

    it('should send email without updating database if updateOfferSend not provided', async () => {
      const depsWithoutUpdate = { ...mockDeps, updateOfferSend: undefined };
      const result = await handleSendOfferEmail(validPayload, depsWithoutUpdate);

      expect(result.ok).toBe(true);
      expect(result.emailId).toBe('email-123');
      expect(mockDeps.sendEmail).toHaveBeenCalledOnce();
    });
  });

  describe('Validation Errors', () => {
    it('should fail if email recipient is missing', async () => {
      const payload = { ...validPayload, to: '' };
      const result = await handleSendOfferEmail(payload, mockDeps);

      expect(result.ok).toBe(false);
      expect(result.error).toBe('Email recipient is required');
      expect(mockDeps.sendEmail).not.toHaveBeenCalled();
      expect(mockDeps.updateOfferSend).not.toHaveBeenCalled();
    });

    it('should fail if subject is missing', async () => {
      const payload = { ...validPayload, subject: '   ' };
      const result = await handleSendOfferEmail(payload, mockDeps);

      expect(result.ok).toBe(false);
      expect(result.error).toBe('Email subject is required');
      expect(mockDeps.sendEmail).not.toHaveBeenCalled();
    });

    it('should fail if message is missing', async () => {
      const payload = { ...validPayload, message: '' };
      const result = await handleSendOfferEmail(payload, mockDeps);

      expect(result.ok).toBe(false);
      expect(result.error).toBe('Email message is required');
      expect(mockDeps.sendEmail).not.toHaveBeenCalled();
    });

    it('should fail if project name is missing', async () => {
      const payload = { ...validPayload, projectName: '  ' };
      const result = await handleSendOfferEmail(payload, mockDeps);

      expect(result.ok).toBe(false);
      expect(result.error).toBe('Project name is required');
      expect(mockDeps.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('Email Service Errors', () => {
    it('should return error if sendEmail throws exception', async () => {
      mockDeps.sendEmail = vi.fn().mockRejectedValue(new Error('SMTP connection failed'));
      const result = await handleSendOfferEmail(validPayload, mockDeps);

      expect(result.ok).toBe(false);
      expect(result.error).toBe('SMTP connection failed');
      expect(mockDeps.updateOfferSend).not.toHaveBeenCalled();
    });

    it('should handle email service timeout error', async () => {
      mockDeps.sendEmail = vi.fn().mockRejectedValue(new Error('Email service timeout'));
      const result = await handleSendOfferEmail(validPayload, mockDeps);

      expect(result.ok).toBe(false);
      expect(result.error).toBe('Email service timeout');
    });

    it('should handle generic error objects', async () => {
      mockDeps.sendEmail = vi.fn().mockRejectedValue({ code: 500, message: 'Server error' });
      const result = await handleSendOfferEmail(validPayload, mockDeps);

      expect(result.ok).toBe(false);
      expect(result.error).toBe('Unknown error occurred while sending email');
    });
  });

  describe('Database Update Errors', () => {
    it('should return warning if email sent but database update fails', async () => {
      mockDeps.updateOfferSend = vi.fn().mockRejectedValue(new Error('Database connection lost'));
      const result = await handleSendOfferEmail(validPayload, mockDeps);

      // Email was sent successfully
      expect(result.ok).toBe(true);
      expect(result.emailId).toBe('email-123');

      // But we have a warning about DB failure
      expect(result.warning).toBe('Email sent but database update failed');

      // Both operations were attempted
      expect(mockDeps.sendEmail).toHaveBeenCalledOnce();
      expect(mockDeps.updateOfferSend).toHaveBeenCalledOnce();
    });
  });

  describe('Edge Cases', () => {
    it('should normalize missing tracking_status to "sent"', async () => {
      const payload = { ...validPayload, tracking_status: undefined };
      const result = await handleSendOfferEmail(payload, mockDeps);

      expect(result.ok).toBe(true);
      expect(mockDeps.updateOfferSend).toHaveBeenCalledWith({
        offerSendId: 'offer-send-123',
        pdfUrl: 'https://example.com/offer.pdf',
        tracking_status: 'sent', // Normalized to default
      });
    });

    it('should normalize invalid tracking_status to "sent"', async () => {
      const payload = { ...validPayload, tracking_status: 'invalid_status' };
      const result = await handleSendOfferEmail(payload, mockDeps);

      expect(result.ok).toBe(true);
      expect(mockDeps.updateOfferSend).toHaveBeenCalledWith({
        offerSendId: 'offer-send-123',
        pdfUrl: 'https://example.com/offer.pdf',
        tracking_status: 'sent', // Invalid status normalized
      });
    });

    it('should handle valid non-default tracking_status', async () => {
      const payload = { ...validPayload, tracking_status: 'opened' };
      const result = await handleSendOfferEmail(payload, mockDeps);

      expect(result.ok).toBe(true);
      expect(mockDeps.updateOfferSend).toHaveBeenCalledWith({
        offerSendId: 'offer-send-123',
        pdfUrl: 'https://example.com/offer.pdf',
        tracking_status: 'opened', // Valid status preserved
      });
    });

    it('should trim whitespace from email fields', async () => {
      const payload = {
        ...validPayload,
        to: '  client@example.com  ',
        subject: '  Test Subject  ',
      };
      const result = await handleSendOfferEmail(payload, mockDeps);

      expect(result.ok).toBe(true);
      expect(mockDeps.sendEmail).toHaveBeenCalledWith({
        to: 'client@example.com', // Trimmed
        subject: 'Test Subject', // Trimmed
        html: expect.any(String),
      });
    });

    it('should handle message with special characters', async () => {
      const payload = {
        ...validPayload,
        message: 'Price: 10,000 PLN\nDiscount: 5%\nContact: info@example.com',
      };
      const result = await handleSendOfferEmail(payload, mockDeps);

      expect(result.ok).toBe(true);
      expect(mockDeps.sendEmail).toHaveBeenCalledWith({
        to: expect.any(String),
        subject: expect.any(String),
        html: expect.stringContaining('10,000 PLN'),
      });
    });

    it('should handle project name with special HTML characters', async () => {
      const payload = {
        ...validPayload,
        projectName: 'Project "Alpha & Beta" <2024>',
      };
      const result = await handleSendOfferEmail(payload, mockDeps);

      expect(result.ok).toBe(true);
      // Verify HTML is generated (sanitization tested separately)
      expect(mockDeps.sendEmail).toHaveBeenCalledWith({
        to: expect.any(String),
        subject: expect.any(String),
        html: expect.stringContaining('&quot;'),
      });
    });

    it('should handle payload without pdfUrl', async () => {
      const payload = { ...validPayload, pdfUrl: undefined };
      const result = await handleSendOfferEmail(payload, mockDeps);

      expect(result.ok).toBe(true);
      expect(mockDeps.updateOfferSend).toHaveBeenCalledWith({
        offerSendId: 'offer-send-123',
        pdfUrl: undefined,
        tracking_status: 'sent',
      });
    });
  });
});

// ============================================================
// checkEmailDeliveryConfig — sender & config validation
// ============================================================

describe('checkEmailDeliveryConfig', () => {
  const validConfig = {
    resendApiKey: 're_test_123',
    senderEmail: 'noreply@majster.ai',
    frontendUrl: 'https://majster-ai-oferty.vercel.app',
  };

  describe('Missing required config', () => {
    it('should be invalid when RESEND_API_KEY is missing', () => {
      const result = checkEmailDeliveryConfig({ ...validConfig, resendApiKey: undefined });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('RESEND_API_KEY');
    });

    it('should be invalid when SENDER_EMAIL is missing', () => {
      const result = checkEmailDeliveryConfig({ ...validConfig, senderEmail: undefined });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('SENDER_EMAIL');
    });

    it('should be invalid when FRONTEND_URL is missing', () => {
      const result = checkEmailDeliveryConfig({ ...validConfig, frontendUrl: undefined });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('FRONTEND_URL');
    });
  });

  describe('Blocked sender domains', () => {
    it.each(BLOCKED_SENDER_DOMAINS)('should reject sender on blocked domain: %s', (domain) => {
      const result = checkEmailDeliveryConfig({ ...validConfig, senderEmail: `test@${domain}` });
      expect(result.valid).toBe(false);
      expect(result.error).toContain(domain);
    });

    it('should reject Resend sandbox address (resend.dev)', () => {
      const result = checkEmailDeliveryConfig({ ...validConfig, senderEmail: 'noreply@resend.dev' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('resend.dev');
      expect(result.error).toContain('sandbox');
    });
  });

  describe('Valid config', () => {
    it('should be valid with all required fields and a custom domain', () => {
      const result = checkEmailDeliveryConfig(validConfig);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should be valid and return no warnings for real-looking frontend URL', () => {
      const result = checkEmailDeliveryConfig(validConfig);
      expect(result.valid).toBe(true);
      expect(result.warnings).toBeUndefined();
    });
  });

  describe('Placeholder warnings', () => {
    it('should warn when FRONTEND_URL looks like a placeholder', () => {
      const result = checkEmailDeliveryConfig({ ...validConfig, frontendUrl: 'https://your-app.vercel.app' });
      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain('placeholder');
    });
  });
});
