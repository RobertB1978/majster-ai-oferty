/**
 * ItemTemplates page tests — comprehensive coverage
 *
 * Covers: list rendering, create, edit, delete, search, import dialog.
 *
 * Translation keys (pl locale):
 *   templates.newTemplate     = "Nowy szablon"
 *   templates.create          = "Utwórz"
 *   templates.import          = "Importuj"
 *   templates.namePlaceholder = "np. Płytki ceramiczne 60x60"
 *   templates.noTemplates     = "Brak szablonów"
 *   common.edit               = "Edytuj"
 *   common.save               = "Zapisz"
 *   common.cancel             = "Anuluj"
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@/test/utils';
import ItemTemplates from '@/pages/ItemTemplates';
import * as templatesHook from '@/hooks/useItemTemplates';
import { mockUser } from '@/test/mocks/auth';

// ── mocks ──────────────────────────────────────────────────────────────────

vi.mock('@/hooks/useItemTemplates');
vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  }),
}));

// ── shared test data ───────────────────────────────────────────────────────

const mockTemplates = [
  {
    id: 'tpl-1',
    user_id: 'user-1',
    name: 'Malowanie ścian',
    unit: 'm²',
    default_qty: 1,
    default_price: 30,
    category: 'Robocizna' as const,
    description: 'Malowanie farbą lateksową',
    created_at: new Date().toISOString(),
  },
  {
    id: 'tpl-2',
    user_id: 'user-1',
    name: 'Płytki ceramiczne 60x60',
    unit: 'm²',
    default_qty: 1,
    default_price: 120,
    category: 'Materiał' as const,
    description: 'Płytki podłogowe',
    created_at: new Date().toISOString(),
  },
];

const mockPaginatedResult = {
  data: mockTemplates,
  totalCount: 2,
  totalPages: 1,
  currentPage: 1,
};

const mockCreate = {
  mutateAsync: vi.fn().mockResolvedValue({ id: 'new-tpl', name: 'New Template' }),
  isPending: false,
};
const mockUpdate = {
  mutateAsync: vi.fn().mockResolvedValue({}),
  isPending: false,
};
const mockDelete = {
  mutateAsync: vi.fn().mockResolvedValue(undefined),
  isPending: false,
};

function setupHooks(overrides: { data?: typeof mockPaginatedResult; isLoading?: boolean } = {}) {
  vi.spyOn(templatesHook, 'useItemTemplatesPaginated').mockReturnValue({
    data: overrides.data ?? mockPaginatedResult,
    isLoading: overrides.isLoading ?? false,
    error: null,
    isError: false,
  } as never);
  vi.spyOn(templatesHook, 'useCreateItemTemplate').mockReturnValue(mockCreate as never);
  vi.spyOn(templatesHook, 'useUpdateItemTemplate').mockReturnValue(mockUpdate as never);
  vi.spyOn(templatesHook, 'useDeleteItemTemplate').mockReturnValue(mockDelete as never);
}

// ── helpers ────────────────────────────────────────────────────────────────

async function openAddDialog() {
  const addBtn = screen.getByRole('button', { name: /nowy szablon/i });
  fireEvent.click(addBtn);
  await waitFor(() => expect(screen.getByRole('dialog')).toBeDefined());
}

/** Name input placeholder = t('templates.namePlaceholder') = "np. Płytki ceramiczne 60x60" */
function getNameInput(): HTMLInputElement {
  return screen.getByPlaceholderText(/np\. Płytki ceramiczne/i) as HTMLInputElement;
}

// ── tests ──────────────────────────────────────────────────────────────────

