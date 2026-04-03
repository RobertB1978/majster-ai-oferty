/**
 * PDF Branding Activation — Testy
 *
 * Weryfikuje:
 *   1. hexToRgb — poprawna konwersja hex → RGB tuple
 *   2. hexToRgb — fallback na ACCENT_AMBER przy nieprawidłowym wejściu
 *   3. Trade accent → jsPDF RGB pipeline — kompletna ścieżka konwersji
 *   4. Warranty context — trade/planTier propagowane do WarrantyPdfContext
 *   5. drawLogoPlaceholder — eksportowany i callable
 */

import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  ACCENT_AMBER,
  ACCENT_AMBER_SUBTLE,
  drawLogoPlaceholder,
} from '@/lib/pdf/modernPdfStyles';
import {
  resolveTemplateVariant,
  getStyleTokens,
} from '@/lib/pdf/documentVisualSystem';
import type { TradeType, PlanTier } from '@/types/unified-document-payload';

// ── 1. hexToRgb — poprawna konwersja ────────────────────────────────────────

describe('hexToRgb', () => {
  it('konwertuje #F59E0B (amber) na [245, 158, 11]', () => {
    expect(hexToRgb('#F59E0B')).toEqual([245, 158, 11]);
  });

  it('konwertuje #1D4ED8 (plumbing blue) na [29, 78, 216]', () => {
    expect(hexToRgb('#1D4ED8')).toEqual([29, 78, 216]);
  });

  it('konwertuje #111827 (gray-900) na [17, 24, 39]', () => {
    expect(hexToRgb('#111827')).toEqual([17, 24, 39]);
  });

  it('konwertuje #0F172A (slate-950) na [15, 23, 42]', () => {
    expect(hexToRgb('#0F172A')).toEqual([15, 23, 42]);
  });

  it('obsługuje hex bez # prefix', () => {
    expect(hexToRgb('F59E0B')).toEqual([245, 158, 11]);
  });

  it('obsługuje małe litery', () => {
    expect(hexToRgb('#f59e0b')).toEqual([245, 158, 11]);
  });

  it('zwraca fallback ACCENT_AMBER dla pustego stringa', () => {
    expect(hexToRgb('')).toEqual(ACCENT_AMBER);
  });

  it('zwraca fallback dla nieprawidłowego hex', () => {
    expect(hexToRgb('#ZZZ')).toEqual(ACCENT_AMBER);
  });

  it('zwraca custom fallback gdy podany', () => {
    const custom: [number, number, number] = [0, 0, 0];
    expect(hexToRgb('invalid', custom)).toEqual(custom);
  });
});

// ── 2. Trade accent → jsPDF RGB pipeline ────────────────────────────────────

