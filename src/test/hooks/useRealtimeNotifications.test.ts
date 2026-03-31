import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ── vi.hoisted — values available in hoisted vi.mock factories ────────────────
const {
  mockNavigate,
  mockToastSuccess,
  mockToastError,
  mockToastWarning,
  mockToastInfo,
  mockOn,
  mockSubscribe,
  channelObj,
  mockChannel,
  mockRemoveChannel,
} = vi.hoisted(() => {
  const mockNavigate = vi.fn();
  const mockToastSuccess = vi.fn();
  const mockToastError = vi.fn();
  const mockToastWarning = vi.fn();
  const mockToastInfo = vi.fn();

  // subscribe() returns the channel itself (matches real Supabase RealtimeChannel API)
  const mockSubscribe = vi.fn();
  const mockOn = vi.fn();
  const channelObj = { on: mockOn, subscribe: mockSubscribe };
  mockOn.mockReturnValue(channelObj);
  mockSubscribe.mockReturnValue(channelObj);

  const mockChannel = vi.fn().mockReturnValue(channelObj);
  const mockRemoveChannel = vi.fn();

  return {
    mockNavigate,
    mockToastSuccess,
    mockToastError,
    mockToastWarning,
    mockToastInfo,
    mockOn,
    mockSubscribe,
    channelObj,
    mockChannel,
    mockRemoveChannel,
  };
});

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-abc' } }),
}));

vi.mock('@/components/ui/sonner', () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
    warning: mockToastWarning,
    info: mockToastInfo,
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  },
}));

// ── Import under test ─────────────────────────────────────────────────────────
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function getPayloadCallback(): (payload: { new: object }) => void {
  return mockOn.mock.calls[0]?.[2] as (payload: { new: object }) => void;
}

function makeNotification(overrides: Partial<{
  id: string;
  title: string;
  message: string;
  type: string;
  action_url: string | null;
}> = {}) {
  return {
    id: 'n-1',
    user_id: 'user-abc',
    title: 'Test',
    message: 'Test message',
    type: 'info',
    is_read: false,
    action_url: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useRealtimeNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOn.mockReturnValue(channelObj);
    mockSubscribe.mockReturnValue(channelObj);
    mockChannel.mockReturnValue(channelObj);
  });

  it('subscribes to the correct channel and table filter for the current user', () => {
    renderHook(() => useRealtimeNotifications(), { wrapper: makeWrapper(makeQC()) });

    expect(mockChannel).toHaveBeenCalledWith('notifications:user-abc');
    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: 'user_id=eq.user-abc',
      }),
      expect.any(Function),
    );
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it('shows a success toast when offer-accepted notification arrives', () => {
    renderHook(() => useRealtimeNotifications(), { wrapper: makeWrapper(makeQC()) });

    getPayloadCallback()({
      new: makeNotification({
        title: '✓ Klient zaakceptował ofertę',
        message: 'Klient zaakceptował ofertę.',
        type: 'success',
        action_url: '/app/projects/p1',
      }),
    });

    expect(mockToastSuccess).toHaveBeenCalledWith(
      '✓ Klient zaakceptował ofertę',
      expect.objectContaining({ description: 'Klient zaakceptował ofertę.' }),
    );
    expect(mockToastError).not.toHaveBeenCalled();
    expect(mockToastWarning).not.toHaveBeenCalled();
  });

  it('shows a warning toast when client withdraws acceptance', () => {
    renderHook(() => useRealtimeNotifications(), { wrapper: makeWrapper(makeQC()) });

    getPayloadCallback()({
      new: makeNotification({
        title: 'Klient cofnął akceptację',
        message: 'Cofnięto akceptację oferty.',
        type: 'warning',
      }),
    });

    expect(mockToastWarning).toHaveBeenCalledWith(
      'Klient cofnął akceptację',
      expect.objectContaining({ description: 'Cofnięto akceptację oferty.' }),
    );
  });

  it('shows an info toast for client-viewed notification', () => {
    renderHook(() => useRealtimeNotifications(), { wrapper: makeWrapper(makeQC()) });

    getPayloadCallback()({
      new: makeNotification({
        title: '👁 Klient otworzył ofertę',
        message: 'Klient po raz pierwszy otworzył Twoją ofertę.',
        type: 'info',
      }),
    });

    expect(mockToastInfo).toHaveBeenCalledWith(
      '👁 Klient otworzył ofertę',
      expect.objectContaining({ description: 'Klient po raz pierwszy otworzył Twoją ofertę.' }),
    );
  });

  it('shows an error toast for error-type notifications', () => {
    renderHook(() => useRealtimeNotifications(), { wrapper: makeWrapper(makeQC()) });

    getPayloadCallback()({
      new: makeNotification({ title: 'Błąd', message: 'Coś poszło nie tak.', type: 'error' }),
    });

    expect(mockToastError).toHaveBeenCalledWith(
      'Błąd',
      expect.objectContaining({ description: 'Coś poszło nie tak.' }),
    );
  });

  it('includes an "Otwórz" action button when action_url is provided', () => {
    renderHook(() => useRealtimeNotifications(), { wrapper: makeWrapper(makeQC()) });

    getPayloadCallback()({
      new: makeNotification({
        type: 'success',
        action_url: '/app/projects/p99',
      }),
    });

    expect(mockToastSuccess).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        action: expect.objectContaining({ label: 'Otwórz', onClick: expect.any(Function) }),
      }),
    );
  });

  it('does not include action button when action_url is null', () => {
    renderHook(() => useRealtimeNotifications(), { wrapper: makeWrapper(makeQC()) });

    getPayloadCallback()({ new: makeNotification({ action_url: null }) });

    const callArgs = mockToastInfo.mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs).not.toHaveProperty('action');
  });

  it('navigates to action_url when toast action button is clicked', () => {
    renderHook(() => useRealtimeNotifications(), { wrapper: makeWrapper(makeQC()) });

    getPayloadCallback()({
      new: makeNotification({ type: 'success', action_url: '/app/projects/p77' }),
    });

    const { action } = mockToastSuccess.mock.calls[0][1] as {
      action: { label: string; onClick: () => void };
    };
    action.onClick();
    expect(mockNavigate).toHaveBeenCalledWith('/app/projects/p77');
  });

  it('invalidates the ["notifications"] query cache on new notification', () => {
    const qc = makeQC();
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    renderHook(() => useRealtimeNotifications(), { wrapper: makeWrapper(qc) });

    getPayloadCallback()({ new: makeNotification() });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['notifications'] });
  });

  it('removes the channel subscription on unmount', () => {
    const { unmount } = renderHook(() => useRealtimeNotifications(), {
      wrapper: makeWrapper(makeQC()),
    });

    unmount();

    expect(mockRemoveChannel).toHaveBeenCalledWith(channelObj);
  });
});
