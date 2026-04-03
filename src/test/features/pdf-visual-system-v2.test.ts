/**
 * PDF Document Visual System v2 — Testy
 *
 * Weryfikuje:
 *   1. resolveTemplateVariant — poprawny baseStyle per documentType + planTier
 *   2. resolveTemplateVariant — fallback dla 'free'/'basic' zawsze = 'classic'
 *   3. resolveTemplateVariant — fallback dla nieznanej branży = akcent 'general'
 *   4. mergeStyleWithTradeAccent — nadpisuje TYLKO sectionAccent + accentStripeBg
 *   5. getStyleTokens — kompletne tokeny dla wariantu
 *   6. visualStyleToJsPdfTemplate — poprawne mapowanie na PdfTemplateId
 *   7. variantKey — deterministyczny format klucza
 *   8. VisualFeatureFlags — poprawne flagi per plan
 *   9. BASE_STYLE_TOKENS — spójność definicji dla każdego stylu
 *  10. Brak regresji w renderPdfV2 — resolveJsPdfTemplateId użyty w adaptToOfferPdfPayload
 */

import { describe, it, expect } from 'vitest';
import {
  resolveTemplateVariant,
  mergeStyleWithTradeAccent,
  getStyleTokens,
  visualStyleToJsPdfTemplate,
  BASE_STYLE_TOKENS,
} from '@/lib/pdf/documentVisualSystem';
import type {
  VisualBaseStyle,
  TemplateResolutionInput,
} from '@/lib/pdf/documentVisualSystem';
import type { DocumentType, TradeType, PlanTier } from '@/types/unified-document-payload';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function input(
  documentType: DocumentType,
  trade: TradeType,
  planTier: PlanTier,
): TemplateResolutionInput {
  return { documentType, trade, planTier };
}

// ── 1. Bazowy styl per documentType + planTier ────────────────────────────────

describe('resolveTemplateVariant — baseStyle per planTier', () => {
  describe('free + basic → zawsze classic (niezależnie od dokumentType)', () => {
    const lowTiers: PlanTier[] = ['free', 'basic'];
    const docTypes: DocumentType[] = ['offer', 'contract', 'protocol', 'warranty', 'inspection'];

    it.each(lowTiers)('planTier=%s: wszystkie typy dokumentów → classic', (tier) => {
      for (const docType of docTypes) {
        const variant = resolveTemplateVariant(input(docType, 'general', tier));
        expect(variant.baseStyle).toBe('classic');
      }
    });
  });

  describe('pro + enterprise — styl zależy od documentType', () => {
    const premiumTiers: PlanTier[] = ['pro', 'enterprise'];

    it.each(premiumTiers)('planTier=%s: offer → premium', (tier) => {
      const variant = resolveTemplateVariant(input('offer', 'general', tier));
      expect(variant.baseStyle).toBe('premium');
    });

    it.each(premiumTiers)('planTier=%s: contract → premium', (tier) => {
      const variant = resolveTemplateVariant(input('contract', 'general', tier));
      expect(variant.baseStyle).toBe('premium');
    });

    it.each(premiumTiers)('planTier=%s: protocol → technical', (tier) => {
      const variant = resolveTemplateVariant(input('protocol', 'general', tier));
      expect(variant.baseStyle).toBe('technical');
    });

    it.each(premiumTiers)('planTier=%s: inspection → technical', (tier) => {
      const variant = resolveTemplateVariant(input('inspection', 'general', tier));
      expect(variant.baseStyle).toBe('technical');
    });

    it.each(premiumTiers)('planTier=%s: warranty → classic (zaufanie, nie luksus)', (tier) => {
      const variant = resolveTemplateVariant(input('warranty', 'general', tier));
      expect(variant.baseStyle).toBe('classic');
    });
  });
});

// ── 2. Fallback branżowy — nieznana branża = general ─────────────────────────

describe('resolveTemplateVariant — fallback branżowy', () => {
  it('znana branża (plumbing) zwraca niebieskie akcenty', () => {
    const variant = resolveTemplateVariant(input('offer', 'plumbing', 'pro'));
    expect(variant.tradeAccent.primary).toBe('#1D4ED8');
    expect(variant.tradeAccent.subtleBg).toBe('#EFF6FF');
  });

  it('elektryka używa amber (naturalne skojarzenie z energią)', () => {
    const variant = resolveTemplateVariant(input('offer', 'electrical', 'pro'));
    expect(variant.tradeAccent.primary).toBe('#F59E0B');
  });

  it('roofing używa ciemnego łupku', () => {
    const variant = resolveTemplateVariant(input('offer', 'roofing', 'pro'));
    expect(variant.tradeAccent.primary).toBe('#374151');
  });

  it('tiling i flooring mają identyczne akcenty terra', () => {
    const tiling = resolveTemplateVariant(input('offer', 'tiling', 'pro'));
    const flooring = resolveTemplateVariant(input('offer', 'flooring', 'pro'));
    expect(tiling.tradeAccent).toEqual(flooring.tradeAccent);
  });

  it('general i electrical mają identyczne akcenty (amber)', () => {
    const general = resolveTemplateVariant(input('offer', 'general', 'pro'));
    const electrical = resolveTemplateVariant(input('offer', 'electrical', 'pro'));
    expect(general.tradeAccent).toEqual(electrical.tradeAccent);
  });
});

