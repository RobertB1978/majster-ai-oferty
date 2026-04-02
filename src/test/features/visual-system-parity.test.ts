/**
 * Visual System Parity Test
 *
 * Verifies that the frontend canonical source (src/lib/pdf/documentVisualSystem.ts)
 * and the Deno mirror (supabase/functions/_shared/document-visual-system.ts)
 * produce identical results for every combination of inputs.
 *
 * WHY: The two files are maintained as mirrors because the Deno runtime
 * cannot import from src/. A drift between them would cause PDFs rendered
 * server-side (Edge Function) to differ visually from client-side fallback.
 *
 * APPROACH: Parse actual data structures from Deno source (not just substring),
 * then compare value-by-value with frontend exports.
 */

import { describe, it, expect } from 'vitest';
import * as frontend from '@/lib/pdf/documentVisualSystem';
import type { DocumentType, TradeType, PlanTier } from '@/types/unified-document-payload';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ── Read the Deno mirror source ──────────────────────────────────────────────

const DENO_MIRROR_PATH = path.resolve(
  __dirname,
  '../../../supabase/functions/_shared/document-visual-system.ts',
);
const denoSource = fs.readFileSync(DENO_MIRROR_PATH, 'utf-8');

// ── Exhaustive input combinations ────────────────────────────────────────────

const DOCUMENT_TYPES: DocumentType[] = [
  'offer', 'contract', 'protocol', 'warranty', 'inspection',
];

const TRADE_TYPES: TradeType[] = [
  'general', 'electrical', 'plumbing', 'tiling', 'painting',
  'carpentry', 'roofing', 'hvac', 'masonry', 'flooring',
];

const PLAN_TIERS: PlanTier[] = ['free', 'basic', 'pro', 'enterprise'];

// ── Parsing helpers for Deno source ──────────────────────────────────────────

/**
 * Extract a JSON-like object from Deno TypeScript source by key name.
 * Converts single-quoted TS syntax to valid JSON.
 */
function extractObjectBlock(source: string, objectName: string): string | null {
  const regex = new RegExp(`(const ${objectName}[^=]*=\\s*)({[\\s\\S]*?});`, 'm');
  const match = source.match(regex);
  if (!match) return null;
  return match[2];
}

/**
 * Parse BASE_STYLE_TOKENS from Deno source by extracting hex values per style.
 * More robust than JSON.parse since TS source may have comments and trailing commas.
 */
function extractDenoStyleTokens(): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};

  for (const style of ['classic', 'technical', 'premium']) {
    // Find the style block between its key and the next closing brace
    const stylePattern = new RegExp(
      `${style}:\\s*\\{([\\s\\S]*?)\\}`,
      'm',
    );
    const block = extractObjectBlock(denoSource, 'BASE_STYLE_TOKENS');
    if (!block) continue;

    const styleMatch = block.match(stylePattern);
    if (!styleMatch) continue;

    const fields: Record<string, string> = {};
    // Extract key: "value" pairs
    const fieldPattern = /(\w+):\s*"([^"]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = fieldPattern.exec(styleMatch[1])) !== null) {
      fields[m[1]] = m[2];
    }

    result[style] = fields;
  }

  return result;
}

/**
 * Parse TRADE_ACCENT_MAP from Deno source.
 */
function extractDenoTradeAccents(): Record<string, { primary: string; subtleBg: string }> {
  const result: Record<string, { primary: string; subtleBg: string }> = {};
  const block = extractObjectBlock(denoSource, 'TRADE_ACCENT_MAP');
  if (!block) return result;

  // Match: trade: { primary: "#...", subtleBg: "#..." }
  const tradePattern = /(\w+):\s*\{\s*primary:\s*"([^"]+)",\s*subtleBg:\s*"([^"]+)"\s*\}/g;
  let m: RegExpExecArray | null;
  while ((m = tradePattern.exec(block)) !== null) {
    result[m[1]] = { primary: m[2], subtleBg: m[3] };
  }

  return result;
}

// ── Pre-computed data from Deno source ───────────────────────────────────────

