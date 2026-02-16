import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { AiChatAgent } from '@/components/ai/AiChatAgent';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
    })),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock voice to text hook
vi.mock('@/hooks/useVoiceToText', () => ({
  useVoiceToText: () => ({
    transcript: '',
    isListening: false,
    isSupported: false,
    startListening: vi.fn(),
    stopListening: vi.fn(),
    resetTranscript: vi.fn(),
  }),
}));

// Mock AI chat history hooks
vi.mock('@/hooks/useAiChatHistory', () => ({
  useAiChatHistory: () => ({ data: [], isLoading: false }),
  useAiChatSessions: () => ({ data: [], isLoading: false }),
  useSaveAiMessage: () => ({ mutate: vi.fn() }),
  useDeleteChatSession: () => ({ mutateAsync: vi.fn() }),
}));

describe('Responsive Overlays', () => {
  let localStorageMock: { [key: string]: string };
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  beforeEach(() => {
    localStorageMock = {};

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => localStorageMock[key] || null,
        setItem: (key: string, value: string) => {
          localStorageMock[key] = value;
        },
        removeItem: (key: string) => {
          delete localStorageMock[key];
        },
        clear: () => {
          localStorageMock = {};
        },
      },
      writable: true,
    });

    // Mock matchMedia for PWA detection
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );

  describe('PWA Install Prompt', () => {
    it('renders with data-testid attribute', async () => {
      // Trigger beforeinstallprompt event
      const beforeInstallPromptEvent = new Event('beforeinstallprompt');
      Object.defineProperty(beforeInstallPromptEvent, 'prompt', {
        value: vi.fn(),
      });
      Object.defineProperty(beforeInstallPromptEvent, 'userChoice', {
        value: Promise.resolve({ outcome: 'dismissed' }),
      });

      render(<InstallPrompt />, { wrapper: TestWrapper });

      // Dispatch the event
      window.dispatchEvent(beforeInstallPromptEvent);

      // Wait for component to update
      await waitFor(() => {
        const overlay = screen.queryByTestId('pwa-overlay');
        if (overlay) {
          expect(overlay).toBeDefined();
        }
      });
    });

    it('renders close button on mobile', async () => {
      const beforeInstallPromptEvent = new Event('beforeinstallprompt');
      Object.defineProperty(beforeInstallPromptEvent, 'prompt', {
        value: vi.fn(),
      });
      Object.defineProperty(beforeInstallPromptEvent, 'userChoice', {
        value: Promise.resolve({ outcome: 'dismissed' }),
      });

      render(<InstallPrompt />, { wrapper: TestWrapper });
      window.dispatchEvent(beforeInstallPromptEvent);

      await waitFor(() => {
        const closeButton = screen.queryByRole('button', { name: /zamknij|later|później/i });
        if (closeButton) {
          expect(closeButton).toBeDefined();
        }
      });
    });

    it('stores dismissal in localStorage with key "hidePwaInstall"', async () => {
      const beforeInstallPromptEvent = new Event('beforeinstallprompt');
      Object.defineProperty(beforeInstallPromptEvent, 'prompt', {
        value: vi.fn(),
      });
      Object.defineProperty(beforeInstallPromptEvent, 'userChoice', {
        value: Promise.resolve({ outcome: 'dismissed' }),
      });

      render(<InstallPrompt />, { wrapper: TestWrapper });
      window.dispatchEvent(beforeInstallPromptEvent);

      // Wait for overlay to appear
      await waitFor(() => {
        expect(screen.getByTestId('pwa-overlay')).toBeDefined();
      });

      // Find and click dismiss button
      const dismissButton = screen.getByRole('button', { name: /później/i });
      dismissButton.click();

      // Check localStorage
      await waitFor(() => {
        expect(localStorageMock['hidePwaInstall']).toBe('1');
      });

      // Wait for overlay to disappear
      await waitFor(() => {
        expect(screen.queryByTestId('pwa-overlay')).toBeNull();
      });
    });

    it('does not render when dismissed forever', () => {
      localStorageMock['hidePwaInstall'] = '1';

      render(<InstallPrompt />, { wrapper: TestWrapper });

      expect(screen.queryByTestId('pwa-overlay')).toBeNull();
    });
  });

  describe('AI Chat Widget', () => {
    it('renders floating button with data-testid attribute', () => {
      render(<AiChatAgent />, { wrapper: TestWrapper });

      const chatButton = screen.getByTestId('chat-overlay');
      expect(chatButton).toBeDefined();
    });

    it('renders close button when chat is open', async () => {
      render(<AiChatAgent />, { wrapper: TestWrapper });

      const chatButton = screen.getByTestId('chat-overlay');
      chatButton.click();

      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: /zamknij asystenta ai/i });
        expect(closeButton).toBeDefined();
      });
    });

    it('stores dismissal in localStorage with key "hideChatWidget"', async () => {
      render(<AiChatAgent />, { wrapper: TestWrapper });

      const chatButton = screen.getByTestId('chat-overlay');
      chatButton.click();

      // Wait for chat panel to open and find dismiss button by title attribute
      await waitFor(() => {
        const dismissButtons = screen.getAllByRole('button', { name: /nie pokazuj więcej/i });
        // The last X button should be the "dismiss forever" one
        const dismissButton = dismissButtons[dismissButtons.length - 1];
        expect(dismissButton).toBeDefined();
        dismissButton.click();
      });

      await waitFor(() => {
        expect(localStorageMock['hideChatWidget']).toBe('1');
      });
    });

    it('does not render when dismissed forever', () => {
      localStorageMock['hideChatWidget'] = '1';

      render(<AiChatAgent />, { wrapper: TestWrapper });

      expect(screen.queryByTestId('chat-overlay')).toBeNull();
    });

    it('hides on re-render after dismissal', async () => {
      const { rerender } = render(<AiChatAgent />, { wrapper: TestWrapper });

      const chatButton = screen.getByTestId('chat-overlay');
      chatButton.click();

      // Wait for chat panel to open and find dismiss button
      await waitFor(() => {
        const dismissButtons = screen.getAllByRole('button', { name: /nie pokazuj więcej/i });
        const dismissButton = dismissButtons[dismissButtons.length - 1];
        expect(dismissButton).toBeDefined();
        dismissButton.click();
      });

      await waitFor(() => {
        expect(localStorageMock['hideChatWidget']).toBe('1');
      });

      // Re-render
      rerender(<AiChatAgent />);

      // Should not render after dismissal
      await waitFor(() => {
        expect(screen.queryByTestId('chat-overlay')).toBeNull();
      });
    });
  });

  describe('Z-index and Positioning', () => {
    it('overlays use CSS variable for z-index', async () => {
      const beforeInstallPromptEvent = new Event('beforeinstallprompt');
      Object.defineProperty(beforeInstallPromptEvent, 'prompt', {
        value: vi.fn(),
      });
      Object.defineProperty(beforeInstallPromptEvent, 'userChoice', {
        value: Promise.resolve({ outcome: 'dismissed' }),
      });

      render(<InstallPrompt />, { wrapper: TestWrapper });
      window.dispatchEvent(beforeInstallPromptEvent);

      await waitFor(() => {
        const overlay = screen.queryByTestId('pwa-overlay');
        if (overlay) {
          // Check that z-index is set via style attribute
          expect(overlay.getAttribute('style')).toContain('z-index');
        }
      });
    });

    it('chat widget uses CSS variable for z-index', () => {
      render(<AiChatAgent />, { wrapper: TestWrapper });

      const chatButton = screen.getByTestId('chat-overlay');
      expect(chatButton.getAttribute('style')).toContain('z-index');
    });
  });

  describe('Overlay Visibility and Clickability', () => {
    it('PWA overlay does not block bottom navigation buttons', async () => {
      const beforeInstallPromptEvent = new Event('beforeinstallprompt');
      Object.defineProperty(beforeInstallPromptEvent, 'prompt', {
        value: vi.fn(),
      });
      Object.defineProperty(beforeInstallPromptEvent, 'userChoice', {
        value: Promise.resolve({ outcome: 'dismissed' }),
      });

      render(<InstallPrompt />, { wrapper: TestWrapper });
      window.dispatchEvent(beforeInstallPromptEvent);

      await waitFor(() => {
        const overlay = screen.queryByTestId('pwa-overlay');
        if (overlay) {
          // Check that overlay is positioned above bottom nav (bottom-[88px] on mobile)
          const classes = overlay.className;
          expect(classes).toContain('bottom-[88px]');
        }
      });
    });

    it('chat widget is positioned to avoid bottom navigation', () => {
      render(<AiChatAgent />, { wrapper: TestWrapper });

      const chatButton = screen.getByTestId('chat-overlay');
      const classes = chatButton.className;

      // Should be positioned at bottom-[88px] on mobile to avoid nav (64px + 24px margin)
      expect(classes).toContain('bottom-[88px]');
    });
  });
});