// ── 3. VisualFeatureFlags per plan ────────────────────────────────────────────

describe('resolveTemplateVariant — VisualFeatureFlags', () => {
  it('free: showLogo=false, showQrCode=false, showWatermark=true, headerStyle=minimal', () => {
    const { features } = resolveTemplateVariant(input('offer', 'general', 'free'));
    expect(features.showLogo).toBe(false);
    expect(features.showQrCode).toBe(false);
    expect(features.showWatermark).toBe(true);
    expect(features.headerStyle).toBe('minimal');
  });

  it('basic: showLogo=true, showQrCode=true, showWatermark=false, headerStyle=standard', () => {
    const { features } = resolveTemplateVariant(input('offer', 'general', 'basic'));
    expect(features.showLogo).toBe(true);
    expect(features.showQrCode).toBe(true);
    expect(features.showWatermark).toBe(false);
    expect(features.headerStyle).toBe('standard');
  });

  it('pro: showLogo=true, showQrCode=true, showWatermark=false, headerStyle=branded', () => {
    const { features } = resolveTemplateVariant(input('offer', 'general', 'pro'));
    expect(features.showLogo).toBe(true);
    expect(features.showQrCode).toBe(true);
    expect(features.showWatermark).toBe(false);
    expect(features.headerStyle).toBe('branded');
  });

  it('enterprise: identyczne flagi jak pro', () => {
    const pro = resolveTemplateVariant(input('offer', 'general', 'pro'));
    const enterprise = resolveTemplateVariant(input('offer', 'general', 'enterprise'));
    expect(enterprise.features).toEqual(pro.features);
  });
});

// ── 4. mergeStyleWithTradeAccent ─────────────────────────────────────────────

describe('mergeStyleWithTradeAccent', () => {
  it('nadpisuje sectionAccent i accentStripeBg z tradeAccent', () => {
    const tradeAccent = { primary: '#1D4ED8', subtleBg: '#EFF6FF' };
    const merged = mergeStyleWithTradeAccent('classic', tradeAccent);

    expect(merged.sectionAccent).toBe('#1D4ED8');
    expect(merged.accentStripeBg).toBe('#EFF6FF');
  });

  it('NIE nadpisuje headerBg, tableHeaderBg ani grossAccent', () => {
    const tradeAccent = { primary: '#1D4ED8', subtleBg: '#EFF6FF' };
    const merged = mergeStyleWithTradeAccent('classic', tradeAccent);
    const base = BASE_STYLE_TOKENS['classic'];

    expect(merged.headerBg).toBe(base.headerBg);
    expect(merged.tableHeaderBg).toBe(base.tableHeaderBg);
    expect(merged.grossAccent).toBe(base.grossAccent);
    expect(merged.summaryBg).toBe(base.summaryBg);
  });

  it('style technical — merge nie zmienia headerBg (#1E3A5F)', () => {
    const tradeAccent = { primary: '#374151', subtleBg: '#F9FAFB' };
    const merged = mergeStyleWithTradeAccent('technical', tradeAccent);
    expect(merged.headerBg).toBe('#1E3A5F');
    expect(merged.sectionAccent).toBe('#374151');
  });

  it('style premium — merge nie zmienia headerBg (#0F172A)', () => {
    const tradeAccent = { primary: '#92400E', subtleBg: '#FEF3C7' };
    const merged = mergeStyleWithTradeAccent('premium', tradeAccent);
    expect(merged.headerBg).toBe('#0F172A');
    expect(merged.sectionAccent).toBe('#92400E');
  });
});

// ── 5. getStyleTokens ────────────────────────────────────────────────────────

