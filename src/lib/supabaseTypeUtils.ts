/**
 * supabaseTypeUtils — helpers for bridging Supabase generated types and
 * application-level interfaces.
 *
 * The generated Supabase types represent JSON columns as the generic `Json`
 * type. These helpers provide a single, auditable cast point instead of
 * scattering `as unknown as` throughout the codebase.
 */

import type { Json } from '@/integrations/supabase/types';

/**
 * Cast a Supabase `Json` value to a specific application type.
 *
 * Use this for JSON/JSONB columns where the stored shape is known at the
 * application level but Supabase types only expose `Json`.
 *
 * @example
 *   const positions = parseJsonColumn<QuotePosition[]>(row.positions, []);
 */
export function parseJsonColumn<T>(value: Json | null | undefined, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  // The runtime value already has the right shape (parsed by PostgREST),
  // so a single cast is safe here.
  return value as unknown as T;
}

/**
 * Convert an application-level object to `Json` for Supabase insert/update.
 *
 * Supabase expects `Json` for JSONB columns. This performs a single cast
 * through `unknown`, avoiding scattered double-casts in calling code.
 */
export function toJsonColumn<T>(value: T): Json {
  return value as unknown as Json;
}

/**
 * Extend a Supabase insert/update row with extra columns that exist in the
 * database but are missing from the generated types (e.g. after a migration
 * that hasn't been regenerated yet).
 *
 * This replaces scattered `as never` casts on insert/update objects.
 *
 * @example
 *   await supabase.from('offers').insert(
 *     withExtraColumns<OffersInsert>({ user_id: '...' }, { source: 'quick_estimate', vat_enabled: true })
 *   );
 */
export function withExtraColumns<TBase>(
  base: TBase,
  extras: Record<string, unknown>,
): TBase {
  return { ...base, ...extras } as TBase;
}

/**
 * Type-assert a Supabase query result. Use when the query selects columns
 * that are not in the generated types (e.g. columns added after type
 * generation) and `.returns<T>()` is not suitable.
 *
 * This replaces `as unknown as Promise<{ data: T; error: ... }>` casts
 * on entire query chains.
 */
export function typedResult<T>(
  promise: PromiseLike<{ data: unknown; error: unknown }>,
): Promise<{ data: T; error: unknown }> {
  return promise as Promise<{ data: T; error: unknown }>;
}

/**
 * Type-assert a Supabase mutation result (insert/update/delete with no
 * selected data). Replaces `as unknown as Promise<{ error: unknown }>`.
 */
export function typedMutationResult(
  promise: PromiseLike<{ data: unknown; error: unknown }>,
): Promise<{ error: unknown }> {
  return promise as Promise<{ error: unknown }>;
}
