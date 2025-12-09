/**
 * Tests for useOfferStats - Phase 6A
 * Tests statistics calculation for offers in last 30 days
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOfferStats } from './useOfferStats';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-123' },
  }),
}));

describe('useOfferStats', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should calculate stats correctly with mixed tracking statuses', async () => {
    const mockData = [
      { tracking_status: 'sent', status: 'sent' },
      { tracking_status: 'opened', status: 'sent' },
      { tracking_status: 'accepted', status: 'sent' },
      { tracking_status: 'accepted', status: 'sent' },
      { tracking_status: 'rejected', status: 'sent' },
      { tracking_status: null, status: 'sent' }, // counts as sent
    ];

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockGte = vi.fn().mockResolvedValue({ data: mockData, error: null });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      gte: mockGte,
    });

    const { result } = renderHook(() => useOfferStats(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      sentCount: 6,
      acceptedCount: 2,
      conversionRate: 33, // 2/6 = 33.33% rounded to 33
    });
  });

  it('should return zero stats when no offers exist', async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockGte = vi.fn().mockResolvedValue({ data: [], error: null });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      gte: mockGte,
    });

    const { result } = renderHook(() => useOfferStats(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      sentCount: 0,
      acceptedCount: 0,
      conversionRate: 0,
    });
  });

  it('should calculate 100% conversion rate when all offers are accepted', async () => {
    const mockData = [
      { tracking_status: 'accepted', status: 'sent' },
      { tracking_status: 'accepted', status: 'sent' },
      { tracking_status: 'accepted', status: 'sent' },
    ];

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockGte = vi.fn().mockResolvedValue({ data: mockData, error: null });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      gte: mockGte,
    });

    const { result } = renderHook(() => useOfferStats(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      sentCount: 3,
      acceptedCount: 3,
      conversionRate: 100,
    });
  });

  it('should calculate 0% conversion rate when no offers are accepted', async () => {
    const mockData = [
      { tracking_status: 'sent', status: 'sent' },
      { tracking_status: 'rejected', status: 'sent' },
      { tracking_status: null, status: 'sent' },
    ];

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockGte = vi.fn().mockResolvedValue({ data: mockData, error: null });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      gte: mockGte,
    });

    const { result } = renderHook(() => useOfferStats(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      sentCount: 3,
      acceptedCount: 0,
      conversionRate: 0,
    });
  });

  it('should only query offers from last 30 days', async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockGte = vi.fn().mockResolvedValue({ data: [], error: null });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      gte: mockGte,
    });

    renderHook(() => useOfferStats(), { wrapper });

    await waitFor(() => {
      expect(mockGte).toHaveBeenCalled();
    });

    // Verify the date calculation (should be 30 days ago)
    const callArgs = mockGte.mock.calls[0];
    expect(callArgs[0]).toBe('sent_at');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const passedDate = new Date(callArgs[1]);
    const diffInDays = Math.abs((thirtyDaysAgo.getTime() - passedDate.getTime()) / (1000 * 60 * 60 * 24));

    // Allow 1 second tolerance for test execution time
    expect(diffInDays).toBeLessThan(0.001);
  });

  it('should only count offers with status "sent"', async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockGte = vi.fn().mockResolvedValue({ data: [], error: null });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      gte: mockGte,
    });

    renderHook(() => useOfferStats(), { wrapper });

    await waitFor(() => {
      expect(mockEq).toHaveBeenCalledWith('user_id', 'test-user-123');
      expect(mockEq).toHaveBeenCalledWith('status', 'sent');
    });
  });
});