describe('getStyleTokens', () => {
  it('zwraca kompletne tokeny dla wariantu offer/plumbing/pro', () => {
    const variant = resolveTemplateVariant(input('offer', 'plumbing', 'pro'));
    const tokens = getStyleTokens(variant);

    // Styl premium → ciemny nagłówek
    expect(tokens.headerBg).toBe('#0F172A');
    // Akcent plumbing → niebieski
    expect(tokens.sectionAccent).toBe('#1D4ED8');
    expect(tokens.accentStripeBg).toBe('#EFF6FF');
    // Premium: plain table
    expect(tokens.tableTheme).toBe('plain');
  });

  it('zwraca kompletne tokeny dla wariantu protocol/hvac/pro', () => {
    const variant = resolveTemplateVariant(input('protocol', 'hvac', 'pro'));
    const tokens = getStyleTokens(variant);

    // Technical → niebieski łupek nagłówek
    expect(tokens.headerBg).toBe('#1E3A5F');
    // Akcent hvac → niebieski (identyczny z technical default)
    expect(tokens.sectionAccent).toBe('#1E40AF');
    // Technical: striped table
    expect(tokens.tableTheme).toBe('striped');
  });

  it('zwraca kompletne tokeny dla wariantu warranty/general/basic', () => {
    const variant = resolveTemplateVariant(input('warranty', 'general', 'basic'));
    const tokens = getStyleTokens(variant);

    // Classic → ciemny nagłówek gray-900
    expect(tokens.headerBg).toBe('#111827');
    // Akcent general → amber
    expect(tokens.sectionAccent).toBe('#F59E0B');
    // Classic: grid table
    expect(tokens.tableTheme).toBe('grid');
  });
});

// ── 6. visualStyleToJsPdfTemplate ────────────────────────────────────────────

describe('visualStyleToJsPdfTemplate', () => {
  const cases: [VisualBaseStyle, string][] = [
    ['classic',   'classic'],
    ['technical', 'minimal'],
    ['premium',   'modern'],
  ];

  it.each(cases)('styl %s → templateId %s', (style, expectedId) => {
    expect(visualStyleToJsPdfTemplate(style)).toBe(expectedId);
  });
});

// ── 7. variantKey — deterministyczny format ───────────────────────────────────

describe('resolveTemplateVariant — variantKey', () => {
  it('ma format: {style}:{trade}:{planTier}:{documentType}', () => {
    const variant = resolveTemplateVariant(input('offer', 'tiling', 'pro'));
    expect(variant.variantKey).toBe('premium:tiling:pro:offer');
  });

  it('classic/general/free/warranty', () => {
    const variant = resolveTemplateVariant(input('warranty', 'general', 'free'));
    expect(variant.variantKey).toBe('classic:general:free:warranty');
  });

  it('technical/plumbing/enterprise/inspection', () => {
    const variant = resolveTemplateVariant(input('inspection', 'plumbing', 'enterprise'));
    expect(variant.variantKey).toBe('technical:plumbing:enterprise:inspection');
  });
});

// ── 8. BASE_STYLE_TOKENS — spójność definicji ────────────────────────────────

describe('BASE_STYLE_TOKENS — integralność danych', () => {
  const styles: VisualBaseStyle[] = ['classic', 'technical', 'premium'];

  it.each(styles)('styl %s ma wszystkie wymagane pola', (style) => {
    const tokens = BASE_STYLE_TOKENS[style];
    expect(tokens.headerBg).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(tokens.headerText).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(tokens.sectionAccent).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(tokens.accentStripeBg).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(tokens.tableAltRowBg).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(tokens.tableHeaderBg).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(tokens.tableHeaderText).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(tokens.summaryBg).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(tokens.grossAccent).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(['grid', 'striped', 'plain']).toContain(tokens.tableTheme);
  });

  it('classic: tableTheme = grid', () => {
    expect(BASE_STYLE_TOKENS['classic'].tableTheme).toBe('grid');
  });

  it('technical: tableTheme = striped', () => {
    expect(BASE_STYLE_TOKENS['technical'].tableTheme).toBe('striped');
  });

  it('premium: tableTheme = plain', () => {
    expect(BASE_STYLE_TOKENS['premium'].tableTheme).toBe('plain');
  });
});

// ── 9. Matryca stylu → 5 dokumentów × 4 plany × sample trades ─────────────

describe('resolveTemplateVariant — matryca kompletna', () => {
  const allDocTypes: DocumentType[] = ['offer', 'contract', 'protocol', 'warranty', 'inspection'];
  const allPlans: PlanTier[] = ['free', 'basic', 'pro', 'enterprise'];
  const sampleTrades: TradeType[] = ['general', 'electrical', 'plumbing', 'roofing'];

  it('każda kombinacja zwraca TemplateVariant bez błędów', () => {
    for (const docType of allDocTypes) {
      for (const plan of allPlans) {
        for (const trade of sampleTrades) {
          expect(() =>
            resolveTemplateVariant({ documentType: docType, trade, planTier: plan }),
          ).not.toThrow();
        }
      }
    }
  });

  it('każdy wariant ma niepusty variantKey', () => {
    for (const docType of allDocTypes) {
      for (const plan of allPlans) {
        const variant = resolveTemplateVariant({ documentType: docType, trade: 'general', planTier: plan });
        expect(variant.variantKey).toBeTruthy();
        expect(variant.variantKey.split(':').length).toBe(4);
      }
    }
  });
});

