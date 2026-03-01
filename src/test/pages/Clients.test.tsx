import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@/test/utils';
import Clients from '@/pages/Clients';
import * as useClientsHook from '@/hooks/useClients';
import { useSearchParams } from 'react-router-dom';
import { mockUser } from '@/test/mocks/auth';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useSearchParams: vi.fn(),
  };
});

// Mock hooks
vi.mock('@/hooks/useClients');
vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  }),
}));

describe('Clients', () => {
  const mockSetSearchParams = vi.fn();
  const mockAddClient = {
    mutateAsync: vi.fn(),
    isPending: false,
  };
  const mockUpdateClient = {
    mutateAsync: vi.fn(),
    isPending: false,
  };
  const mockDeleteClient = {
    mutateAsync: vi.fn(),
    isPending: false,
  };

  const mockClientsData = {
    data: [
      {
        id: 'client-1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+48 123 456 789',
        address: 'ul. Testowa 1, Warszawa',
      },
      {
        id: 'client-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+48 987 654 321',
        address: 'ul. Próbna 2, Kraków',
      },
    ],
    totalPages: 1,
    totalCount: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useSearchParams
    const mockSearchParams = new URLSearchParams();
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue([
      mockSearchParams,
      mockSetSearchParams,
    ]);

    // Mock client hooks
    vi.spyOn(useClientsHook, 'useClientsPaginated').mockReturnValue({
      data: mockClientsData,
      isLoading: false,
      error: null,
      isError: false,
    } as never);

    vi.spyOn(useClientsHook, 'useAddClient').mockReturnValue(mockAddClient as never);
    vi.spyOn(useClientsHook, 'useUpdateClient').mockReturnValue(mockUpdateClient as never);
    vi.spyOn(useClientsHook, 'useDeleteClient').mockReturnValue(mockDeleteClient as never);
  });

  describe('page rendering', () => {
    it('should render Clients page without errors', () => {
      render(<Clients />);

      expect(screen.getByText(/klienci/i)).toBeDefined();
    });

    it('should render client list when data is available', () => {
      render(<Clients />);

      expect(screen.getByText('John Doe')).toBeDefined();
      expect(screen.getByText('Jane Smith')).toBeDefined();
      expect(screen.getByText('john@example.com')).toBeDefined();
    });

    it('should show loading state while fetching clients', () => {
      vi.spyOn(useClientsHook, 'useClientsPaginated').mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        isError: false,
      } as never);

      render(<Clients />);

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeDefined();
    });

    it('should show empty state when no clients exist', () => {
      vi.spyOn(useClientsHook, 'useClientsPaginated').mockReturnValue({
        data: { data: [], totalPages: 0, totalCount: 0 },
        isLoading: false,
        error: null,
        isError: false,
      } as never);

      render(<Clients />);

      expect(screen.getByText(/brak klientów/i)).toBeDefined();
    });
  });

  describe('Add Client button and modal', () => {
    it('should have "Add Client" button on the page', () => {
      render(<Clients />);

      const addButton = screen.getAllByText(/dodaj klienta/i)[0];
      expect(addButton).toBeDefined();
    });

    it('should open modal when "Add Client" button is clicked', async () => {
      render(<Clients />);

      const addButton = screen.getAllByText(/dodaj klienta/i)[0];
      fireEvent.click(addButton);

      await waitFor(() => {
        // Modal should show "Nowy klient" title
        expect(screen.getByText(/nowy klient/i)).toBeDefined();
      });
    });

    it('should have form fields in the modal', async () => {
      render(<Clients />);

      const addButton = screen.getAllByText(/dodaj klienta/i)[0];
      fireEvent.click(addButton);

      await waitFor(() => {
        // Check that modal opened
        expect(screen.getByText(/nowy klient/i)).toBeDefined();
      });

      // Check for form fields by ID (more reliable than label text)
      expect(document.getElementById('name')).toBeDefined();
      expect(document.getElementById('phone')).toBeDefined();
      expect(document.getElementById('email')).toBeDefined();
      expect(document.getElementById('address')).toBeDefined();
    });
  });

  describe('auto-open modal on ?new=1 param', () => {
    it('should auto-open modal when ?new=1 param is present', async () => {
      const mockSearchParams = new URLSearchParams('new=1');
      (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue([
        mockSearchParams,
        mockSetSearchParams,
      ]);

      render(<Clients />);

      await waitFor(() => {
        // Modal should be open (check for modal title)
        expect(screen.getByText(/nowy klient/i)).toBeDefined();
      });

      // Should clean up URL by removing the param
      expect(mockSetSearchParams).toHaveBeenCalledWith({}, { replace: true });
    });

    it('should NOT auto-open modal when no ?new param is present', () => {
      const mockSearchParams = new URLSearchParams();
      (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue([
        mockSearchParams,
        mockSetSearchParams,
      ]);

      render(<Clients />);

      // Modal title should not be present (modal is closed)
      expect(screen.queryByText(/nowy klient/i)).toBeNull();
      expect(mockSetSearchParams).not.toHaveBeenCalled();
    });

    it('should NOT auto-open modal when ?new has different value', () => {
      const mockSearchParams = new URLSearchParams('new=0');
      (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue([
        mockSearchParams,
        mockSetSearchParams,
      ]);

      render(<Clients />);

      expect(screen.queryByText(/nowy klient/i)).toBeNull();
      expect(mockSetSearchParams).not.toHaveBeenCalled();
    });
  });

  describe('create client flow', () => {
    it('should call addClient mutation when form is submitted', async () => {
      mockAddClient.mutateAsync.mockResolvedValue({ id: 'new-client-id' });

      render(<Clients />);

      // Open modal
      const addButton = screen.getAllByText(/dodaj klienta/i)[0];
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/nazwa/i)).toBeDefined();
      });

      // Fill form
      const nameInput = screen.getByLabelText(/nazwa/i);
      fireEvent.change(nameInput, { target: { value: 'New Client' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /dodaj klienta/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAddClient.mutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'New Client',
            type: 'person',
          })
        );
      });
    });

    it('should show validation error when name is empty', async () => {
      render(<Clients />);

      // Open modal
      const addButton = screen.getAllByText(/dodaj klienta/i)[0];
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/nowy klient/i)).toBeDefined();
      });

      // Submit without filling name
      const submitButton = screen.getByRole('button', { name: /dodaj klienta/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Should show validation error (inline error or toast)
        expect(screen.getByText(/nazwa klienta jest wymagana/i)).toBeDefined();
      });

      expect(mockAddClient.mutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('edit and delete clients', () => {
    it('should open edit modal when edit button is clicked', async () => {
      render(<Clients />);

      // Find and click edit button (Pencil icon)
      const editButtons = document.querySelectorAll('button');
      const editButton = Array.from(editButtons).find(btn =>
        btn.querySelector('svg')?.classList.contains('lucide-pencil') ||
        btn.innerHTML.includes('Pencil')
      );

      expect(editButton).toBeDefined();
      fireEvent.click(editButton!);

      await waitFor(() => {
        // Modal should show "Edytuj klienta" title
        expect(screen.getByText(/edytuj klienta/i)).toBeDefined();
        // Form should be pre-filled with client data
        expect((screen.getByLabelText(/nazwa/i) as HTMLInputElement).value).toBe('John Doe');
      });
    });

    it('should call deleteClient when delete is confirmed', async () => {
      // Mock window.confirm
      global.confirm = vi.fn(() => true);

      mockDeleteClient.mutateAsync.mockResolvedValue(undefined);

      render(<Clients />);

      // Find delete button by looking for the red/destructive text button in client cards
      const deleteButtons = document.querySelectorAll('button.text-destructive');
      expect(deleteButtons.length).toBeGreaterThan(0);

      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockDeleteClient.mutateAsync).toHaveBeenCalledWith('client-1');
      });
    });
  });
});
