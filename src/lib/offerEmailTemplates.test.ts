import { describe, it, expect } from 'vitest';
import {
  OFFER_EMAIL_TEMPLATES,
  getTemplateById,
  renderOfferEmailTemplate,
} from './offerEmailTemplates';

describe('offerEmailTemplates', () => {
  describe('OFFER_EMAIL_TEMPLATES', () => {
    it('should contain at least 4 templates', () => {
      expect(OFFER_EMAIL_TEMPLATES.length).toBeGreaterThanOrEqual(4);
    });

    it('should have unique template IDs', () => {
      const ids = OFFER_EMAIL_TEMPLATES.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have all required fields for each template', () => {
      OFFER_EMAIL_TEMPLATES.forEach((template) => {
        expect(template.id).toBeTruthy();
        expect(template.name).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(template.content).toBeTruthy();
      });
    });

    it('should have Polish templates', () => {
      const template = OFFER_EMAIL_TEMPLATES[0];
      expect(template.content).toContain('Szanowny');
    });
  });

  describe('getTemplateById', () => {
    it('should return template when ID exists', () => {
      const template = getTemplateById('general-construction');
      expect(template).toBeDefined();
      expect(template?.id).toBe('general-construction');
      expect(template?.name).toBe('Budowlanka ogólna');
    });

    it('should return undefined when ID does not exist', () => {
      const template = getTemplateById('non-existent-template');
      expect(template).toBeUndefined();
    });

    it('should find all built-in templates', () => {
      expect(getTemplateById('general-construction')).toBeDefined();
      expect(getTemplateById('renovation-finishing')).toBeDefined();
      expect(getTemplateById('plumbing')).toBeDefined();
      expect(getTemplateById('electrical')).toBeDefined();
    });
  });

  describe('renderOfferEmailTemplate', () => {
    it('should replace all placeholders with provided data', () => {
      const result = renderOfferEmailTemplate('general-construction', {
        client_name: 'Jan Kowalski',
        project_name: 'Budowa domu jednorodzinnego',
        total_price: '450 000 zł',
        deadline: '6 miesięcy',
        company_name: 'Budex Sp. z o.o.',
        company_phone: '+48 123 456 789',
      });

      expect(result).toContain('Jan Kowalski');
      expect(result).toContain('Budowa domu jednorodzinnego');
      expect(result).toContain('450 000 zł');
      expect(result).toContain('6 miesięcy');
      expect(result).toContain('Budex Sp. z o.o.');
      expect(result).toContain('+48 123 456 789');

      // Should not contain any unreplaced placeholders
      expect(result).not.toContain('{client_name}');
      expect(result).not.toContain('{project_name}');
      expect(result).not.toContain('{total_price}');
    });

    it('should use safe defaults when data is missing', () => {
      const result = renderOfferEmailTemplate('renovation-finishing', {});

      expect(result).toContain('Kliencie'); // default client_name
      expect(result).toContain('Projekt'); // default project_name
      expect(result).toContain('[do uzupełnienia]'); // default for missing values
    });

    it('should handle partial data gracefully', () => {
      const result = renderOfferEmailTemplate('plumbing', {
        client_name: 'Anna Nowak',
        project_name: 'Instalacja wodna',
        // Missing other fields
      });

      expect(result).toContain('Anna Nowak');
      expect(result).toContain('Instalacja wodna');
      expect(result).toContain('[do uzupełnienia]'); // for missing price/deadline/phone
    });

    it('should throw error for non-existent template', () => {
      expect(() => {
        renderOfferEmailTemplate('non-existent', {});
      }).toThrow('Template not found');
    });

    it('should render different content for different templates', () => {
      const generalTemplate = renderOfferEmailTemplate('general-construction', {
        client_name: 'Test Client',
      });
      const plumbingTemplate = renderOfferEmailTemplate('plumbing', {
        client_name: 'Test Client',
      });

      expect(generalTemplate).not.toBe(plumbingTemplate);
      // Each template should have unique content
      expect(plumbingTemplate).toContain('hydraul'); // plumbing-specific content
    });

    it('should handle empty strings in data', () => {
      const result = renderOfferEmailTemplate('electrical', {
        client_name: '',
        project_name: '',
        total_price: '',
        deadline: '',
        company_name: '',
        company_phone: '',
      });

      // Empty strings should be used (not replaced with defaults)
      expect(result).not.toContain('{client_name}');
      expect(result).not.toContain('{project_name}');
    });

    it('should preserve template formatting and structure', () => {
      const result = renderOfferEmailTemplate('general-construction', {
        client_name: 'Test',
        project_name: 'Test Project',
        total_price: '1000 zł',
        deadline: '1 miesiąc',
        company_name: 'Test Firma',
        company_phone: '123456789',
      });

      // Should contain typical email structure elements
      expect(result).toContain('Szanowny');
      expect(result).toContain('\n\n'); // Should have paragraph breaks
      expect(result.split('\n').length).toBeGreaterThan(5); // Multiple lines
    });

    it('should work with all built-in templates', () => {
      const testData = {
        client_name: 'Jan Kowalski',
        project_name: 'Test',
        total_price: '1000 zł',
        deadline: '1 miesiąc',
        company_name: 'Firma',
        company_phone: '123456789',
      };

      OFFER_EMAIL_TEMPLATES.forEach((template) => {
        const result = renderOfferEmailTemplate(template.id, testData);
        expect(result).toBeTruthy();
        expect(result.length).toBeGreaterThan(50);
        expect(result).toContain('Jan Kowalski');
      });
    });
  });
});
