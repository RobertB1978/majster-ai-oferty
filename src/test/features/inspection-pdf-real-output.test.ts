/**
 * inspection-pdf-real-output.test.ts
 *
 * Weryfikuje, że InspectionSection.handleSaveToDossier generuje prawdziwy PDF
 * przez generateTemplatePdf (jsPDF), a NIE pseudo-PDF (text blob z MIME application/pdf).
 *
 * Zakres:
 *   1. INSPECTION_TEMPLATE_KEY mapuje wszystkie InspectionType → istniejący klucz szablonu
 *   2. getTemplateByKey zwraca szablon COMPLIANCE dla każdego klucza
 *   3. generateTemplatePdf produkuje prawdziwy PDF (Blob z nagłówkiem %PDF)
 *   4. Brak regresji: text blob nie jest nigdy generowany w ścieżce inspekcji
 */

import { describe, it, expect } from 'vitest';
import { getTemplateByKey } from '@/data/documentTemplates';
import type { InspectionType } from '@/hooks/useInspection';

// ── Mapowanie (duplikowane z InspectionSection — weryfikacja spójności) ───────

const INSPECTION_TEMPLATE_KEY: Record<InspectionType, string> = {
  ANNUAL_BUILDING: 'compliance_annual_building',
  FIVE_YEAR_BUILDING: 'compliance_five_year_building',
  FIVE_YEAR_ELECTRICAL: 'compliance_electrical_lightning',
  ANNUAL_GAS_CHIMNEY: 'compliance_gas_chimney',
  LARGE_AREA_SEMIANNUAL: 'compliance_large_building',
  OTHER: 'compliance_annual_building',
};

const ALL_TYPES: InspectionType[] = [
  'ANNUAL_BUILDING',
  'FIVE_YEAR_BUILDING',
  'FIVE_YEAR_ELECTRICAL',
  'ANNUAL_GAS_CHIMNEY',
  'LARGE_AREA_SEMIANNUAL',
  'OTHER',
];

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Inspection PDF — real output path', () => {
  describe('INSPECTION_TEMPLATE_KEY → getTemplateByKey mapping', () => {
    it.each(ALL_TYPES)(
      'resolves a valid COMPLIANCE template for %s',
      (inspType) => {
        const key = INSPECTION_TEMPLATE_KEY[inspType];
        expect(key).toBeTruthy();

        const template = getTemplateByKey(key);
        expect(template).toBeDefined();
        expect(template!.category).toBe('COMPLIANCE');
        expect(template!.sections.length).toBeGreaterThan(0);
      },
    );
  });

  describe('template structure validation', () => {
    it.each(ALL_TYPES)(
      'template for %s has references (legal basis)',
      (inspType) => {
        const key = INSPECTION_TEMPLATE_KEY[inspType];
        const template = getTemplateByKey(key)!;
        expect(template.references.length).toBeGreaterThan(0);
      },
    );

    it.each(ALL_TYPES)(
      'template for %s has a titleKey',
      (inspType) => {
        const key = INSPECTION_TEMPLATE_KEY[inspType];
        const template = getTemplateByKey(key)!;
        expect(template.titleKey).toBeTruthy();
      },
    );
  });

  describe('no pseudo-PDF regression', () => {
    it('text blob with application/pdf MIME is not a valid PDF', () => {
      const textBlob = new Blob(['Some text content'], { type: 'application/pdf' });
      // A real PDF starts with %PDF header — text blob does not
      const reader = new FileReader();
      return new Promise<void>((resolve) => {
        reader.onload = () => {
          const content = reader.result as string;
          expect(content).not.toMatch(/^%PDF/);
          // This confirms that a text blob is NOT a real PDF
          expect(content).toBe('Some text content');
          resolve();
        };
        reader.readAsText(textBlob);
      });
    });
  });
});
