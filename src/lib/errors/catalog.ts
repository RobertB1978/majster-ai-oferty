/**
 * Majster.AI — Central Domain Error Catalog
 *
 * Single source of truth for all standardized domain error codes.
 * Format: MAJ-<DOMAIN>-<SEQ>
 *
 * Adding a new code:
 *  1. Append entry here.
 *  2. Add userMessageKey to all three locale files (pl/en/uk).
 *  3. Reference the code via formatError({ domainCode: 'MAJ-...' }) in your catch block.
 */

export interface ErrorCatalogEntry {
  /** Human-readable domain code, e.g. MAJ-OFF-001 */
  code: string;
  /** Short domain identifier */
  domain: string;
  /** Default HTTP status to use in API/Edge Function responses */
  defaultHttpStatus: number;
  /** Whether the operation can be safely retried by the client */
  retryable: boolean;
  /** Whether the error likely requires developer/owner action (vs. transient) */
  ownerActionRequired: boolean;
  /** i18n key under errors.catalog.<key> in locale files */
  userMessageKey: string;
  /** One-line hint for developer / AI / support triage */
  developerMessage: string;
  /**
   * Problem type URI per RFC 9457 (Problem Details for HTTP APIs).
   * Not a live URL — used as a stable string identifier for API responses.
   */
  problemType: string;
}

const BASE = 'https://majster.ai/errors';

export const ERROR_CATALOG: Record<string, ErrorCatalogEntry> = {
  'MAJ-UNK-001': {
    code: 'MAJ-UNK-001',
    domain: 'unknown',
    defaultHttpStatus: 500,
    retryable: true,
    ownerActionRequired: false,
    userMessageKey: 'MAJ_UNK_001',
    developerMessage: 'Unhandled render or runtime failure — check Sentry for stack trace.',
    problemType: `${BASE}/unknown-runtime-failure`,
  },
  'MAJ-OFF-001': {
    code: 'MAJ-OFF-001',
    domain: 'offer',
    defaultHttpStatus: 500,
    retryable: true,
    ownerActionRequired: false,
    userMessageKey: 'MAJ_OFF_001',
    developerMessage: 'Offer wizard failed to load — check offer data fetch and component tree.',
    problemType: `${BASE}/offer-wizard-load-failed`,
  },
  'MAJ-OFF-002': {
    code: 'MAJ-OFF-002',
    domain: 'offer',
    defaultHttpStatus: 500,
    retryable: true,
    ownerActionRequired: false,
    userMessageKey: 'MAJ_OFF_002',
    developerMessage: 'Offer draft save failed — check Supabase write and RLS policies.',
    problemType: `${BASE}/offer-draft-save-failed`,
  },
  'MAJ-CUS-001': {
    code: 'MAJ-CUS-001',
    domain: 'customer',
    defaultHttpStatus: 422,
    retryable: false,
    ownerActionRequired: false,
    userMessageKey: 'MAJ_CUS_001',
    developerMessage: 'Customer create failed — validate input schema and DB constraints.',
    problemType: `${BASE}/customer-create-failed`,
  },
  'MAJ-DOS-001': {
    code: 'MAJ-DOS-001',
    domain: 'dossier',
    defaultHttpStatus: 500,
    retryable: true,
    ownerActionRequired: false,
    userMessageKey: 'MAJ_DOS_001',
    developerMessage: 'Dossier failed to load — check dossier query, RLS, and related joins.',
    problemType: `${BASE}/dossier-load-failed`,
  },
  'MAJ-WAR-001': {
    code: 'MAJ-WAR-001',
    domain: 'warranty',
    defaultHttpStatus: 500,
    retryable: true,
    ownerActionRequired: false,
    userMessageKey: 'MAJ_WAR_001',
    developerMessage: 'Warranty save failed — check warranty table write and schema.',
    problemType: `${BASE}/warranty-save-failed`,
  },
  'MAJ-CAL-001': {
    code: 'MAJ-CAL-001',
    domain: 'calendar',
    defaultHttpStatus: 422,
    retryable: false,
    ownerActionRequired: false,
    userMessageKey: 'MAJ_CAL_001',
    developerMessage: 'Calendar event create failed — check date validation and conflict rules.',
    problemType: `${BASE}/calendar-event-create-failed`,
  },
  'MAJ-CFG-001': {
    code: 'MAJ-CFG-001',
    domain: 'config',
    defaultHttpStatus: 500,
    retryable: false,
    ownerActionRequired: true,
    userMessageKey: 'MAJ_CFG_001',
    developerMessage: 'Required configuration missing — check env variables (VITE_SUPABASE_URL etc.).',
    problemType: `${BASE}/config-missing`,
  },
  'MAJ-DB-001': {
    code: 'MAJ-DB-001',
    domain: 'database',
    defaultHttpStatus: 503,
    retryable: true,
    ownerActionRequired: true,
    userMessageKey: 'MAJ_DB_001',
    developerMessage: 'Database dependency missing or unreachable — check Supabase project status.',
    problemType: `${BASE}/database-unavailable`,
  },
  'MAJ-AUTH-001': {
    code: 'MAJ-AUTH-001',
    domain: 'auth',
    defaultHttpStatus: 401,
    retryable: false,
    ownerActionRequired: false,
    userMessageKey: 'MAJ_AUTH_001',
    developerMessage: 'Unauthorized access or expired session — user must re-authenticate.',
    problemType: `${BASE}/unauthorized`,
  },
  'MAJ-NET-001': {
    code: 'MAJ-NET-001',
    domain: 'network',
    defaultHttpStatus: 503,
    retryable: true,
    ownerActionRequired: false,
    userMessageKey: 'MAJ_NET_001',
    developerMessage: 'Network request failed — transient connectivity issue, safe to retry.',
    problemType: `${BASE}/network-request-failed`,
  },
};

/** Fallback entry used when no specific code is matched */
export const FALLBACK_CATALOG_ENTRY = ERROR_CATALOG['MAJ-UNK-001'];

/** Resolve a catalog entry by code, falling back to MAJ-UNK-001 */
export function getCatalogEntry(code: string): ErrorCatalogEntry {
  return ERROR_CATALOG[code] ?? FALLBACK_CATALOG_ENTRY;
}
