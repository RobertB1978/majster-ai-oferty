/**
 * DossierPanel — FileRow action buttons RTL test
 *
 * Verifies that each file in the dossier renders all 3 action buttons:
 * 1. Preview (open in new tab)
 * 2. Download (save to device)
 * 3. Delete (with confirmation)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

import type { DossierItem } from '@/hooks/useDossier';
import { DossierPanel } from '@/components/documents/DossierPanel';

// ── Mocks ────────────────────────────────────────────────────────────────────

const MOCK_ITEMS: DossierItem[] = [
  {
    id: 'item-1',
    user_id: 'u1',
    project_id: 'p1',
    category: 'CONTRACT',
    file_path: 'u1/p1/contract/test.pdf',
    file_name: 'Umowa_serwisowa.pdf',
    mime_type: 'application/pdf',
    size_bytes: 12345,
    source: 'MANUAL',
    created_at: '2026-01-15T10:00:00Z',
    signed_url: 'https://storage.example.com/signed/test.pdf',
  },
];

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    }),
    storage: {
      from: () => ({
        createSignedUrl: () =>
          Promise.resolve({ data: { signedUrl: 'https://example.com/signed' }, error: null }),
      }),
    },
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'test@test.com' } }),
}));

// Mock useDossier to return our test items directly
vi.mock('@/hooks/useDossier', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useDossier')>();
  return {
    ...actual,
    useDossierItems: () => ({
      data: MOCK_ITEMS,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    }),
    useUploadDossierItem: () => ({ mutateAsync: vi.fn() }),
    useDeleteDossierItem: () => ({ mutateAsync: vi.fn() }),
    useExportDossierPdf: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

// ── Test setup ───────────────────────────────────────────────────────────────

function renderPanel() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <DossierPanel projectId="p1" projectTitle="Test Project" />
        </I18nextProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('DossierPanel — FileRow action buttons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders toolbar with 3 action buttons: template, export, share', () => {
    renderPanel();

    // Toolbar buttons (visible without expanding categories)
    expect(screen.getByText(i18n.t('dossier.generateFromTemplate'))).toBeInTheDocument();
    expect(screen.getByText(i18n.t('dossier.exportPdf'))).toBeInTheDocument();
    expect(screen.getByText(i18n.t('dossier.shareLink'))).toBeInTheDocument();
  });

  it('shows category card with file count badge', () => {
    renderPanel();

    // CONTRACT category should show badge with "1"
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders preview, download, and delete buttons for file when category expanded', async () => {
    const user = userEvent.setup();
    renderPanel();

    // Expand CONTRACT category by clicking on it
    const contractCard = screen.getByRole('button', {
      name: i18n.t('dossier.category.CONTRACT'),
    });
    await user.click(contractCard);

    // File name should be visible
    expect(screen.getByText('Umowa_serwisowa.pdf')).toBeInTheDocument();

    // Preview link (Eye icon, opens in new tab)
    const previewLink = screen.getByLabelText(i18n.t('dossier.openFile'));
    expect(previewLink).toBeInTheDocument();
    expect(previewLink.tagName).toBe('A');
    expect(previewLink).toHaveAttribute('href', 'https://storage.example.com/signed/test.pdf');
    expect(previewLink).toHaveAttribute('target', '_blank');
    // title attribute provides tooltip — disambiguates preview from download
    expect(previewLink).toHaveAttribute('title', i18n.t('dossier.openFile'));

    // Download button
    const downloadBtn = screen.getByLabelText(i18n.t('dossier.downloadFile'));
    expect(downloadBtn).toBeInTheDocument();
    expect(downloadBtn.tagName).toBe('BUTTON');
    // title attribute provides tooltip — ensures download action is explicit
    expect(downloadBtn).toHaveAttribute('title', i18n.t('dossier.downloadFile'));

    // Delete button
    const deleteBtn = screen.getByLabelText(i18n.t('dossier.deleteFile'));
    expect(deleteBtn).toBeInTheDocument();
    expect(deleteBtn.tagName).toBe('BUTTON');
    // title attribute provides tooltip — ensures delete intent is clear
    expect(deleteBtn).toHaveAttribute('title', i18n.t('dossier.deleteFile'));
  });

  it('file action buttons meet 44px touch target requirement (min-h-[44px] min-w-[44px])', async () => {
    const user = userEvent.setup();
    renderPanel();

    const contractCard = screen.getByRole('button', {
      name: i18n.t('dossier.category.CONTRACT'),
    });
    await user.click(contractCard);

    const previewLink = screen.getByLabelText(i18n.t('dossier.openFile'));
    expect(previewLink.className).toContain('min-h-[44px]');
    expect(previewLink.className).toContain('min-w-[44px]');

    const downloadBtn = screen.getByLabelText(i18n.t('dossier.downloadFile'));
    expect(downloadBtn.className).toContain('min-h-[44px]');
    expect(downloadBtn.className).toContain('min-w-[44px]');

    const deleteBtn = screen.getByLabelText(i18n.t('dossier.deleteFile'));
    expect(deleteBtn.className).toContain('min-h-[44px]');
    expect(deleteBtn.className).toContain('min-w-[44px]');
  });

  it('delete requires two clicks (confirmation pattern)', async () => {
    const user = userEvent.setup();
    renderPanel();

    // Expand category
    const contractCard = screen.getByRole('button', {
      name: i18n.t('dossier.category.CONTRACT'),
    });
    await user.click(contractCard);

    // First click — enters confirmation state
    const deleteBtn = screen.getByLabelText(i18n.t('dossier.deleteFile'));
    await user.click(deleteBtn);

    // Now the button should have confirmation label and title (both must update)
    const confirmBtn = screen.getByLabelText(i18n.t('dossier.confirmDelete'));
    expect(confirmBtn).toBeInTheDocument();
    expect(confirmBtn).toHaveAttribute('title', i18n.t('dossier.confirmDelete'));

    // Confirmation state must show visible text (not just icon) so user knows to click again
    expect(screen.getByText(i18n.t('dossier.confirmDeleteShort'))).toBeInTheDocument();
  });

  it('preview and download actions are distinct — different aria-labels and different targets', async () => {
    const user = userEvent.setup();
    renderPanel();

    const contractCard = screen.getByRole('button', {
      name: i18n.t('dossier.category.CONTRACT'),
    });
    await user.click(contractCard);

    const previewLink = screen.getByLabelText(i18n.t('dossier.openFile'));
    const downloadBtn = screen.getByLabelText(i18n.t('dossier.downloadFile'));

    // They must be different elements
    expect(previewLink).not.toBe(downloadBtn);

    // Preview is an anchor — navigates in new tab (not a button)
    expect(previewLink.tagName).toBe('A');
    // Download is a button — triggers fetch-based download (not a link)
    expect(downloadBtn.tagName).toBe('BUTTON');

    // Their aria-labels must be different
    expect(previewLink.getAttribute('aria-label')).not.toBe(
      downloadBtn.getAttribute('aria-label')
    );
  });
});
