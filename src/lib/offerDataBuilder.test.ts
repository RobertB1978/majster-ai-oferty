import { describe, it, expect } from 'vitest';
import { buildOfferData, formatOfferSummary } from './offerDataBuilder';

describe('offerDataBuilder', () => {
  describe('buildOfferData', () => {
    it('should build offer data with all fields populated', () => {
      const result = buildOfferData({
        projectId: 'proj-123',
        projectName: 'Remont mieszkania',
        profile: {
          company_name: 'Test Firma',
          nip: '1234567890',
          street: 'ul. Testowa 1',
          postal_code: '00-000',
          city: 'Warszawa',
          phone: '+48 123 456 789',
          email: 'test@example.com',
        },
        client: {
          name: 'Jan Kowalski',
          email: 'jan@example.com',
          address: 'ul. Klienta 2, 00-001 Warszawa',
          phone: '+48 987 654 321',
        },
        quote: {
          positions: [
            {
              id: 'pos-1',
              name: 'Płytki ceramiczne',
              qty: 20,
              unit: 'm2',
              price: 50,
              category: 'Materiał',
            },
          ],
          summary_materials: 1000,
          summary_labor: 500,
          margin_percent: 20,
          total: 1800,
        },
        pdfData: {
          version: 'premium',
          title: 'Oferta na remont',
          offer_text: 'Szanowni Państwo...',
          terms: 'Warunki płatności...',
          deadline_text: 'Termin: 2 tygodnie',
        },
      });

      expect(result.projectId).toBe('proj-123');
      expect(result.projectName).toBe('Remont mieszkania');
      expect(result.company.name).toBe('Test Firma');
      expect(result.company.nip).toBe('1234567890');
      expect(result.client?.name).toBe('Jan Kowalski');
      expect(result.quote?.total).toBe(1800);
      expect(result.pdfConfig.version).toBe('premium');
    });

    it('should use default company name when profile is missing', () => {
      const result = buildOfferData({
        projectId: 'proj-123',
        projectName: 'Test Project',
      });

      expect(result.company.name).toBe('Majster.AI');
    });

    it('should handle missing client data', () => {
      const result = buildOfferData({
        projectId: 'proj-123',
        projectName: 'Test Project',
        client: null,
      });

      expect(result.client).toBeNull();
    });

    it('should handle missing quote data', () => {
      const result = buildOfferData({
        projectId: 'proj-123',
        projectName: 'Test Project',
        quote: null,
      });

      expect(result.quote).toBeNull();
    });

    it('should use default PDF config when not provided', () => {
      const result = buildOfferData({
        projectId: 'proj-123',
        projectName: 'Test Project',
      });

      expect(result.pdfConfig.version).toBe('standard');
      expect(result.pdfConfig.title).toContain('Test Project');
    });

    it('should set generatedAt to current date', () => {
      const before = new Date();
      const result = buildOfferData({
        projectId: 'proj-123',
        projectName: 'Test Project',
      });
      const after = new Date();

      expect(result.generatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.generatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('formatOfferSummary', () => {
    it('should format offer summary with quote data', () => {
      const payload = buildOfferData({
        projectId: 'proj-123',
        projectName: 'Remont',
        quote: {
          positions: [],
          summary_materials: 1000,
          summary_labor: 500,
          margin_percent: 20,
          total: 1800,
        },
      });

      const summary = formatOfferSummary(payload);

      expect(summary).toContain('Remont');
      expect(summary).toContain('1');
      expect(summary).toContain('000');
      expect(summary).toContain('500');
      expect(summary).toContain('20%');
      expect(summary).toContain('1');
      expect(summary).toContain('800');
    });

    it('should return message when quote is missing', () => {
      const payload = buildOfferData({
        projectId: 'proj-123',
        projectName: 'Test',
        quote: null,
      });

      const summary = formatOfferSummary(payload);

      expect(summary).toContain('nie została jeszcze przygotowana');
    });
  });
});
