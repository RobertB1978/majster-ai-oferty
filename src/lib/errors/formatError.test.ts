import { describe, it, expect } from 'vitest';
import { formatError } from './formatError';

// ---------------------------------------------------------------------------
// Helpers — fake Supabase / network error shapes
// ---------------------------------------------------------------------------

const postgrestError = { code: 'PGRST116', message: 'No rows found', details: '' };
const postgresUniqueError = { code: '23505', message: 'duplicate key value', details: '' };
const authError401 = { status: 401, message: 'JWT expired', name: 'AuthError' };
const authError403 = { status: 403, message: 'Forbidden', name: 'AuthError' };
const authErrorByName = { status: 200, message: 'error', name: 'AuthApiError' };
const authErrorByMessage = new Error('unauthorized access detected');
const networkError = new Error('Failed to fetch');
const networkError2 = new Error('NetworkError when attempting to fetch resource');
const genericError = new Error('Something completely unknown');

// ---------------------------------------------------------------------------
// Shape contract
// ---------------------------------------------------------------------------

describe('formatError — return shape', () => {
  it('should always return all required fields', () => {
    const fmt = formatError(genericError);
    expect(fmt).toHaveProperty('code');
    expect(fmt).toHaveProperty('requestId');
    expect(fmt).toHaveProperty('fingerprint');
    expect(fmt).toHaveProperty('userMessage');
    expect(fmt).toHaveProperty('developerMessage');
    expect(fmt).toHaveProperty('retryable');
    expect(fmt).toHaveProperty('ownerActionRequired');
    expect(fmt).toHaveProperty('problem');
    expect(fmt).toHaveProperty('catalogEntry');
  });

  it('problem shape should match RFC 9457', () => {
    const fmt = formatError(genericError);
    expect(fmt.problem).toHaveProperty('type');
    expect(fmt.problem).toHaveProperty('title');
    expect(fmt.problem).toHaveProperty('status');
    expect(fmt.problem).toHaveProperty('detail');
    expect(fmt.problem).toHaveProperty('code');
    expect(fmt.problem).toHaveProperty('request_id');
    expect(fmt.problem.request_id).toBe(fmt.requestId);
    expect(fmt.problem.code).toBe(fmt.code);
  });

  it('requestId should match REQ-XXXXXXXX format', () => {
    const fmt = formatError(genericError);
    expect(fmt.requestId).toMatch(/^REQ-[0-9A-F]{8}$/);
  });

  it('fingerprint should match ERR-XXXXXXXX format', () => {
    const fmt = formatError(genericError);
    expect(fmt.fingerprint).toMatch(/^ERR-[0-9A-F]{8}$/);
  });

  it('requestId should be unique per call', () => {
    const ids = Array.from({ length: 10 }, () => formatError(genericError).requestId);
    const unique = new Set(ids);
    expect(unique.size).toBe(10);
  });

  it('fingerprint should be stable for the same error', () => {
    const err = new Error('consistent error message');
    const fp1 = formatError(err).fingerprint;
    const fp2 = formatError(err).fingerprint;
    expect(fp1).toBe(fp2);
  });

  it('userMessage should be a non-empty localized string', () => {
    const fmt = formatError(genericError);
    expect(fmt.userMessage).toBeTruthy();
    // Should not return the raw i18n key
    expect(fmt.userMessage).not.toMatch(/^errors\./);
  });
});

// ---------------------------------------------------------------------------
// Fallback — unknown errors → MAJ-UNK-001
// ---------------------------------------------------------------------------