// ── 10. Regresja — renderPdfV2 nadal eksportuje PendingMigrationError ────────

describe('brak regresji — renderPdfV2', () => {
  it('PendingMigrationError jest nadal eksportowany', async () => {
    const module = await import('@/lib/pdf/renderPdfV2');
    expect(typeof module.PendingMigrationError).toBe('function');
  });

  it('renderDocumentPdfV2 jest nadal eksportowany', async () => {
    const module = await import('@/lib/pdf/renderPdfV2');
    expect(typeof module.renderDocumentPdfV2).toBe('function');
  });
});

// ── 11. Ścieżka rozwiązywania tokenów renderera (aktywacja systemu wizualnego) ─

describe('ścieżka tokenów renderera — symulacja resolveRendererTokens', () => {
  /**
   * Symulujemy logikę resolveRendererTokens z Edge Function renderera.
   * Nie możemy importować kodu Deno bezpośrednio, ale logika jest identyczna
   * z frontend canonical source (zweryfikowana w visual-system-parity.test.ts).
   */
  function resolveRendererTokens(trade?: string, planTier?: string) {
    const safeTrade = (trade ?? 'general') as TradeType;
    const safePlanTier = (planTier ?? 'basic') as PlanTier;

    const variant = resolveTemplateVariant({
      documentType: 'offer',
      trade: safeTrade,
      planTier: safePlanTier,
    });

    return getStyleTokens(variant);
  }

  it('brak trade/planTier → classic+general (domyślne tokeny amber)', () => {
    const tokens = resolveRendererTokens();
    // classic style
    expect(tokens.headerBg).toBe('#111827');
    // general accent = amber
    expect(tokens.sectionAccent).toBe('#F59E0B');
    expect(tokens.accentStripeBg).toBe('#FFFBEB');
    expect(tokens.grossAccent).toBe('#B45309');
    expect(tokens.tableAltRowBg).toBe('#F8FAFC');
  });

  it('trade=plumbing → niebieski akcent sekcji', () => {
    const tokens = resolveRendererTokens('plumbing', 'basic');
    expect(tokens.sectionAccent).toBe('#1D4ED8');
    expect(tokens.accentStripeBg).toBe('#EFF6FF');
    // classic style (basic plan)
    expect(tokens.grossAccent).toBe('#B45309');
  });

  it('trade=roofing → ciemny łupek akcent sekcji', () => {
    const tokens = resolveRendererTokens('roofing', 'pro');
    expect(tokens.sectionAccent).toBe('#374151');
    expect(tokens.accentStripeBg).toBe('#F9FAFB');
    // premium style (pro plan + offer)
    expect(tokens.grossAccent).toBe('#92400E');
  });

  it('trade=hvac, planTier=pro → premium+niebieski', () => {
    const tokens = resolveRendererTokens('hvac', 'pro');
    expect(tokens.sectionAccent).toBe('#1E40AF');
    expect(tokens.accentStripeBg).toBe('#EFF6FF');
    // premium style
    expect(tokens.headerBg).toBe('#0F172A');
  });

  it('nieznana branża → fallback na general (amber)', () => {
    const tokens = resolveRendererTokens('unknown_trade' as string, 'basic');
    expect(tokens.sectionAccent).toBe('#F59E0B');
  });

  it('tokeny classic vs premium — różne headerBg i grossAccent', () => {
    const classic = resolveRendererTokens('general', 'basic');
    const premium = resolveRendererTokens('general', 'pro');

    expect(classic.headerBg).toBe('#111827');
    expect(premium.headerBg).toBe('#0F172A');

    expect(classic.grossAccent).toBe('#B45309');
    expect(premium.grossAccent).toBe('#92400E');
  });

  it('wszystkie 10 branż generują tokeny bez błędów', () => {
    const trades: TradeType[] = [
      'general', 'electrical', 'plumbing', 'tiling', 'painting',
      'carpentry', 'roofing', 'hvac', 'masonry', 'flooring',
    ];
    for (const trade of trades) {
      const tokens = resolveRendererTokens(trade, 'basic');
      expect(tokens.sectionAccent).toBeTruthy();
      expect(tokens.accentStripeBg).toBeTruthy();
      expect(tokens.grossAccent).toBeTruthy();
      expect(tokens.tableAltRowBg).toBeTruthy();
    }
  });
});