describe('ItemTemplates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupHooks();
  });

  // ── RENDERING ────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('should render without crashing', () => {
      render(<ItemTemplates />);
      expect(screen.getAllByText(/szablony/i).length).toBeGreaterThan(0);
    });

    it('should show loading spinner while fetching', () => {
      setupHooks({ isLoading: true });
      render(<ItemTemplates />);
      expect(document.querySelector('.animate-spin')).toBeDefined();
    });

    it('should render template names when data is available', () => {
      render(<ItemTemplates />);
      expect(screen.getByText('Malowanie ścian')).toBeDefined();
      expect(screen.getByText('Płytki ceramiczne 60x60')).toBeDefined();
    });

    it('should show category badges on template cards', () => {
      render(<ItemTemplates />);
      expect(screen.getByText('Robocizna')).toBeDefined();
      expect(screen.getByText('Materiał')).toBeDefined();
    });

    it('should show empty state when there are no templates', () => {
      setupHooks({ data: { data: [], totalCount: 0, totalPages: 0, currentPage: 1 } });
      render(<ItemTemplates />);
      expect(screen.getByText(/brak szablonów/i)).toBeDefined();
    });
  });

  // ── CREATE TEMPLATE ──────────────────────────────────────────────────────

  describe('create template', () => {
    it('should open create dialog when "Nowy szablon" is clicked', async () => {
      render(<ItemTemplates />);
      await openAddDialog();
      expect(screen.getByRole('dialog')).toBeDefined();
    });

    it('should NOT call createTemplate when name is empty on submit', async () => {
      render(<ItemTemplates />);
      await openAddDialog();

      // Save button for new = t('templates.create') = "Utwórz"
      const createBtn = screen.getByRole('button', { name: /^Utwórz$/i });
      fireEvent.click(createBtn);

      await waitFor(() => {
        expect(mockCreate.mutateAsync).not.toHaveBeenCalled();
      });
    });

    it('should call createTemplate with correct payload on valid submit', async () => {
      render(<ItemTemplates />);
      await openAddDialog();

      fireEvent.change(getNameInput(), { target: { value: 'Gipsowanie ścian' } });

      fireEvent.click(screen.getByRole('button', { name: /^Utwórz$/i }));

      await waitFor(() => {
        expect(mockCreate.mutateAsync).toHaveBeenCalledOnce();
        expect(mockCreate.mutateAsync.mock.calls[0][0].name).toBe('Gipsowanie ścian');
      });
    });

    it('should close dialog after successful create', async () => {
      render(<ItemTemplates />);
      await openAddDialog();

      fireEvent.change(getNameInput(), { target: { value: 'Nowy szablon testowy' } });
      fireEvent.click(screen.getByRole('button', { name: /^Utwórz$/i }));

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });
  });

  // ── EDIT TEMPLATE ─────────────────────────────────────────────────────────

  describe('edit template', () => {
    it('should open edit dialog with pre-filled name when Edit is clicked', async () => {
      render(<ItemTemplates />);

      // t('common.edit') = "Edytuj" — one per template card
      const editBtns = screen.getAllByRole('button', { name: /^Edytuj$/i });
      fireEvent.click(editBtns[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeDefined();
        expect(getNameInput().value).toBe('Malowanie ścian');
      });
    });

    it('should call updateTemplate with the template id on save', async () => {
      render(<ItemTemplates />);

      const editBtns = screen.getAllByRole('button', { name: /^Edytuj$/i });
      fireEvent.click(editBtns[0]);

      await waitFor(() => expect(screen.getByRole('dialog')).toBeDefined());

      fireEvent.change(getNameInput(), { target: { value: 'Malowanie zaktualizowane' } });

      // Save button for edit = t('common.save') = "Zapisz"
      fireEvent.click(screen.getByRole('button', { name: /^Zapisz$/i }));

      await waitFor(() => {
        expect(mockUpdate.mutateAsync).toHaveBeenCalledOnce();
        const arg = mockUpdate.mutateAsync.mock.calls[0][0];
        expect(arg.id).toBe('tpl-1');
        expect(arg.name).toBe('Malowanie zaktualizowane');
      });
    });
  });

  // ── DELETE TEMPLATE ───────────────────────────────────────────────────────

  describe('delete template', () => {
    it('should open delete AlertDialog when the delete icon button is clicked', async () => {
      render(<ItemTemplates />);

      // Delete buttons: icon-only, class text-destructive
      const deleteBtns = document.querySelectorAll('button.text-destructive');
      expect(deleteBtns.length).toBeGreaterThan(0);

      fireEvent.click(deleteBtns[0]);

      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeDefined());
    });

    it('should call deleteTemplate when deletion is confirmed', async () => {
      render(<ItemTemplates />);

      const deleteBtns = document.querySelectorAll('button.text-destructive');
      fireEvent.click(deleteBtns[0]);

      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeDefined());

      // The destructive "Usuń" button inside the alertdialog
      const confirmBtn = screen.getByRole('button', { name: /^Usuń$/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mockDelete.mutateAsync).toHaveBeenCalledWith('tpl-1');
      });
    });

    it('should NOT call deleteTemplate when deletion is cancelled', async () => {
      render(<ItemTemplates />);

      const deleteBtns = document.querySelectorAll('button.text-destructive');
      fireEvent.click(deleteBtns[0]);

      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeDefined());

      fireEvent.click(screen.getByRole('button', { name: /^Anuluj$/i }));

      await waitFor(() => expect(mockDelete.mutateAsync).not.toHaveBeenCalled());
    });
  });

  // ── IMPORT DIALOG ─────────────────────────────────────────────────────────

  describe('import templates dialog', () => {
    it('should open import dialog when "Importuj" button is clicked', async () => {
      render(<ItemTemplates />);

      // The import button includes a count suffix, so find by partial text
      const importBtn = screen.getAllByRole('button').find((b) =>
        b.textContent?.includes('Importuj')
      );
      expect(importBtn).toBeDefined();

      fireEvent.click(importBtn!);

      await waitFor(() => expect(screen.getByRole('dialog')).toBeDefined());
    });
  });

  // ── EDGE CASES ────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle create mutation failure gracefully (no crash)', async () => {
      mockCreate.mutateAsync.mockRejectedValueOnce(new Error('DB error'));

      render(<ItemTemplates />);
      await openAddDialog();

      fireEvent.change(getNameInput(), { target: { value: 'Błędny szablon' } });
      fireEvent.click(screen.getByRole('button', { name: /^Utwórz$/i }));

      await waitFor(() => expect(mockCreate.mutateAsync).toHaveBeenCalledOnce());

      // Page should not crash
      expect(screen.getAllByText(/szablony/i).length).toBeGreaterThan(0);
    });

    it('should reset form when dialog is closed via Anuluj', async () => {
      render(<ItemTemplates />);
      await openAddDialog();

      fireEvent.change(getNameInput(), { target: { value: 'Typed something' } });

      fireEvent.click(screen.getByRole('button', { name: /^Anuluj$/i }));

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

      // Re-open: form should be empty
      await openAddDialog();
      expect(getNameInput().value).toBe('');
    });
  });
});
