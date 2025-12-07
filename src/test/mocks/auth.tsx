import React from 'react';
import { vi } from 'vitest';

export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {},
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

export const mockAuthContext = {
  user: null as typeof mockUser | null,
  loading: false,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
};

export const AuthContextMock = React.createContext(mockAuthContext);

export function MockAuthProvider({ children, user = null }: { children: React.ReactNode; user?: typeof mockUser | null }) {
  return (
    <AuthContextMock.Provider value={{ ...mockAuthContext, user }}>
      {children}
    </AuthContextMock.Provider>
  );
}
