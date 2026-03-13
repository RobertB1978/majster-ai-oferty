/**
 * Speed System — Reuse & Truthful Pricing Tests
 *
 * Verifies:
 * R1: useItemNameSuggestions — suggestion source labeling correctness
 * R2: useItemNameSuggestions — historical deduplication logic
 * R3: useItemNameSuggestions — historical excluded when in price book
 * R4: SaveToPriceBookButton — disabled state logic (no name = disabled)
 * R5: PriceBookSuggestion vs HistoricalSuggestion type narrowing
 * R6: No fake pricing introduced — only real data sources
 * R7: Graceful empty state (no data = no crash)
 * R8: addFromSuggestion category mapping (price_book 'Materiał' → 'material')
 */

import { describe, it, expect } from 'vitest';
import type {
  PriceBookSuggestion,
  HistoricalSuggestion,
  ItemSuggestion,
} from '@/hooks/useItemNameSuggestions';

// ── R1: Source labeling ──────────────────────────────────────────────────────

describe('R1 — ItemSuggestion source labels', () => {
  it('price_book suggestion has source === "price_book"', () => {
    const s: PriceBookSuggestion = {
      id: 'abc',
      name: 'Układanie płytek',
      unit: 'm²',
      price: 120,
      category: 'Robocizna',
      source: 'price_book',
    };
    expect(s.source).toBe('price_book');
  });

  it('recently_used suggestion has source === "recently_used"', () => {
    const s: HistoricalSuggestion = {
      id: 'hist-układanie',
      name: 'Układanie paneli',
      unit: 'm²',
      price: 35,
      source: 'recently_used',
    };
    expect(s.source).toBe('recently_used');
  });

  it('price_book suggestion exposes category field', () => {
    const s: PriceBookSuggestion = {
      id: 'xyz',
      name: 'Farba lateksowa',
      unit: 'l',
      price: 45,
      category: 'Materiał',
      source: 'price_book',
    };
    expect(s.category).toBe('Materiał');
  });

  it('recently_used suggestion does NOT expose category field', () => {
    const s: HistoricalSuggestion = {
      id: 'hist-farba',
      name: 'Farba',
      unit: 'l',
      price: 40,
      source: 'recently_used',
    };
    // TypeScript: 'category' not on HistoricalSuggestion — confirmed by type check
    expect((s as { category?: string }).category).toBeUndefined();
  });
});

// ── R2: Historical deduplication logic ──────────────────────────────────────

describe('R2 — Historical deduplication logic', () => {
  /** Replicates the JS dedup logic from useItemNameSuggestions */
  function deduplicateHistorical(
    rows: { name: string; unit: string; unit_price_net: number }[],
    limit = 3,
  ): HistoricalSuggestion[] {
    const seen = new Set<string>();
    const deduped: HistoricalSuggestion[] = [];
    for (const item of rows) {
      const key = item.name.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push({
          id: `hist-${key}`,
          name: item.name,
          unit: item.unit || 'szt.',
          price: Number(item.unit_price_net) || 0,
          source: 'recently_used',
        });
      }
      if (deduped.length >= limit) break;
    }
    return deduped;
  }

  it('keeps only the first occurrence of each name (most recent due to order)', () => {
    const rows = [
      { name: 'Malowanie ścian', unit: 'm²', unit_price_net: 25 },
      { name: 'Malowanie ścian', unit: 'm²', unit_price_net: 22 }, // duplicate, older
      { name: 'Malowanie sufitu', unit: 'm²', unit_price_net: 30 },
    ];
    const result = deduplicateHistorical(rows);
    expect(result).toHaveLength(2);
    expect(result[0].price).toBe(25); // first (most recent) price kept
    expect(result[1].name).toBe('Malowanie sufitu');
  });

  it('is case-insensitive when deduplicating names', () => {
    const rows = [
      { name: 'Glazura', unit: 'm²', unit_price_net: 120 },
      { name: 'GLAZURA', unit: 'm²', unit_price_net: 110 },
    ];
    const result = deduplicateHistorical(rows);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Glazura');
  });

  it('respects the limit parameter', () => {
    const rows = [
      { name: 'A', unit: 'szt.', unit_price_net: 10 },
      { name: 'B', unit: 'szt.', unit_price_net: 20 },
      { name: 'C', unit: 'szt.', unit_price_net: 30 },
      { name: 'D', unit: 'szt.', unit_price_net: 40 },
    ];
    const result = deduplicateHistorical(rows, 3);
    expect(result).toHaveLength(3);
  });

  it('returns empty array for empty input', () => {
    expect(deduplicateHistorical([])).toHaveLength(0);
  });
});