describe('formatError — fallback to MAJ-UNK-001', () => {
  it('should use MAJ-UNK-001 for a generic Error', () => {
    expect(formatError(genericError).code).toBe('MAJ-UNK-001');
  });

  it('should use MAJ-UNK-001 for a plain string thrown value', () => {
    expect(formatError('some string error').code).toBe('MAJ-UNK-001');
  });

  it('should use MAJ-UNK-001 for null', () => {
    expect(formatError(null).code).toBe('MAJ-UNK-001');
  });

  it('should use MAJ-UNK-001 for undefined', () => {
    expect(formatError(undefined).code).toBe('MAJ-UNK-001');
  });

  it('MAJ-UNK-001 should be retryable', () => {
    expect(formatError(genericError).retryable).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Auto-detection — Auth errors → MAJ-AUTH-001
// ---------------------------------------------------------------------------

describe('formatError — auto-detect MAJ-AUTH-001', () => {
  it('should detect status 401', () => {
    expect(formatError(authError401).code).toBe('MAJ-AUTH-001');
  });

  it('should detect status 403', () => {
    expect(formatError(authError403).code).toBe('MAJ-AUTH-001');
  });

  it('should detect AuthError by name field', () => {
    expect(formatError(authErrorByName).code).toBe('MAJ-AUTH-001');
  });

  it('should detect "unauthorized" in message', () => {
    expect(formatError(authErrorByMessage).code).toBe('MAJ-AUTH-001');
  });

  it('MAJ-AUTH-001 should NOT be retryable', () => {
    expect(formatError(authError401).retryable).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Auto-detection — DB errors → MAJ-DB-001
// ---------------------------------------------------------------------------

describe('formatError — auto-detect MAJ-DB-001', () => {
  it('should detect PGRST* PostgREST error code', () => {
    expect(formatError(postgrestError).code).toBe('MAJ-DB-001');
  });

  it('should detect PGRST116 (not found)', () => {
    expect(formatError({ code: 'PGRST116', message: 'No rows' }).code).toBe('MAJ-DB-001');
  });

  it('should detect 5-char Postgres error code (23505 unique violation)', () => {
    expect(formatError(postgresUniqueError).code).toBe('MAJ-DB-001');
  });

  it('should detect 42P01 (undefined table)', () => {
    expect(formatError({ code: '42P01', message: 'relation does not exist' }).code).toBe('MAJ-DB-001');
  });

  it('MAJ-DB-001 should be retryable', () => {
    expect(formatError(postgrestError).retryable).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Auto-detection — Network errors → MAJ-NET-001
// ---------------------------------------------------------------------------

describe('formatError — auto-detect MAJ-NET-001', () => {
  it('should detect "Failed to fetch"', () => {
    expect(formatError(networkError).code).toBe('MAJ-NET-001');
  });

  it('should detect "NetworkError" in message', () => {
    expect(formatError(networkError2).code).toBe('MAJ-NET-001');
  });

  it('should detect "network request failed" case-insensitively', () => {
    expect(formatError(new Error('Network Request Failed')).code).toBe('MAJ-NET-001');
  });

  it('MAJ-NET-001 should be retryable', () => {
    expect(formatError(networkError).retryable).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Explicit context — wins over auto-detection
// ---------------------------------------------------------------------------

describe('formatError — explicit domainCode takes priority', () => {
  it('explicit MAJ-OFF-001 wins over auto-detected MAJ-DB-001', () => {
    const fmt = formatError(postgrestError, { domainCode: 'MAJ-OFF-001' });
    expect(fmt.code).toBe('MAJ-OFF-001');
  });

  it('explicit MAJ-OFF-002 wins for generic error', () => {
    expect(formatError(genericError, { domainCode: 'MAJ-OFF-002' }).code).toBe('MAJ-OFF-002');
  });

  it('unknown explicit code falls back to MAJ-UNK-001', () => {
    expect(formatError(genericError, { domainCode: 'MAJ-NONEXISTENT-999' }).code).toBe('MAJ-UNK-001');
  });

  it('route is appended to problem.detail', () => {
    const fmt = formatError(genericError, { route: '/offers/123' });
    expect(fmt.problem.detail).toContain('[route: /offers/123]');
  });
});

// ---------------------------------------------------------------------------
// Catalog integrity
// ---------------------------------------------------------------------------

describe('ERROR_CATALOG integrity', () => {
  it('every catalog entry should have a valid code format', async () => {
    const { ERROR_CATALOG } = await import('./catalog');
    const codePattern = /^MAJ-[A-Z]+-\d{3}$/;
    for (const entry of Object.values(ERROR_CATALOG)) {
      expect(entry.code, `Invalid code format: ${entry.code}`).toMatch(codePattern);
    }
  });

  it('every catalog entry key should match its code field', async () => {
    const { ERROR_CATALOG } = await import('./catalog');
    for (const [key, entry] of Object.entries(ERROR_CATALOG)) {
      expect(entry.code).toBe(key);
    }
  });

  it('every catalog entry should have a non-empty userMessageKey', async () => {
    const { ERROR_CATALOG } = await import('./catalog');
    for (const entry of Object.values(ERROR_CATALOG)) {
      expect(entry.userMessageKey, `${entry.code} missing userMessageKey`).toBeTruthy();
    }
  });

  it('every catalog entry should have a valid defaultHttpStatus', async () => {
    const { ERROR_CATALOG } = await import('./catalog');
    const validStatuses = [200, 400, 401, 403, 404, 409, 422, 500, 503];
    for (const entry of Object.values(ERROR_CATALOG)) {
      expect(
        validStatuses,
        `${entry.code} has invalid defaultHttpStatus: ${entry.defaultHttpStatus}`
      ).toContain(entry.defaultHttpStatus);
    }
  });
});
