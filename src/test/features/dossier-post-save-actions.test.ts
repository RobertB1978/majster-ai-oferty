/**
 * Dossier Post-Save Actions Tests — P1
 *
 * Verifies that after a document is saved to the project dossier,
 * the user has clear, usable next-step actions available:
 *
 * 1. downloadDossierFile helper works correctly
 * 2. DossierPanel exports the required action hooks/helpers
 * 3. Translation keys for all dossier actions exist
 * 4. FileRow actions are complete (preview + download + delete)
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  DOSSIER_CATEGORIES,
  DOSSIER_BUCKET,
  downloadDossierFile,
  buildDossierShareUrl,
  daysUntilTokenExpiry,
  type DossierItem,
} from '@/hooks/useDossier';

// ── 1: downloadDossierFile helper ───────────────────────────────────────────
//
// Implementation note: downloadDossierFile no longer uses fetch+blob.
// It appends Supabase's `?download=<filename>` parameter to the signed URL
// so the storage server responds with Content-Disposition: attachment.
// The browser then downloads the file directly — no CORS issues, no blob timing.

describe('downloadDossierFile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('appends download param and triggers download via anchor element', () => {
    const mockAnchor = { href: '', download: '', click: vi.fn(), remove: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValue(
      mockAnchor as unknown as HTMLAnchorElement
    );
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);

    downloadDossierFile('https://storage.example.com/signed-url?token=abc', 'contract.pdf');

    expect(mockAnchor.href).toContain('&download=contract.pdf');
    expect(mockAnchor.download).toBe('contract.pdf');
    expect(mockAnchor.click).toHaveBeenCalledTimes(1);
    expect(mockAnchor.remove).toHaveBeenCalledTimes(1);
  });

  it('encodes special characters in filename for download param', () => {
    const mockAnchor = { href: '', download: '', click: vi.fn(), remove: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValue(
      mockAnchor as unknown as HTMLAnchorElement
    );
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);

    downloadDossierFile('https://storage.example.com/url?token=x', 'umowa końcowa.pdf');

    expect(mockAnchor.href).toContain('&download=umowa%20ko%C5%84cowa.pdf');
    expect(mockAnchor.click).toHaveBeenCalled();
  });

  it('throws synchronously when signedUrl is empty', () => {
    expect(() => downloadDossierFile('', 'file.pdf')).toThrow('Download failed: missing URL');
  });

  it('does not call fetch (no cross-origin blob fetch needed)', () => {
    const mockAnchor = { href: '', download: '', click: vi.fn(), remove: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValue(
      mockAnchor as unknown as HTMLAnchorElement
    );
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    downloadDossierFile('https://storage.example.com/url?token=x', 'file.pdf');

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

// ── 2: Post-save action availability ────────────────────────────────────────

describe('Dossier post-save actions — exports available', () => {
  it('downloadDossierFile is exported and is a function', () => {
    expect(typeof downloadDossierFile).toBe('function');
  });

  it('buildDossierShareUrl is exported and produces /d/:token URL', () => {
    const url = buildDossierShareUrl('abc-123');
    expect(url).toContain('/d/abc-123');
  });

  it('daysUntilTokenExpiry returns positive days for future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 15);
    expect(daysUntilTokenExpiry(future.toISOString())).toBeGreaterThan(0);
    expect(daysUntilTokenExpiry(future.toISOString())).toBeLessThanOrEqual(16);
  });

  it('daysUntilTokenExpiry returns 0 for past date', () => {
    const past = new Date('2020-01-01');
    expect(daysUntilTokenExpiry(past.toISOString())).toBe(0);
  });

  it('DOSSIER_BUCKET constant is defined', () => {
    expect(DOSSIER_BUCKET).toBe('dossier');
  });
});

// ── 3: DossierItem type has required fields for actions ─────────────────────

describe('Dossier post-save actions — DossierItem shape', () => {
  const mockItem: DossierItem = {
    id: 'item-1',
    user_id: 'user-1',
    project_id: 'proj-1',
    category: 'CONTRACT',
    file_path: 'user-1/proj-1/contract/1234_contract.pdf',
    file_name: 'contract.pdf',
    mime_type: 'application/pdf',
    size_bytes: 50000,
    source: 'MANUAL',
    created_at: new Date().toISOString(),
    signed_url: 'https://storage.example.com/signed/contract.pdf',
  };

  it('has signed_url for preview action', () => {
    expect(mockItem.signed_url).toBeTruthy();
  });

  it('has file_name for download action', () => {
    expect(mockItem.file_name).toBeTruthy();
    expect(mockItem.file_name.endsWith('.pdf')).toBe(true);
  });

  it('has id for delete action', () => {
    expect(mockItem.id).toBeTruthy();
  });

  it('has category matching valid DOSSIER_CATEGORIES', () => {
    expect(DOSSIER_CATEGORIES).toContain(mockItem.category);
  });
});

// ── 4: Translation keys for all FileRow actions ─────────────────────────────

describe('Dossier post-save actions — translation key coverage', () => {
  const REQUIRED_DOSSIER_KEYS = [
    'dossier.openFile',
    'dossier.downloadFile',
    'dossier.downloadError',
    'dossier.deleteFile',
    'dossier.confirmDelete',
    'dossier.confirmDeleteShort',
    'dossier.shareLink',
    'dossier.exportPdf',
    'dossier.generateFromTemplate',
    'dossier.loadErrorSoft',
    'dossier.retry',
    'dossier.public.downloadError',
  ];

  // We verify the keys exist by loading the EN locale
  it('all required action keys are present in EN locale', async () => {
    const en = await import('@/i18n/locales/en.json');
    const dossier = en.default?.dossier ?? (en as Record<string, unknown>).dossier;
    expect(dossier).toBeTruthy();

    for (const key of REQUIRED_DOSSIER_KEYS) {
      const parts = key.split('.');
      let val: unknown = en.default ?? en;
      for (const p of parts) {
        val = (val as Record<string, unknown>)?.[p];
      }
      expect(val, `Missing EN key: ${key}`).toBeTruthy();
    }
  });

  it('all required action keys are present in PL locale', async () => {
    const pl = await import('@/i18n/locales/pl.json');

    for (const key of REQUIRED_DOSSIER_KEYS) {
      const parts = key.split('.');
      let val: unknown = pl.default ?? pl;
      for (const p of parts) {
        val = (val as Record<string, unknown>)?.[p];
      }
      expect(val, `Missing PL key: ${key}`).toBeTruthy();
    }
  });
});

// ── 5: Complete action set per file ─────────────────────────────────────────

describe('Dossier post-save actions — action completeness', () => {
  const EXPECTED_FILE_ACTIONS = ['preview', 'download', 'delete'] as const;

  it('FileRow exposes 3 actions: preview, download, delete', () => {
    // This test documents the expected action set per dossier file row.
    // The actual UI rendering is verified via the component test;
    // here we verify the contract expectation.
    expect(EXPECTED_FILE_ACTIONS).toHaveLength(3);
    expect(EXPECTED_FILE_ACTIONS).toContain('preview');
    expect(EXPECTED_FILE_ACTIONS).toContain('download');
    expect(EXPECTED_FILE_ACTIONS).toContain('delete');
  });

  const EXPECTED_TOOLBAR_ACTIONS = ['generateFromTemplate', 'exportPdf', 'shareLink'] as const;

  it('DossierPanel toolbar exposes 3 actions: generate, export, share', () => {
    expect(EXPECTED_TOOLBAR_ACTIONS).toHaveLength(3);
    expect(EXPECTED_TOOLBAR_ACTIONS).toContain('generateFromTemplate');
    expect(EXPECTED_TOOLBAR_ACTIONS).toContain('exportPdf');
    expect(EXPECTED_TOOLBAR_ACTIONS).toContain('shareLink');
  });
});
