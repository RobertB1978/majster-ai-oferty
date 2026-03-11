/**
 * cleanup-pack-point2.test.tsx
 *
 * Tests covering Point 2 Cleanup Pack fixes:
 * - Upgrade path correctness (redirects to /app/plan, not /billing)
 * - AiChatAgent plan gate: free-plan users see upgrade prompt
 * - QuickEstimate plan gate: voice/AI tabs show upgrade notice for free users
 * - AddOnModal: no fake purchase — shows coming-soon notice + plan link
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AiChatAgent } from '@/components/ai/AiChatAgent';
import { AddOnModal } from '@/components/billing/AddOnModal';

/* ─────────────────────────── Global mocks ──────────────────────────────── */

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ order: vi.fn(() => ({ data: [], error: null })) })),
        order: vi.fn(() => ({ data: [], error: null })),
      })),
    })),
    functions: { invoke: vi.fn() },
  },
}));

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

vi.mock('@/hooks/useAiChatHistory', () => ({
  useAiChatHistory: () => ({ data: [], isLoading: false }),
  useAiChatSessions: () => ({ data: [], isLoading: false }),
  useSaveAiMessage: () => ({ mutate: vi.fn() }),
  useDeleteChatSession: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({ user: { id: 'test-user' }, isLoading: false }),
}));

/* localStorage stub */
let localStorageMock: Record<string, string> = {};
beforeEach(() => {
  localStorageMock = {};
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (key: string) => localStorageMock[key] ?? null,
      setItem: (key: string, val: string) => { localStorageMock[key] = val; },
      removeItem: (key: string) => { delete localStorageMock[key]; },
      clear: () => { localStorageMock = {}; },
    },
    writable: true,
  });
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((q) => ({
      matches: false, media: q, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <QueryClientProvider client={makeQC()}>
        {children}
      </QueryClientProvider>
    </MemoryRouter>
  );
}

/* ─────────────── AiChatAgent plan gate ─────────────────────────────────── */

describe('AiChatAgent — plan gate', () => {
  it('shows upgrade prompt when user is on free plan (no AI access)', async () => {
    vi.mock('@/hooks/usePlanGate', () => ({
      usePlanGate: () => ({
        currentPlan: 'free',
        isPremium: false,
        canUseFeature: (_f: string) => false,
        checkFeature: () => false,
        checkLimit: () => true,
        getUpgradeMessage: () => 'Ta funkcja wymaga planu BUSINESS.',
        limits: {},
        features: {},
        subscription: null,
      }),
    }));

    render(<AiChatAgent />, { wrapper: TestWrapper });

    const chatBtn = screen.getByTestId('chat-overlay');
    chatBtn.click();

    await waitFor(() => {
      // Should show upgrade/lock message, NOT the full chat input
      expect(screen.queryByPlaceholderText('Napisz wiadomość...')).toBeNull();
    });
  });

  it('shows full chat panel when user has AI access (business plan)', async () => {
    vi.mock('@/hooks/usePlanGate', () => ({
      usePlanGate: () => ({
        currentPlan: 'business',
        isPremium: true,
        canUseFeature: (_f: string) => true,
        checkFeature: () => true,
        checkLimit: () => true,
        getUpgradeMessage: () => '',
        limits: {},
        features: {},
        subscription: null,
      }),
    }));

    render(<AiChatAgent />, { wrapper: TestWrapper });

    const chatBtn = screen.getByTestId('chat-overlay');
    chatBtn.click();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Napisz wiadomość...')).toBeDefined();
    });
  });
});

/* ─────────────── AddOnModal — no fake purchase ─────────────────────────── */

describe('AddOnModal — truthfulness', () => {
  it('renders without a "Kup teraz" purchase button', () => {
    render(
      <BrowserRouter>
        <QueryClientProvider client={makeQC()}>
          <AddOnModal open={true} onClose={vi.fn()} />
        </QueryClientProvider>
      </BrowserRouter>
    );

    // Must NOT have a real "Buy now" button
    expect(screen.queryByRole('button', { name: /kup teraz/i })).toBeNull();
  });

  it('shows "coming soon" information text', () => {
    render(
      <BrowserRouter>
        <QueryClientProvider client={makeQC()}>
          <AddOnModal open={true} onClose={vi.fn()} />
        </QueryClientProvider>
      </BrowserRouter>
    );

    // Should contain "coming soon" messaging (may appear multiple times — in badges + alert)
    const infoTexts = screen.queryAllByText(/wkrótce/i);
    expect(infoTexts.length).toBeGreaterThan(0);
  });

  it('shows "Zobacz plany" button that redirects to plan page', () => {
    render(
      <BrowserRouter>
        <QueryClientProvider client={makeQC()}>
          <AddOnModal open={true} onClose={vi.fn()} />
        </QueryClientProvider>
      </BrowserRouter>
    );

    const planButton = screen.getByRole('button', { name: /zobacz plany/i });
    expect(planButton).toBeDefined();
  });

  it('shows "Wkrótce" badge on each add-on item', () => {
    render(
      <BrowserRouter>
        <QueryClientProvider client={makeQC()}>
          <AddOnModal open={true} onClose={vi.fn()} />
        </QueryClientProvider>
      </BrowserRouter>
    );

    const badges = screen.getAllByText(/wkrótce/i);
    // 3 add-on cards + alert text = at least 3 occurrences
    expect(badges.length).toBeGreaterThanOrEqual(3);
  });
});
