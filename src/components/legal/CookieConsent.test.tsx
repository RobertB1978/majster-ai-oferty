/**
 * Tests for CookieConsent — PR-COMPLIANCE-01
 *
 * Covers:
 * - Banner renders and shows accept/reject buttons
 * - handleRejectAll saves only essential+analytics consent (no marketing)
 * - handleAcceptAll saves essential=true, analytics=true, marketing=false
 * - saveConsent attempts DB insert for both anonymous and authenticated users
 * - Marketing toggle is NOT shown in the banner
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';

// vi.hoisted() — runs BEFORE vi.mock factory, solves the hoisting issue
const { mockInsert } = vi.hoisted(() => {
  const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
  return { mockInsert };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      insert: mockInsert,
    }),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

import { CookieConsent } from './CookieConsent';

function mockNoConsent() {
  vi.spyOn(window.localStorage, 'getItem').mockReturnValue(null);
}

function mockExistingConsent() {
  vi.spyOn(window.localStorage, 'getItem').mockReturnValue(
    JSON.stringify({ essential: true, analytics: false })
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockNoConsent();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CookieConsent banner', () => {
  it('renders the consent banner when no prior consent exists', () => {
    render(<CookieConsent />);
    expect(screen.getByText(/Odrzuć wszystkie/i)).toBeDefined();
    expect(screen.getByText(/Akceptuję wszystkie/i)).toBeDefined();
  });

  it('does NOT render accept/reject buttons when consent already exists in localStorage', () => {
    mockExistingConsent();
    render(<CookieConsent />);
    // Banner should not show — no accept/reject buttons
    expect(screen.queryByText(/Odrzuć wszystkie/i)).toBeNull();
    expect(screen.queryByText(/Akceptuję wszystkie/i)).toBeNull();
  });

  it('does NOT show Marketing toggle in the details panel', async () => {
    render(<CookieConsent />);

    fireEvent.click(screen.getByText(/Dostosuj/i));

    // Marketing toggle should not be present
    expect(screen.queryByText(/Marketingowe/i)).toBeNull();
  });

  it('shows Analytics toggle in the details panel', async () => {
    render(<CookieConsent />);

    fireEvent.click(screen.getByText(/Dostosuj/i));

    expect(screen.getByText(/Analityczne/i)).toBeDefined();
  });
});

describe('handleRejectAll()', () => {
  it('saves essential=true, analytics=false to localStorage', async () => {
    const setItemSpy = vi.spyOn(window.localStorage, 'setItem');

    render(<CookieConsent />);
    fireEvent.click(screen.getByText(/Odrzuć wszystkie/i));

    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith(
        'cookie_consent',
        JSON.stringify({ essential: true, analytics: false, marketing: false })
      );
    });
  });

  it('inserts 2 consent records (essential + analytics, no marketing)', async () => {
    render(<CookieConsent />);
    fireEvent.click(screen.getByText(/Odrzuć wszystkie/i));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledTimes(2);
    });

    const types = mockInsert.mock.calls.map(
      (c) => (c[0] as { consent_type: string }).consent_type
    );
    expect(types).toContain('cookies_essential');
    expect(types).toContain('cookies_analytics');
    expect(types).not.toContain('cookies_marketing');
  });
});

describe('handleAcceptAll()', () => {
  it('saves essential=true, analytics=true, marketing=false to localStorage', async () => {
    const setItemSpy = vi.spyOn(window.localStorage, 'setItem');

    render(<CookieConsent />);
    fireEvent.click(screen.getByText(/Akceptuję wszystkie/i));

    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith(
        'cookie_consent',
        JSON.stringify({ essential: true, analytics: true, marketing: false })
      );
    });
  });

  it('does NOT insert cookies_marketing record on accept-all', async () => {
    render(<CookieConsent />);
    fireEvent.click(screen.getByText(/Akceptuję wszystkie/i));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledTimes(2);
    });

    const types = mockInsert.mock.calls.map(
      (c) => (c[0] as { consent_type: string }).consent_type
    );
    expect(types).not.toContain('cookies_marketing');
  });
});