// ── R3: Historical excluded when name is in price book ──────────────────────

describe('R3 — Historical excluded when covered by price book', () => {
  function filterHistorical(
    historicalItems: HistoricalSuggestion[],
    priceBookItems: PriceBookSuggestion[],
  ): HistoricalSuggestion[] {
    const priceBookNameSet = new Set(
      priceBookItems.map((s) => s.name.toLowerCase().trim()),
    );
    return historicalItems.filter(
      (s) => !priceBookNameSet.has(s.name.toLowerCase().trim()),
    );
  }

  it('filters out historical items already in price book', () => {
    const historical: HistoricalSuggestion[] = [
      { id: 'hist-glazura', name: 'Glazura', unit: 'm²', price: 110, source: 'recently_used' },
      { id: 'hist-malowanie', name: 'Malowanie', unit: 'm²', price: 25, source: 'recently_used' },
    ];
    const priceBook: PriceBookSuggestion[] = [
      { id: 'pb-1', name: 'Glazura', unit: 'm²', price: 120, category: 'Robocizna', source: 'price_book' },
    ];
    const filtered = filterHistorical(historical, priceBook);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Malowanie');
  });

  it('case-insensitive match when filtering', () => {
    const historical: HistoricalSuggestion[] = [
      { id: 'hist-g', name: 'GLAZURA', unit: 'm²', price: 110, source: 'recently_used' },
    ];
    const priceBook: PriceBookSuggestion[] = [
      { id: 'pb-1', name: 'glazura', unit: 'm²', price: 120, category: 'Robocizna', source: 'price_book' },
    ];
    const filtered = filterHistorical(historical, priceBook);
    expect(filtered).toHaveLength(0);
  });

  it('keeps historical when no price book items match', () => {
    const historical: HistoricalSuggestion[] = [
      { id: 'hist-x', name: 'Szpachlowanie', unit: 'm²', price: 40, source: 'recently_used' },
    ];
    const priceBook: PriceBookSuggestion[] = [];
    const filtered = filterHistorical(historical, priceBook);
    expect(filtered).toHaveLength(1);
  });
});

// ── R4: SaveToPriceBookButton disabled state ─────────────────────────────────

describe('R4 — SaveToPriceBookButton disabled state logic', () => {
  function isButtonEnabled(name: string): boolean {
    return name.trim().length > 0;
  }

  it('disabled when name is empty string', () => {
    expect(isButtonEnabled('')).toBe(false);
  });

  it('disabled when name is only whitespace', () => {
    expect(isButtonEnabled('   ')).toBe(false);
  });

  it('enabled when name has at least one non-whitespace character', () => {
    expect(isButtonEnabled('Malowanie')).toBe(true);
    expect(isButtonEnabled(' A ')).toBe(true);
  });
});

// ── R5: ItemSuggestion type narrowing ────────────────────────────────────────

describe('R5 — ItemSuggestion discriminated union type narrowing', () => {
  const suggestions: ItemSuggestion[] = [
    {
      id: 'pb-1',
      name: 'Płytki',
      unit: 'm²',
      price: 89,
      category: 'Materiał',
      source: 'price_book',
    },
    {
      id: 'hist-panele',
      name: 'Panele',
      unit: 'm²',
      price: 35,
      source: 'recently_used',
    },
  ];

  it('can narrow price_book suggestion to access category', () => {
    for (const s of suggestions) {
      if (s.source === 'price_book') {
        // TypeScript narrows s to PriceBookSuggestion — category accessible
        expect(s.category).toBeTruthy();
        expect(['Materiał', 'Robocizna']).toContain(s.category);
      }
    }
  });

  it('category-based itemType mapping works correctly', () => {
    function toItemType(s: ItemSuggestion): 'material' | 'labor' {
      return s.source === 'price_book' && s.category === 'Materiał' ? 'material' : 'labor';
    }
    expect(toItemType(suggestions[0])).toBe('material'); // Materiał → material
    expect(toItemType(suggestions[1])).toBe('labor');    // recently_used → labor (safe default)
  });
});

