/**
 * DossierPublicPage — PublicFileActions regression test
 *
 * Verifies that the public dossier page renders actions correctly and
 * handles download errors with visible feedback instead of silent failure.
 *
 * Coverage:
 * 1. Preview (Open) renders as <a> with visible text label
 * 2. Download renders as <button> with visible text label for non-images
 * 3. Images do NOT show a download button (read-only view)
 * 4. Download error shows inline "Błąd pobierania" feedback (no silent failure)
 * 5. Delete action is absent on the public page (read-only safety)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

// ── Mocks ────────────────────────────────────────────────────────────────────

const MOCK_DOSSIER_DATA = {
  project_title: 'Remont kuchni',
  project_status: 'active',
  allowed_categories: ['CONTRACT', 'PHOTO'],
  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  items: [
    {
      id: 'item-pdf',
      category: 'CONTRACT',
      file_path: 'u1/p1/contract/umowa.pdf',
      file_name: 'Umowa.pdf',
      mime_type: 'application/pdf',
      size_bytes: 45000,
      created_at: '2026-01-15T10:00:00Z',
    },
    {
      id: 'item-img',
      category: 'PHOTO',
      file_path: 'u1/p1/photo/foto.jpg',
      file_name: 'Zdjecie.jpg',
      mime_type: 'image/jpeg',
      size_bytes: 120000,
      created_at: '2026-01-16T10:00:00Z',
    },
  ],
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({
      data: MOCK_DOSSIER_DATA,
      error: null,
    }),
    storage: {
      from: () => ({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: 'https://storage.example.com/signed/file' },
          error: null,
        }),
      }),
    },
  },
}));

vi.mock('@/hooks/useDossier', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useDossier')>();
  return {
    ...actual,
    downloadDossierFile: vi.fn().mockResolvedValue(undefined),
  };
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderPublicPage(token = 'test-token-abc') {
  return render(
    <MemoryRouter initialEntries={[`/d/${token}`]}>
      <Routes>
        <Route
          path="/d/:token"
          element={
            <I18nextProvider i18n={i18n}>
              <PublicPageWrapper />
            </I18nextProvider>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

// Lazy-loaded to avoid top-level import that fires side effects before mocks are set
let DossierPublicPage: React.ComponentType;
async function loadPage() {
  if (!DossierPublicPage) {
    const mod = await import('@/pages/DossierPublicPage');
    DossierPublicPage = mod.default;
  }
}

function PublicPageWrapper() {
  if (!DossierPublicPage) return null;
  return <DossierPublicPage />;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('DossierPublicPage — PublicFileActions', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await loadPage();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows project title after loading', async () => {
    renderPublicPage();
    await waitFor(() => {
      expect(screen.getByText('Remont kuchni')).toBeInTheDocument();
    });
  });

  it('renders Open (preview) button with visible text for PDF file', async () => {
    renderPublicPage();
    await waitFor(() => {
      // Should have at least one "Open" label
      const openLinks = screen.getAllByText(i18n.t('dossier.public.open'));
      expect(openLinks.length).toBeGreaterThan(0);
      // Preview is an anchor tag — navigates to file
      expect(openLinks[0].closest('a')).not.toBeNull();
    });
  });

  it('renders Download button with visible text for non-image file', async () => {
    renderPublicPage();
    await waitFor(() => {
      const downloadBtn = screen.getByText(i18n.t('dossier.public.download'));
      expect(downloadBtn).toBeInTheDocument();
      // Download is a button, not an anchor
      expect(downloadBtn.closest('button')).not.toBeNull();
    });
  });

  it('does NOT render Download button for image files', async () => {
    renderPublicPage();
    await waitFor(() => {
      // PDF has download, image does not — so there should be exactly ONE download button
      const downloadBtns = screen.queryAllByText(i18n.t('dossier.public.download'));
      // One for PDF, zero for image
      expect(downloadBtns).toHaveLength(1);
    });
  });

  it('does NOT render a Delete button on the public page', async () => {
    renderPublicPage();
    await waitFor(() => {
      expect(screen.queryByLabelText(i18n.t('dossier.deleteFile'))).toBeNull();
    });
  });

  it('shows inline download error feedback on failure instead of silent failure', async () => {
    const { downloadDossierFile } = await import('@/hooks/useDossier');
    vi.mocked(downloadDossierFile).mockRejectedValueOnce(new Error('Download failed'));

    const user = userEvent.setup();
    renderPublicPage();

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText('Remont kuchni')).toBeInTheDocument();
    });

    // Click the Download button for the PDF
    const downloadBtn = screen.getByText(i18n.t('dossier.public.download'));
    await user.click(downloadBtn);

    // Error feedback must appear (no silent failure)
    await waitFor(() => {
      expect(screen.getByText(i18n.t('dossier.public.downloadError'))).toBeInTheDocument();
    });
  });

  it('preview and download are semantically distinct (link vs button)', async () => {
    renderPublicPage();
    await waitFor(() => {
      const openEl = screen.getAllByText(i18n.t('dossier.public.open'))[0];
      const downloadEl = screen.getByText(i18n.t('dossier.public.download'));

      // Preview = anchor, navigates in new tab
      expect(openEl.closest('a')).not.toBeNull();
      expect(openEl.closest('button')).toBeNull();

      // Download = button, triggers fetch-based download
      expect(downloadEl.closest('button')).not.toBeNull();
      expect(downloadEl.closest('a')).toBeNull();
    });
  });

  it('shows error page (not crash) when RPC returns null data', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: null,
    } as ReturnType<typeof supabase.rpc> extends Promise<infer R> ? R : never);

    renderPublicPage('null-token');
    await waitFor(() => {
      expect(screen.getByText(i18n.t('dossier.public.notFoundTitle'))).toBeInTheDocument();
    });
  });

  it('shows error page when RPC returns server error', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { message: 'function not found', details: '', hint: '', code: '404' },
    } as ReturnType<typeof supabase.rpc> extends Promise<infer R> ? R : never);

    renderPublicPage('error-token');
    await waitFor(() => {
      expect(screen.getByText(i18n.t('dossier.public.notFoundTitle'))).toBeInTheDocument();
    });
  });
});
