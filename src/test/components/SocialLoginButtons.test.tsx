/**
 * AUDIT-AUTH-01 — Social login visibility rules.
 *
 * Verifies that:
 * - Google button is rendered (provider is beta-safe, code fully wired)
 * - Apple button is NOT rendered (APPLE_LOGIN_ENABLED = false; requires
 *   owner configuration in Supabase dashboard that cannot be verified
 *   from code — hidden until owner confirms Apple provider is active)
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    loginWithGoogle: vi.fn().mockResolvedValue({ error: null }),
    loginWithApple: vi.fn().mockResolvedValue({ error: null }),
  }),
}));

import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';

describe('SocialLoginButtons — beta visibility rules', () => {
  it('renders Google login button', () => {
    render(<SocialLoginButtons />);
    expect(
      screen.getByRole('button', { name: /google/i }),
    ).toBeDefined();
  });

  it('does NOT render Apple login button (APPLE_LOGIN_ENABLED = false)', () => {
    render(<SocialLoginButtons />);
    expect(
      screen.queryByRole('button', { name: /apple/i }),
    ).toBeNull();
  });

  it('renders exactly one social provider button', () => {
    render(<SocialLoginButtons />);
    // Only Google; Apple is hidden until owner configures provider in Supabase
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
  });
});
