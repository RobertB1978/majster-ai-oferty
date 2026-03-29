/**
 * Majster.AI — Error Standard
 *
 * Public API for the standardized error module.
 *
 * Consumers:
 *   import { formatError, ERROR_CATALOG, getCatalogEntry } from '@/lib/errors';
 */

export { formatError } from './formatError';
export type { FormattedError, FormatErrorContext, ProblemDetails } from './formatError';

export { ERROR_CATALOG, getCatalogEntry, FALLBACK_CATALOG_ENTRY } from './catalog';
export type { ErrorCatalogEntry } from './catalog';