describe('trade accent → jsPDF RGB pipeline', () => {
  it('plumbing/basic → niebieski akcent jako RGB tuple', () => {
    const variant = resolveTemplateVariant({
      documentType: 'offer',
      trade: 'plumbing' as TradeType,
      planTier: 'basic' as PlanTier,
    });
    const tokens = getStyleTokens(variant);
    const accentRgb = hexToRgb(tokens.sectionAccent, ACCENT_AMBER);

    // plumbing = #1D4ED8 = [29, 78, 216]
    expect(accentRgb).toEqual([29, 78, 216]);
  });

  it('roofing/pro → ciemny łupek jako RGB tuple', () => {
    const variant = resolveTemplateVariant({
      documentType: 'offer',
      trade: 'roofing' as TradeType,
      planTier: 'pro' as PlanTier,
    });
    const tokens = getStyleTokens(variant);
    const accentRgb = hexToRgb(tokens.sectionAccent, ACCENT_AMBER);

    // roofing = #374151 = [55, 65, 81]
    expect(accentRgb).toEqual([55, 65, 81]);
  });

  it('general/basic → amber (domyślny brand Majster.AI)', () => {
    const variant = resolveTemplateVariant({
      documentType: 'offer',
      trade: 'general' as TradeType,
      planTier: 'basic' as PlanTier,
    });
    const tokens = getStyleTokens(variant);
    const accentRgb = hexToRgb(tokens.sectionAccent, ACCENT_AMBER);

    // general = #F59E0B = [245, 158, 11]
    expect(accentRgb).toEqual([245, 158, 11]);
  });

  it('subtle bg plumbing → jasny niebieski jako RGB tuple', () => {
    const variant = resolveTemplateVariant({
      documentType: 'offer',
      trade: 'plumbing' as TradeType,
      planTier: 'basic' as PlanTier,
    });
    const tokens = getStyleTokens(variant);
    const subtleRgb = hexToRgb(tokens.accentStripeBg, ACCENT_AMBER_SUBTLE);

    // plumbing subtleBg = #EFF6FF = [239, 246, 255]
    expect(subtleRgb).toEqual([239, 246, 255]);
  });

  it('wszystkie 10 branż produkują poprawne RGB tuples', () => {
    const trades: TradeType[] = [
      'general', 'electrical', 'plumbing', 'tiling', 'painting',
      'carpentry', 'roofing', 'hvac', 'masonry', 'flooring',
    ];
    for (const trade of trades) {
      const variant = resolveTemplateVariant({
        documentType: 'offer',
        trade,
        planTier: 'basic' as PlanTier,
      });
      const tokens = getStyleTokens(variant);
      const rgb = hexToRgb(tokens.sectionAccent);

      expect(rgb).toHaveLength(3);
      expect(rgb[0]).toBeGreaterThanOrEqual(0);
      expect(rgb[0]).toBeLessThanOrEqual(255);
      expect(rgb[1]).toBeGreaterThanOrEqual(0);
      expect(rgb[1]).toBeLessThanOrEqual(255);
      expect(rgb[2]).toBeGreaterThanOrEqual(0);
      expect(rgb[2]).toBeLessThanOrEqual(255);
    }
  });
});

// ── 3. Warranty visual system — headerBg per trade ──────────────────────────

describe('warranty visual system — headerBg per trade', () => {
  it('warranty zawsze używa classic style (headerBg = #111827)', () => {
    const trades: TradeType[] = ['general', 'plumbing', 'roofing'];
    const plans: PlanTier[] = ['basic', 'pro', 'enterprise'];

    for (const trade of trades) {
      for (const plan of plans) {
        const variant = resolveTemplateVariant({
          documentType: 'warranty',
          trade,
          planTier: plan,
        });
        const tokens = getStyleTokens(variant);
        const headerRgb = hexToRgb(tokens.headerBg);

        // Classic headerBg = #111827 = [17, 24, 39]
        expect(headerRgb).toEqual([17, 24, 39]);
      }
    }
  });

  it('warranty sectionAccent zmienia się per trade', () => {
    const general = resolveTemplateVariant({
      documentType: 'warranty',
      trade: 'general',
      planTier: 'basic',
    });
    const plumbing = resolveTemplateVariant({
      documentType: 'warranty',
      trade: 'plumbing',
      planTier: 'basic',
    });

    const generalAccent = getStyleTokens(general).sectionAccent;
    const plumbingAccent = getStyleTokens(plumbing).sectionAccent;

    expect(generalAccent).toBe('#F59E0B'); // amber
    expect(plumbingAccent).toBe('#1D4ED8'); // blue
    expect(generalAccent).not.toBe(plumbingAccent);
  });
});

// ── 4. drawLogoPlaceholder — eksport i sygnatura ────────────────────────────

describe('drawLogoPlaceholder', () => {
  it('jest eksportowany jako funkcja', () => {
    expect(typeof drawLogoPlaceholder).toBe('function');
  });
});

// ── 5. hexToRgb — edge cases ────────────────────────────────────────────────

describe('hexToRgb — edge cases', () => {
  it('#000000 → [0, 0, 0]', () => {
    expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
  });

  it('#FFFFFF → [255, 255, 255]', () => {
    expect(hexToRgb('#FFFFFF')).toEqual([255, 255, 255]);
  });

  it('3-char hex nie jest obsługiwany (fallback)', () => {
    // hexToRgb only handles 6-char hex
    expect(hexToRgb('#FFF')).toEqual(ACCENT_AMBER);
  });
});
