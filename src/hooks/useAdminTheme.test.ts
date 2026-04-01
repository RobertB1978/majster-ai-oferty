/**
 * Tests for useAdminTheme — subscription cleanup behaviour.
 *
 * Verifies that:
 *  - the hook uses the modern Supabase channel() API (not the deprecated .on().subscribe())
 *  - removeChannel() is called on unmount (not the removed removeSubscription())
 *  - no subscription is created when organizationId is null
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

/* ── Mock channel returned by supabase.channel() ──────────────── */

const mockChannel = {
  on: vi.fn(),
  subscribe: vi.fn(),
};
mockChannel.on.mockReturnValue(mockChannel);
mockChannel.subscribe.mockReturnValue(mockChannel);

const mockSupabase = {
  from: vi.fn(),
  channel: vi.fn().mockReturnValue(mockChannel),
  removeChannel: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/integrations/supabase/client', () => ({ supabase: mockSupabase }));

/* ── i18n stub (hook calls useTranslation) ─────────────────────── */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

/* ── toast stub ────────────────────────────────────────────────── */
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));

/* ── logger stub ───────────────────────────────────────────────── */
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));

/* ── Hook import (after mocks) ─────────────────────────────────── */
import { useAdminTheme } from './useAdminTheme';

/* ── Helpers ───────────────────────────────────────────────────── */

function makeFromBuilder(data: unknown = null, error: unknown = null) {
  const b: Record<string, unknown> = {};
  b.select = vi.fn().mockReturnValue(b);
  b.eq = vi.fn().mockReturnValue(b);
  b.single = vi.fn().mockResolvedValue({ data, error });
  return b;
}

describe('useAdminTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChannel.on.mockReturnValue(mockChannel);
    mockChannel.subscribe.mockReturnValue(mockChannel);
    mockSupabase.channel.mockReturnValue(mockChannel);
    mockSupabase.removeChannel.mockResolvedValue(undefined);
  });

  describe('subscription cleanup', () => {
    it('uses supabase.channel() — not the deprecated .on() API', () => {
      mockSupabase.from.mockReturnValue(makeFromBuilder());

      const { unmount } = renderHook(() => useAdminTheme('org-1'));

      expect(mockSupabase.channel).toHaveBeenCalledWith('admin-theme-org-org-1');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({ table: 'admin_theme_config', filter: 'organization_id=eq.org-1' }),
        expect.any(Function),
      );

      unmount();
    });

    it('calls removeChannel() on unmount', () => {
      mockSupabase.from.mockReturnValue(makeFromBuilder());

      const { unmount } = renderHook(() => useAdminTheme('org-cleanup'));

      unmount();

      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });

    it('does NOT call channel() when organizationId is null', () => {
      const { unmount } = renderHook(() => useAdminTheme(null));

      unmount();

      expect(mockSupabase.channel).not.toHaveBeenCalled();
      expect(mockSupabase.removeChannel).not.toHaveBeenCalled();
    });
  });
});
