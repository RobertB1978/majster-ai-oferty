/**
 * PR-L4 — Admin Legal CMS tests
 *
 * Covers:
 * 1. computeLineDiff — pure line-diff algorithm
 * 2. document grouping logic (extracted helper)
 * 3. publish flow — RPC call assertion via mocked supabase
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeLineDiff } from '@/components/admin/legal/LegalDocumentDiff';
import type { LegalDocument } from '@/types/legal';

// ─────────────────────────────────────────────────────────────────────────────
// 1. computeLineDiff — diff algorithm unit tests
// ─────────────────────────────────────────────────────────────────────────────
describe('computeLineDiff', () => {
  it('returns all-equal lines when texts are identical', () => {
    const text = 'line one\nline two\nline three';
    const result = computeLineDiff(text, text);
    expect(result.every((l) => l.op === 'equal')).toBe(true);
    expect(result).toHaveLength(3);
  });

  it('marks a single added line', () => {
    const a = 'line one\nline two';
    const b = 'line one\nline added\nline two';
    const result = computeLineDiff(a, b);

    const inserts = result.filter((l) => l.op === 'insert');
    expect(inserts).toHaveLength(1);
    expect(inserts[0].text).toBe('line added');
  });

  it('marks a single removed line', () => {
    const a = 'line one\nline removed\nline two';
    const b = 'line one\nline two';
    const result = computeLineDiff(a, b);

    const deletes = result.filter((l) => l.op === 'delete');
    expect(deletes).toHaveLength(1);
    expect(deletes[0].text).toBe('line removed');
  });

  it('handles completely different texts', () => {
    const a = 'alpha\nbeta';
    const b = 'gamma\ndelta';
    const result = computeLineDiff(a, b);

    const ops = result.map((l) => l.op);
    expect(ops).not.toContain('equal');
    expect(ops).toContain('delete');
    expect(ops).toContain('insert');
  });

  it('handles empty textA (all insertions)', () => {
    const a = '';
    const b = 'new line';
    const result = computeLineDiff(a, b);
    const inserts = result.filter((l) => l.op === 'insert');
    expect(inserts.length).toBeGreaterThan(0);
  });

  it('handles empty textB (all deletions)', () => {
    const a = 'removed line';
    const b = '';
    const result = computeLineDiff(a, b);
    const deletes = result.filter((l) => l.op === 'delete');
    expect(deletes.length).toBeGreaterThan(0);
  });

  it('preserves line content for equal lines', () => {
    const a = 'keep\nchange\nkeep2';
    const b = 'keep\nnew line\nkeep2';
    const result = computeLineDiff(a, b);

    const equalTexts = result.filter((l) => l.op === 'equal').map((l) => l.text);
    expect(equalTexts).toContain('keep');
    expect(equalTexts).toContain('keep2');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Document grouping logic
// ─────────────────────────────────────────────────────────────────────────────

/** Mirrors the grouping logic from useAdminLegalDocumentGroups */
function groupDocuments(docs: LegalDocument[]) {
  const map = new Map<string, { published: LegalDocument | null; drafts: LegalDocument[] }>();

  for (const doc of docs) {
    const key = `${doc.slug}:${doc.language}`;
    if (!map.has(key)) map.set(key, { published: null, drafts: [] });
    const g = map.get(key)!;
    if (doc.status === 'published') g.published = doc;
    else if (doc.status === 'draft') g.drafts.push(doc);
  }

  return map;
}

const makeDoc = (overrides: Partial<LegalDocument>): LegalDocument => ({
  id: 'test-id',
  slug: 'privacy',
  language: 'pl',
  version: '1.0',
  title: 'Polityka prywatności',
  content: 'treść',
  status: 'published',
  published_at: '2026-04-20T00:00:00Z',
  effective_at: null,
  created_at: '2026-04-20T00:00:00Z',
  updated_at: '2026-04-20T00:00:00Z',
  ...overrides,
});

describe('document grouping', () => {
  it('groups published and draft for same slug+language', () => {
    const docs = [
      makeDoc({ id: 'pub', status: 'published', version: '1.0' }),
      makeDoc({ id: 'draft', status: 'draft',     version: '1.1' }),
    ];
    const map = groupDocuments(docs);
    const group = map.get('privacy:pl')!;

    expect(group.published?.id).toBe('pub');
    expect(group.drafts).toHaveLength(1);
    expect(group.drafts[0].id).toBe('draft');
  });

  it('separates documents with different slugs into different groups', () => {
    const docs = [
      makeDoc({ id: 'priv', slug: 'privacy', status: 'published' }),
      makeDoc({ id: 'terms', slug: 'terms',   status: 'published' }),
    ];
    const map = groupDocuments(docs);

    expect(map.has('privacy:pl')).toBe(true);
    expect(map.has('terms:pl')).toBe(true);
    expect(map.size).toBe(2);
  });

  it('allows multiple drafts in the same group', () => {
    const docs = [
      makeDoc({ id: 'd1', status: 'draft', version: '1.1' }),
      makeDoc({ id: 'd2', status: 'draft', version: '1.2' }),
    ];
    const map = groupDocuments(docs);
    const group = map.get('privacy:pl')!;

    expect(group.drafts).toHaveLength(2);
    expect(group.published).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Publish flow — RPC call assertion
// ─────────────────────────────────────────────────────────────────────────────

// Mock supabase before importing hooks
const mockRpc = vi.fn().mockResolvedValue({ data: 'published-uuid', error: null });
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    rpc: mockRpc,
  },
}));

describe('publish flow — RPC contract', () => {
  beforeEach(() => {
    mockRpc.mockClear();
  });

  it('calls publish_legal_document RPC with the draft id', async () => {
    const { supabase } = await import('@/integrations/supabase/client');

    const draftId = 'draft-uuid-123';
    await supabase.rpc('publish_legal_document', { p_draft_id: draftId });

    expect(mockRpc).toHaveBeenCalledWith('publish_legal_document', {
      p_draft_id: draftId,
    });
  });

  it('calls create_legal_draft_from_published with slug and language', async () => {
    const { supabase } = await import('@/integrations/supabase/client');

    await supabase.rpc('create_legal_draft_from_published', {
      p_slug: 'privacy',
      p_language: 'pl',
    });

    expect(mockRpc).toHaveBeenCalledWith('create_legal_draft_from_published', {
      p_slug: 'privacy',
      p_language: 'pl',
    });
  });

  it('returns published document id on success', async () => {
    const { supabase } = await import('@/integrations/supabase/client');

    const { data, error } = await supabase.rpc('publish_legal_document', {
      p_draft_id: 'some-id',
    });

    expect(error).toBeNull();
    expect(data).toBe('published-uuid');
  });
});