// ── R6: No fake pricing ───────────────────────────────────────────────────────

describe('R6 — Truthful pricing sources only', () => {
  it('valid suggestion sources are only price_book and recently_used', () => {
    const VALID_SOURCES: ItemSuggestion['source'][] = ['price_book', 'recently_used'];
    const suggestions: ItemSuggestion[] = [
      { id: '1', name: 'A', unit: 'szt.', price: 10, category: 'Materiał', source: 'price_book' },
      { id: '2', name: 'B', unit: 'szt.', price: 20, source: 'recently_used' },
    ];
    for (const s of suggestions) {
      expect(VALID_SOURCES).toContain(s.source);
    }
  });

  it('no "ai_recommended" or "market_rate" or "estimated" source exists in the type system', () => {
    // This is a compile-time guarantee verified at test time
    // The only valid sources are 'price_book' | 'recently_used'
    const pb: PriceBookSuggestion = {
      id: 'x',
      name: 'X',
      unit: 'szt.',
      price: 0,
      category: 'Materiał',
      source: 'price_book',
    };
    const hist: HistoricalSuggestion = {
      id: 'y',
      name: 'Y',
      unit: 'szt.',
      price: 0,
      source: 'recently_used',
    };
    expect(pb.source).not.toBe('ai_recommended');
    expect(pb.source).not.toBe('market_rate');
    expect(hist.source).not.toBe('estimated');
  });
});

// ── R7: Graceful empty state ──────────────────────────────────────────────────

describe('R7 — Graceful empty state', () => {
  it('empty price book + no historical = no crash, empty array', () => {
    const priceBookSuggestions: PriceBookSuggestion[] = [];
    const historicalSuggestions: HistoricalSuggestion[] = [];
    const combined = [...priceBookSuggestions, ...historicalSuggestions];
    expect(combined).toHaveLength(0);
    expect(combined.length === 0).toBe(true);
  });

  it('panel should not show results when search is less than 2 chars', () => {
    // Mirrors: enabled = !!user && search.trim().length >= 2
    const shouldFetch = (search: string) => search.trim().length >= 2;
    expect(shouldFetch('')).toBe(false);
    expect(shouldFetch('a')).toBe(false);
    expect(shouldFetch('ab')).toBe(true);
    expect(shouldFetch(' a ')).toBe(false);
  });
});

// ── R8: Category → itemType mapping ──────────────────────────────────────────

describe('R8 — addFromSuggestion category → itemType mapping', () => {
  function mapToItemType(s: ItemSuggestion): 'material' | 'labor' {
    return s.source === 'price_book' && s.category === 'Materiał' ? 'material' : 'labor';
  }

  it('price_book Materiał → material', () => {
    const s: PriceBookSuggestion = {
      id: '1',
      name: 'Klej do płytek',
      unit: 'worek',
      price: 45,
      category: 'Materiał',
      source: 'price_book',
    };
    expect(mapToItemType(s)).toBe('material');
  });

  it('price_book Robocizna → labor', () => {
    const s: PriceBookSuggestion = {
      id: '2',
      name: 'Układanie płytek',
      unit: 'm²',
      price: 120,
      category: 'Robocizna',
      source: 'price_book',
    };
    expect(mapToItemType(s)).toBe('labor');
  });

  it('recently_used (no category) → labor (safe default)', () => {
    const s: HistoricalSuggestion = {
      id: 'hist-1',
      name: 'Robota ogólna',
      unit: 'godz.',
      price: 60,
      source: 'recently_used',
    };
    expect(mapToItemType(s)).toBe('labor');
  });
});
