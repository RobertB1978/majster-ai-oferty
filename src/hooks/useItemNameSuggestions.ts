/**
 * useItemNameSuggestions
 *
 * Returns item suggestions from two truthful sources:
 *  1. The user's own price book (item_templates table)
 *  2. Recently used item prices from past offers (offer_items table)
 *
 * Source labels are explicit — no fake "AI pricing" or invented market data.
 * Historical prices are derived from real offer_items the user themselves created.
 *
 * Enabled only when search string has 2+ characters to avoid noisy results.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PriceBookSuggestion {
  id: string;
  name: string;
  unit: string;
  price: number;
  category: 'Materiał' | 'Robocizna';
  source: 'price_book';
}

export interface HistoricalSuggestion {
  /** Stable client-side id derived from lowercased name */
  id: string;
  name: string;
  unit: string;
  /** Most recently used unit_price_net for this item name */
  price: number;
  source: 'recently_used';
}

export type ItemSuggestion = PriceBookSuggestion | HistoricalSuggestion;

export interface UseItemNameSuggestionsResult {
  suggestions: ItemSuggestion[];
  priceBookSuggestions: PriceBookSuggestion[];
  historicalSuggestions: HistoricalSuggestion[];
  isLoading: boolean;
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useItemNameSuggestions(search: string): UseItemNameSuggestionsResult {
  const { user } = useAuth();
  const enabled = !!user && search.trim().length >= 2;

  // 1. Price book: user's own item_templates
  const priceBookQuery = useQuery({
    queryKey: ['itemNameSuggestions', 'priceBook', search] as const,
    queryFn: async (): Promise<PriceBookSuggestion[]> => {
      const { data, error } = await supabase
        .from('item_templates')
        .select('id, name, unit, default_price, category')
        .ilike('name', `%${search.trim()}%`)
        .order('name')
        .limit(5);
      if (error) throw error;
      return (data ?? []).map((d) => ({
        id: d.id as string,
        name: d.name as string,
        unit: (d.unit as string) || 'szt.',
        price: Number(d.default_price) || 0,
        category: (d.category as 'Materiał' | 'Robocizna') || 'Robocizna',
        source: 'price_book' as const,
      }));
    },
    enabled,
    staleTime: 30_000,
  });

  // 2. Historical: recently used prices from the user's own offer_items
  //    Deduplication by name in JS (keeps the most-recent price).
  //    Only returns names NOT already in the price book result.
  const historicalQuery = useQuery({
    queryKey: ['itemNameSuggestions', 'historical', search] as const,
    queryFn: async (): Promise<HistoricalSuggestion[]> => {
      const { data, error } = await supabase
        .from('offer_items')
        .select('name, unit, unit_price_net, updated_at')
        .ilike('name', `%${search.trim()}%`)
        .order('updated_at', { ascending: false })
        .limit(30);
      if (error) throw error;

      // Deduplicate: for each unique name, keep the row with the highest updated_at
      const seen = new Set<string>();
      const deduped: HistoricalSuggestion[] = [];
      for (const item of data ?? []) {
        const key = (item.name as string).toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push({
            id: `hist-${key}`,
            name: item.name as string,
            unit: (item.unit as string) || 'szt.',
            price: Number(item.unit_price_net) || 0,
            source: 'recently_used' as const,
          });
        }
        if (deduped.length >= 3) break;
      }
      return deduped;
    },
    enabled,
    staleTime: 30_000,
  });

  const priceBookSuggestions = priceBookQuery.data ?? [];

  // Exclude historical items whose names are already covered by the price book
  const priceBookNameSet = new Set(
    priceBookSuggestions.map((s) => s.name.toLowerCase().trim()),
  );
  const historicalSuggestions = (historicalQuery.data ?? []).filter(
    (s) => !priceBookNameSet.has(s.name.toLowerCase().trim()),
  );

  return {
    suggestions: [...priceBookSuggestions, ...historicalSuggestions],
    priceBookSuggestions,
    historicalSuggestions,
    isLoading: priceBookQuery.isLoading || historicalQuery.isLoading,
  };
}
