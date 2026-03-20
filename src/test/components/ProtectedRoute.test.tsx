import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/contexts/AuthContext';

type AuthMock = ReturnType<typeof useAuth>;

describe('ProtectedRoute', () => {
  it('renders children when user is authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-1' } as User,
      isLoading: false,
    } as AuthMock);

    const { getByText } = render(
      <MemoryRouter initialEntries={['/app/dashboard']}>
        <Routes>
          <Route path="/app/dashboard" element={
            <ProtectedRoute><div>Protected content</div></ProtectedRoute>
          } />
        </Routes>
      </MemoryRouter>
    );

    expect(getByText('Protected content')).toBeTruthy();
  });

  it('redirects to /login when user is not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
    } as AuthMock);

    const { container } = render(
      <MemoryRouter initialEntries={['/app/dashboard']}>
        <Routes>
          <Route path="/app/dashboard" element={
            <ProtectedRoute><div>Protected content</div></ProtectedRoute>
          } />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(container.textContent).toBe('Login page');
  });

  it('renders nothing while auth is loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: true,
    } as AuthMock);

    const { container } = render(
      <MemoryRouter initialEntries={['/app/dashboard']}>
        <Routes>
          <Route path="/app/dashboard" element={
            <ProtectedRoute><div>Protected content</div></ProtectedRoute>
          } />
        </Routes>
      </MemoryRouter>
    );

    expect(container.textContent).toBe('');
  });
});
