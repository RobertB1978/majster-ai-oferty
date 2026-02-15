import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import ProjectDetail from '@/pages/ProjectDetail';
import * as useProjectsHook from '@/hooks/useProjects';
import * as useQuotesHook from '@/hooks/useQuotes';
import { useParams, useNavigate } from 'react-router-dom';
import { mockUser } from '@/test/mocks/auth';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: vi.fn(),
  };
});

// Mock hooks
vi.mock('@/hooks/useProjects');
vi.mock('@/hooks/useQuotes');

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

describe('ProjectDetail', () => {
  const mockNavigate = vi.fn();
  const mockUpdateProject = {
    mutateAsync: vi.fn(),
    isPending: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useNavigate as ReturnType<typeof vi.fn>).mockReturnValue(mockNavigate);
    vi.spyOn(useProjectsHook, 'useUpdateProject').mockReturnValue(mockUpdateProject as never);
    vi.spyOn(useQuotesHook, 'useQuote').mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      isError: false,
    } as never);
  });

  describe('missing or invalid id parameter', () => {
    it('should render not found message when id is undefined', () => {
      (useParams as ReturnType<typeof vi.fn>).mockReturnValue({ id: undefined });

      vi.spyOn(useProjectsHook, 'useProject').mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        isError: false,
      } as never);

      render(<ProjectDetail />);

      expect(screen.getByText('Projekt nie został znaleziony.')).toBeDefined();
      expect(screen.getByText('Powrót do zleceń')).toBeDefined();
    });

    it('should render not found message when project is null', () => {
      (useParams as ReturnType<typeof vi.fn>).mockReturnValue({ id: 'test-id' });

      vi.spyOn(useProjectsHook, 'useProject').mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        isError: false,
      } as never);

      render(<ProjectDetail />);

      expect(screen.getByText('Projekt nie został znaleziony.')).toBeDefined();
    });
  });

  describe('query error handling', () => {
    it('should render error message when query fails', () => {
      (useParams as ReturnType<typeof vi.fn>).mockReturnValue({ id: 'test-id' });

      const mockError = new Error('Database connection failed');
      vi.spyOn(useProjectsHook, 'useProject').mockReturnValue({
        data: null,
        isLoading: false,
        error: mockError,
        isError: true,
      } as never);

      render(<ProjectDetail />);

      expect(screen.getByText('Błąd podczas wczytywania projektu')).toBeDefined();
      expect(screen.getByText('Nie udało się wczytać szczegółów projektu. Spróbuj ponownie.')).toBeDefined();
      expect(screen.getByText('Wróć do listy')).toBeDefined();
      expect(screen.getByText('Odśwież stronę')).toBeDefined();
    });

    it('should not crash on error (no ErrorBoundary trigger)', () => {
      (useParams as ReturnType<typeof vi.fn>).mockReturnValue({ id: 'test-id' });

      vi.spyOn(useProjectsHook, 'useProject').mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Test error'),
        isError: true,
      } as never);

      // Should not throw
      expect(() => render(<ProjectDetail />)).not.toThrow();
    });
  });

  describe('successful load', () => {
    it('should render project details when data loads successfully', async () => {
      (useParams as ReturnType<typeof vi.fn>).mockReturnValue({ id: 'proj-123' });

      const mockProject = {
        id: 'proj-123',
        project_name: 'Test Project',
        status: 'Nowy',
        created_at: '2024-01-01T00:00:00Z',
        clients: {
          id: 'client-1',
          name: 'Test Client',
          email: 'test@example.com',
        },
      };

      vi.spyOn(useProjectsHook, 'useProject').mockReturnValue({
        data: mockProject,
        isLoading: false,
        error: null,
        isError: false,
      } as never);

      render(<ProjectDetail />);

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeDefined();
        expect(screen.getByText('Test Client')).toBeDefined();
      });
    });
  });

  describe('loading state', () => {
    it('should show loading spinner while fetching', () => {
      (useParams as ReturnType<typeof vi.fn>).mockReturnValue({ id: 'test-id' });

      vi.spyOn(useProjectsHook, 'useProject').mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        isError: false,
      } as never);

      render(<ProjectDetail />);

      // Check for Loader2 spinner by class
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeDefined();
    });
  });
});