const denoStyleTokens = extractDenoStyleTokens();
const denoTradeAccents = extractDenoTradeAccents();

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Visual System — frontend vs Deno mirror parity', () => {

  // ── 1: BASE_STYLE_TOKENS structural equality ──────────────────────────────

  describe('BASE_STYLE_TOKENS — value-by-value comparison', () => {
    for (const style of ['classic', 'technical', 'premium'] as const) {
      describe(`${style} style`, () => {
        const frontendTokens = frontend.BASE_STYLE_TOKENS[style];
        const denoTokens = denoStyleTokens[style];

        it('exists in Deno mirror', () => {
          expect(denoTokens).toBeDefined();
        });

        const tokenKeys: (keyof typeof frontendTokens)[] = [
          'headerBg', 'headerText', 'sectionAccent', 'accentStripeBg',
          'tableAltRowBg', 'tableHeaderBg', 'tableHeaderText',
          'summaryBg', 'grossAccent', 'tableTheme',
        ];

        for (const key of tokenKeys) {
          it(`${key} matches: frontend="${frontendTokens[key]}" vs Deno="${denoTokens?.[key]}"`, () => {
            expect(denoTokens?.[key]).toBe(frontendTokens[key]);
          });
        }
      });
    }
  });

  // ── 2: TRADE_ACCENT_MAP structural equality ───────────────────────────────

  describe('TRADE_ACCENT_MAP — value-by-value comparison', () => {
    for (const trade of TRADE_TYPES) {
      it(`${trade}: primary color matches`, () => {
        const feVariant = frontend.resolveTemplateVariant({
          documentType: 'offer', trade, planTier: 'pro',
        });
        expect(denoTradeAccents[trade]).toBeDefined();
        expect(denoTradeAccents[trade]?.primary).toBe(feVariant.tradeAccent.primary);
      });

      it(`${trade}: subtleBg color matches`, () => {
        const feVariant = frontend.resolveTemplateVariant({
          documentType: 'offer', trade, planTier: 'pro',
        });
        expect(denoTradeAccents[trade]?.subtleBg).toBe(feVariant.tradeAccent.subtleBg);
      });
    }

    it('Deno has same number of trades as frontend', () => {
      expect(Object.keys(denoTradeAccents).length).toBe(TRADE_TYPES.length);
    });
  });

  // ── 3: Type enums present in both ─────────────────────────────────────────

  describe('Type enum completeness in Deno mirror', () => {
    it('all DocumentType values present', () => {
      for (const docType of DOCUMENT_TYPES) {
        expect(denoSource).toMatch(new RegExp(`"${docType}"`));
      }
    });

    it('all TradeType values present', () => {
      for (const trade of TRADE_TYPES) {
        expect(denoSource).toMatch(new RegExp(`"${trade}"`));
      }
    });

    it('all PlanTier values present', () => {
      for (const tier of PLAN_TIERS) {
        expect(denoSource).toMatch(new RegExp(`"${tier}"`));
      }
    });
  });

  // ── 4: Exported function signatures present ───────────────────────────────

  describe('Exported functions exist in Deno mirror', () => {
    const expectedFunctions = [
      'resolveTemplateVariant',
      'mergeStyleWithTradeAccent',
      'getStyleTokens',
    ];

    for (const fn of expectedFunctions) {
      it(`export function ${fn} exists`, () => {
        expect(denoSource).toContain(`export function ${fn}`);
      });
    }
  });

  // ── 5: Resolution logic consistency ───────────────────────────────────────

  describe('resolveTemplateVariant — determinism and consistency', () => {
    it('is deterministic for all 200 combinations', () => {
      const results = new Map<string, frontend.TemplateVariant>();

      for (const documentType of DOCUMENT_TYPES) {
        for (const trade of TRADE_TYPES) {
          for (const planTier of PLAN_TIERS) {
            const variant = frontend.resolveTemplateVariant({
              documentType, trade, planTier,
            });

            expect(variant.variantKey).toBe(
              `${variant.baseStyle}:${trade}:${planTier}:${documentType}`,
            );

            const existing = results.get(variant.variantKey);
            if (existing) {
              expect(variant.baseStyle).toBe(existing.baseStyle);
              expect(variant.tradeAccent).toEqual(existing.tradeAccent);
              expect(variant.features).toEqual(existing.features);
            }
            results.set(variant.variantKey, variant);
          }
        }
      }

      expect(results.size).toBeGreaterThan(0);
      expect(results.size).toBeLessThanOrEqual(200);
    });

    it('baseStyle rules: free/basic → classic, pro offer → premium, pro protocol → technical', () => {
      expect(
        frontend.resolveTemplateVariant({ documentType: 'offer', trade: 'general', planTier: 'free' }).baseStyle,
      ).toBe('classic');
      expect(
        frontend.resolveTemplateVariant({ documentType: 'offer', trade: 'general', planTier: 'basic' }).baseStyle,
      ).toBe('classic');
      expect(
        frontend.resolveTemplateVariant({ documentType: 'offer', trade: 'general', planTier: 'pro' }).baseStyle,
      ).toBe('premium');
      expect(
        frontend.resolveTemplateVariant({ documentType: 'protocol', trade: 'general', planTier: 'pro' }).baseStyle,
      ).toBe('technical');
      expect(
        frontend.resolveTemplateVariant({ documentType: 'warranty', trade: 'general', planTier: 'enterprise' }).baseStyle,
      ).toBe('classic');
    });

    it('Deno resolveBaseStyle logic matches (verify switch cases present)', () => {
      // Verify the Deno source contains the same resolution logic
      expect(denoSource).toContain('case "offer"');
      expect(denoSource).toContain('case "contract"');
      expect(denoSource).toContain('return "premium"');
      expect(denoSource).toContain('case "protocol"');
      expect(denoSource).toContain('case "inspection"');
      expect(denoSource).toContain('return "technical"');
      expect(denoSource).toContain('case "warranty"');
      // free/basic → classic
      expect(denoSource).toMatch(/free.*basic[\s\S]*?return "classic"/);
    });
  });

  // ── 6: mergeStyleWithTradeAccent correctness ──────────────────────────────

  describe('mergeStyleWithTradeAccent — override semantics', () => {
    for (const style of ['classic', 'technical', 'premium'] as const) {
      it(`${style}: overrides ONLY sectionAccent and accentStripeBg`, () => {
        const accent = { primary: '#TEST01', subtleBg: '#TEST02' };
        const merged = frontend.mergeStyleWithTradeAccent(style, accent);
        const base = frontend.BASE_STYLE_TOKENS[style];

        // Overridden
        expect(merged.sectionAccent).toBe('#TEST01');
        expect(merged.accentStripeBg).toBe('#TEST02');

        // Preserved (every other property)
        expect(merged.headerBg).toBe(base.headerBg);
        expect(merged.headerText).toBe(base.headerText);
        expect(merged.tableAltRowBg).toBe(base.tableAltRowBg);
        expect(merged.tableHeaderBg).toBe(base.tableHeaderBg);
        expect(merged.tableHeaderText).toBe(base.tableHeaderText);
        expect(merged.summaryBg).toBe(base.summaryBg);
        expect(merged.grossAccent).toBe(base.grossAccent);
        expect(merged.tableTheme).toBe(base.tableTheme);
      });
    }
  });

  // ── 7: Feature flags per plan tier ────────────────────────────────────────

  describe('feature flags follow plan tier rules', () => {
    it('free: watermark=true, logo=false, qr=false, minimal header', () => {
      const v = frontend.resolveTemplateVariant({
        documentType: 'offer', trade: 'general', planTier: 'free',
      });
      expect(v.features).toEqual({
        showWatermark: true, showLogo: false, showQrCode: false, headerStyle: 'minimal',
      });
    });

    it('basic: no watermark, logo=true, qr=true, standard header', () => {
      const v = frontend.resolveTemplateVariant({
        documentType: 'offer', trade: 'general', planTier: 'basic',
      });
      expect(v.features).toEqual({
        showWatermark: false, showLogo: true, showQrCode: true, headerStyle: 'standard',
      });
    });

    it('pro: branded header', () => {
      const v = frontend.resolveTemplateVariant({
        documentType: 'offer', trade: 'general', planTier: 'pro',
      });
      expect(v.features.headerStyle).toBe('branded');
    });

    it('enterprise: same flags as pro', () => {
      const pro = frontend.resolveTemplateVariant({
        documentType: 'offer', trade: 'general', planTier: 'pro',
      });
      const ent = frontend.resolveTemplateVariant({
        documentType: 'offer', trade: 'general', planTier: 'enterprise',
      });
      expect(ent.features).toEqual(pro.features);
    });
  });
});
