import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  storePendingAcceptances,
  getPendingAcceptances,
  clearPendingAcceptances,
  writePendingAcceptances,
} from './acceptance';
import type { SignupLegalDoc } from './acceptance';

// ---------------------------------------------------------------------------
// Supabase mock — vi.hoisted so variables are resolved before the module is
// hoisted to the top of the file by Vitest.
// ---------------------------------------------------------------------------
const { mockInsert, mockFrom } = vi.hoisted(() => {
  const mockInsert = vi.fn();
  const mockFrom = vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ data: [], error: null }),
    insert: mockInsert,
  }));
  return { mockInsert, mockFrom };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom },
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const TERMS_DOC: SignupLegalDoc = {
  id: 'uuid-terms-001',
  slug: 'terms',
  version: '1.0',
  title: 'Regulamin Serwisu',
};

const PRIVACY_DOC: SignupLegalDoc = {
  id: 'uuid-privacy-001',
  slug: 'privacy',
  version: '1.0',
  title: 'Polityka Prywatności',
};

const SAMPLE_DOCS: SignupLegalDoc[] = [TERMS_DOC, PRIVACY_DOC];
const STORAGE_KEY = 'majster_pending_legal_acceptances';

// ---------------------------------------------------------------------------
// localStorage setup.
//
// src/test/setup.ts replaces window.localStorage with a vi.fn() mock that has
// no implementation (returns undefined by default). We configure a real
// in-memory store in beforeEach so the acceptance module can read/write.
// ---------------------------------------------------------------------------
let store: Record<string, string> = {};

function setupLocalStorageMock() {
  store = {};
  const ls = window.localStorage;
  vi.mocked(ls.getItem).mockImplementation((k: string) => store[k] ?? null);
  vi.mocked(ls.setItem).mockImplementation((k: string, v: string) => { store[k] = String(v); });
  vi.mocked(ls.removeItem).mockImplementation((k: string) => { delete store[k]; });
  vi.mocked(ls.clear).mockImplementation(() => { store = {}; });
}

beforeEach(() => {
  vi.clearAllMocks();
  setupLocalStorageMock();
  mockInsert.mockResolvedValue({ data: null, error: null });
});

afterEach(() => {
  vi.restoreAllMocks();
  // Re-apply localStorage mock because restoreAllMocks wipes vi.fn implementations.
  setupLocalStorageMock();
});

// ---------------------------------------------------------------------------
// storePendingAcceptances + getPendingAcceptances
// ---------------------------------------------------------------------------
describe('storePendingAcceptances', () => {
  it('writes two items for terms + privacy docs', () => {
    storePendingAcceptances(SAMPLE_DOCS);
    const pending = getPendingAcceptances();
    expect(pending).not.toBeNull();
    expect(pending!.length).toBe(2);
  });

  it('stores correct document_id for each doc', () => {
    storePendingAcceptances(SAMPLE_DOCS);
    const pending = getPendingAcceptances()!;
    const termsItem = pending.find(p => p.slug === 'terms');
    const privacyItem = pending.find(p => p.slug === 'privacy');
    expect(termsItem?.document_id).toBe('uuid-terms-001');
    expect(privacyItem?.document_id).toBe('uuid-privacy-001');
  });

  it('sets acceptance_source to "signup"', () => {
    storePendingAcceptances(SAMPLE_DOCS);
    const pending = getPendingAcceptances()!;
    expect(pending.every(p => p.acceptance_source === 'signup')).toBe(true);
  });

  it('accepted_at is a valid ISO timestamp', () => {
    storePendingAcceptances(SAMPLE_DOCS);
    const pending = getPendingAcceptances()!;
    for (const item of pending) {
      expect(new Date(item.accepted_at).toISOString()).toBe(item.accepted_at);
    }
  });
});

// ---------------------------------------------------------------------------
// getPendingAcceptances — TTL
// ---------------------------------------------------------------------------
describe('getPendingAcceptances', () => {
  it('returns null when localStorage is empty', () => {
    expect(getPendingAcceptances()).toBeNull();
  });

  it('returns null for expired records and removes the key', () => {
    const expired = {
      items: [{
        document_id: 'x',
        slug: 'terms',
        version: '1.0',
        accepted_at: new Date().toISOString(),
        user_agent: 'ua',
        acceptance_source: 'signup',
      }],
      expires_at: Date.now() - 1000,
    };
    store[STORAGE_KEY] = JSON.stringify(expired);
    expect(getPendingAcceptances()).toBeNull();
    expect(store[STORAGE_KEY]).toBeUndefined();
  });

  it('returns null for corrupt localStorage data', () => {
    store[STORAGE_KEY] = 'not-json{{{';
    expect(getPendingAcceptances()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// clearPendingAcceptances
// ---------------------------------------------------------------------------
describe('clearPendingAcceptances', () => {
  it('removes the localStorage key', () => {
    storePendingAcceptances(SAMPLE_DOCS);
    expect(getPendingAcceptances()).not.toBeNull();
    clearPendingAcceptances();
    expect(getPendingAcceptances()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// writePendingAcceptances
// ---------------------------------------------------------------------------
describe('writePendingAcceptances', () => {
  it('does nothing when there are no pending acceptances', async () => {
    await writePendingAcceptances('user-abc');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('inserts one row per pending document with correct fields', async () => {
    storePendingAcceptances(SAMPLE_DOCS);
    await writePendingAcceptances('user-abc');

    expect(mockInsert).toHaveBeenCalledOnce();
    const rows = mockInsert.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(2);

    const termsRow = rows.find(r => r['legal_document_id'] === 'uuid-terms-001');
    expect(termsRow).toBeDefined();
    expect(termsRow!['user_id']).toBe('user-abc');
    expect(termsRow!['acceptance_source']).toBe('signup');
    expect(termsRow!['ip_hash']).toBeNull();
    expect(termsRow!['user_agent']).toBeDefined();
  });

  it('clears localStorage after a successful write', async () => {
    storePendingAcceptances(SAMPLE_DOCS);
    await writePendingAcceptances('user-abc');
    expect(getPendingAcceptances()).toBeNull();
  });

  it('does NOT clear localStorage when the insert fails', async () => {
    mockInsert.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
    storePendingAcceptances(SAMPLE_DOCS);
    await writePendingAcceptances('user-abc');
    // Pending records must survive so a retry is possible later.
    expect(getPendingAcceptances()).not.toBeNull();
  });

  it('does not throw even if insert fails (never blocks session)', async () => {
    mockInsert.mockResolvedValueOnce({ data: null, error: { message: 'network error' } });
    storePendingAcceptances(SAMPLE_DOCS);
    await expect(writePendingAcceptances('user-abc')).resolves.toBeUndefined();
  });
});
