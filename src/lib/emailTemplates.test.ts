import { describe, it, expect } from 'vitest';
import {
  generateOfferEmailSubject,
  generateOfferEmailBody,
  generateOfferEmailBodyWithPdf,
} from './emailTemplates';

describe('emailTemplates', () => {
  describe('generateOfferEmailSubject', () => {
    it('should generate subject with default template', () => {
      const subject = generateOfferEmailSubject('Remont mieszkania');

      expect(subject).toContain('Oferta od');
      expect(subject).toContain('Majster.AI');
    });

    it('should use custom company name', () => {
      const subject = generateOfferEmailSubject('Remont', {
        companyName: 'Test Firma',
      });

      expect(subject).toContain('Test Firma');
    });

    it('should use custom template with variables', () => {
      const subject = generateOfferEmailSubject('Budowa domu', {
        companyName: 'Moja Firma',
        emailSubjectTemplate: 'Oferta {project_name} - {company_name}',
      });

      expect(subject).toContain('Budowa domu');
      expect(subject).toContain('Moja Firma');
    });

    it('should handle template with company_name variable', () => {
      const subject = generateOfferEmailSubject('Test', {
        companyName: 'ABC Sp. z o.o.',
        emailSubjectTemplate: '{company_name} - propozycja współpracy',
      });

      expect(subject).toBe('ABC Sp. z o.o. - propozycja współpracy');
    });
  });

  describe('generateOfferEmailBody', () => {
    it('should generate email body with default template', () => {
      const body = generateOfferEmailBody('Remont kuchni');

      expect(body).toContain('Szanowny Kliencie');
      expect(body).toContain('Remont kuchni');
      expect(body).toContain('Z poważaniem');
    });

    it('should use custom greeting and signature', () => {
      const body = generateOfferEmailBody('Test', {
        emailGreeting: 'Dzień dobry,',
        emailSignature: 'Pozdrawiam serdecznie',
      });

      expect(body).toContain('Dzień dobry');
      expect(body).toContain('Pozdrawiam serdecznie');
    });

    it('should include company name when provided', () => {
      const body = generateOfferEmailBody('Test', {
        companyName: 'Test Firma Sp. z o.o.',
      });

      expect(body).toContain('Test Firma Sp. z o.o.');
    });

    it('should include phone number when provided', () => {
      const body = generateOfferEmailBody('Test', {
        phone: '+48 123 456 789',
      });

      expect(body).toContain('+48 123 456 789');
      expect(body).toContain('Tel:');
    });

    it('should not include phone line when phone is missing', () => {
      const body = generateOfferEmailBody('Test');

      expect(body).not.toContain('Tel:');
    });

    it('should include project name in message', () => {
      const body = generateOfferEmailBody('Renowacja elewacji');

      expect(body).toContain('Renowacja elewacji');
    });
  });

  describe('generateOfferEmailBodyWithPdf', () => {
    it('should include PDF link in message', () => {
      const body = generateOfferEmailBodyWithPdf(
        'Test Project',
        'https://example.com/offer.pdf'
      );

      expect(body).toContain('https://example.com/offer.pdf');
      expect(body).toContain('Oferta dostępna jest pod linkiem');
    });

    it('should use custom profile data', () => {
      const body = generateOfferEmailBodyWithPdf('Test', 'https://test.pdf', {
        companyName: 'My Company',
        emailGreeting: 'Hello,',
        emailSignature: 'Best regards',
        phone: '+48 999 888 777',
      });

      expect(body).toContain('Hello');
      expect(body).toContain('Best regards');
      expect(body).toContain('My Company');
      expect(body).toContain('+48 999 888 777');
    });
  });
});
