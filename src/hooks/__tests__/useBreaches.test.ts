import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calcReportDeadline, deadlineHoursRemaining } from '@/types/breach';

// ── Pure-function unit tests (no Supabase / React needed) ────────────────────

describe('calcReportDeadline', () => {
  it('returns a timestamp exactly 72 hours after detected_at', () => {
    const base = '2026-01-01T10:00:00.000Z';
    const deadline = calcReportDeadline(base);
    const diffMs = new Date(deadline).getTime() - new Date(base).getTime();
    expect(diffMs).toBe(72 * 60 * 60 * 1000);
  });

  it('returns an ISO string', () => {
    const result = calcReportDeadline('2026-06-15T08:30:00.000Z');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

describe('deadlineHoursRemaining', () => {
  it('returns positive value for a future deadline', () => {
    const futureDeadline = new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString();
    const hours = deadlineHoursRemaining(futureDeadline);
    expect(hours).toBeGreaterThan(9);
    expect(hours).toBeLessThan(11);
  });

  it('returns negative value for an overdue deadline', () => {
    const pastDeadline = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
    const hours = deadlineHoursRemaining(pastDeadline);
    expect(hours).toBeLessThan(0);
    expect(hours).toBeGreaterThan(-6);
  });

  it('roundtrip: calcReportDeadline + deadlineHoursRemaining is ~72h from now for "now" input', () => {
    const now = new Date().toISOString();
    const deadline = calcReportDeadline(now);
    const remaining = deadlineHoursRemaining(deadline);
    // Should be close to 72h (within 1 second tolerance)
    expect(remaining).toBeGreaterThan(71.999);
    expect(remaining).toBeLessThanOrEqual(72);
  });
});

// ── Hook mutation path: useCreateBreach + useUpdateBreach ────────────────────

const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: mockInsert,
      update: mockUpdate,
      select: mockSelect,
    })),
  },
}));

vi.mock('@/lib/auditLog', () => ({
  insertComplianceAuditEvent: vi.fn(async () => ({ error: null })),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-123' } }),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
    useMutation: ({ mutationFn }: { mutationFn: (...args: unknown[]) => Promise<unknown> }) => ({
      mutateAsync: mutationFn,
      isPending: false,
    }),
    useQuery: () => ({ data: [], isLoading: false, isError: false }),
  };
});

describe('useCreateBreach — mutation path', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const fakeRecord = {
      id: 'breach-abc',
      title: 'Test naruszenia',
      severity: 'high',
      status: 'open',
      detected_at: '2026-01-01T10:00:00.000Z',
      report_deadline_at: '2026-01-01T10:00:00.000Z',
    };

    mockSingle.mockResolvedValue({ data: fakeRecord, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });
  });

  it('computes report_deadline_at as detected_at + 72h when not provided', async () => {
    const { useCreateBreach } = await import('@/hooks/useBreaches');
    const { mutateAsync } = useCreateBreach();

    const detected = '2026-01-01T10:00:00.000Z';
    await mutateAsync({
      title: 'Test naruszenia',
      description: 'Opis',
      severity: 'high',
      detected_at: detected,
    });

    const insertCall = mockInsert.mock.calls[0][0] as { report_deadline_at: string };
    expect(insertCall.report_deadline_at).toBe(calcReportDeadline(detected));
  });
});

describe('useUpdateBreach — status change', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const fakeUpdated = {
      id: 'breach-abc',
      status: 'contained',
    };

    mockSingle.mockResolvedValue({ data: fakeUpdated, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockEq.mockReturnValue({ select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq });
  });

  it('calls supabase update with correct status', async () => {
    const { useUpdateBreach } = await import('@/hooks/useBreaches');
    const { mutateAsync } = useUpdateBreach();

    await mutateAsync({ id: 'breach-abc', update: { status: 'contained' } });

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'contained' }));
  });
});
