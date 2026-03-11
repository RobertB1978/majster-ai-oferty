/**
 * shell-responsive.test.tsx
 *
 * Weryfikuje reguły widoczności dla nowego shella (NewShell):
 *  - BottomNav i FAB mają klasy Tailwind ukrywające na lg+
 *  - DesktopSidebar ma klasy widoczne tylko na lg+ i zawiera wszystkie kluczowe moduły
 *  - Topbar posiada przycisk quick-create widoczny tylko na desktop (hidden lg:flex)
 *  - Topbar posiada przycisk konta użytkownika
 *
 * Uwaga: testy sprawdzają klasy CSS, nie faktyczne media-query (jsdom nie przetwarza CSS).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';

// ---------- Mocks ----------
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { email: 'test@example.com' }, isLoading: false, logout: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ---------- Komponenty ----------
import { NewShellBottomNav } from '@/components/layout/NewShellBottomNav';
import { NewShellFAB } from '@/components/layout/NewShellFAB';
import { NewShellDesktopSidebar } from '@/components/layout/NewShellDesktopSidebar';
import { NewShellTopBar } from '@/components/layout/NewShellTopBar';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/app/home']}>{children}</MemoryRouter>
);

// ---------- Testy ----------

describe('NewShellBottomNav — widoczność mobilna', () => {
  it('ma klasę lg:hidden ukrywającą na desktop', () => {
    const { container } = render(<NewShellBottomNav />, { wrapper: Wrapper });
    const nav = container.querySelector('nav');
    expect(nav).not.toBeNull();
    expect(nav!.className).toContain('lg:hidden');
  });

  it('renderuje 4 zakładki nawigacyjne', () => {
    render(<NewShellBottomNav />, { wrapper: Wrapper });
    // Home, Offers, Projects, More (slot FAB jest pusty, nie jest linkiem)
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(4);
  });
});

describe('NewShellFAB — widoczność mobilna', () => {
  it('jest opakowany w wrapper z klasą lg:hidden', () => {
    const { container } = render(<NewShellFAB />, { wrapper: Wrapper });
    // Zewnętrzny wrapper div powinien mieć lg:hidden
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper.className).toContain('lg:hidden');
  });

  it('zawiera przycisk FAB "Utwórz"', () => {
    render(<NewShellFAB />, { wrapper: Wrapper });
    const fab = screen.getByRole('button', { name: /utwórz/i });
    expect(fab).toBeDefined();
  });
});

describe('NewShellDesktopSidebar — widoczność desktop', () => {
  it('ma klasę hidden ukrywającą na mobile i lg:flex pokazującą na desktop', () => {
    const { container } = render(<NewShellDesktopSidebar />, { wrapper: Wrapper });
    const aside = container.querySelector('aside');
    expect(aside).not.toBeNull();
    expect(aside!.className).toContain('hidden');
    expect(aside!.className).toContain('lg:flex');
  });

  it('renderuje 8 linków nawigacyjnych (Home, Offers, Projects, Customers, Calendar, Documents, Finance, Settings)', () => {
    render(<NewShellDesktopSidebar />, { wrapper: Wrapper });
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(8);
  });

  it('zawiera bezpośredni link do Klientów bez przechodzenia przez "Więcej"', () => {
    render(<NewShellDesktopSidebar />, { wrapper: Wrapper });
    const links = screen.getAllByRole('link') as HTMLAnchorElement[];
    const customersLink = links.find(l => l.href.includes('/app/customers'));
    expect(customersLink).not.toBeUndefined();
  });

  it('zawiera bezpośredni link do Finansów bez przechodzenia przez "Więcej"', () => {
    render(<NewShellDesktopSidebar />, { wrapper: Wrapper });
    const links = screen.getAllByRole('link') as HTMLAnchorElement[];
    const financeLink = links.find(l => l.href.includes('/app/finance'));
    expect(financeLink).not.toBeUndefined();
  });

  it('zawiera bezpośredni link do Kalendarza bez przechodzenia przez "Więcej"', () => {
    render(<NewShellDesktopSidebar />, { wrapper: Wrapper });
    const links = screen.getAllByRole('link') as HTMLAnchorElement[];
    const calendarLink = links.find(l => l.href.includes('/app/calendar'));
    expect(calendarLink).not.toBeUndefined();
  });

  it('zawiera bezpośredni link do Wzorów dokumentów bez przechodzenia przez "Więcej"', () => {
    render(<NewShellDesktopSidebar />, { wrapper: Wrapper });
    const links = screen.getAllByRole('link') as HTMLAnchorElement[];
    const docsLink = links.find(l => l.href.includes('/app/document-templates'));
    expect(docsLink).not.toBeUndefined();
  });
});

describe('NewShellTopBar — quick-create na desktop', () => {
  it('przycisk "Utwórz" ma klasy hidden i lg:flex (widoczny tylko na desktop)', () => {
    const { container } = render(
      <BrowserRouter>
        <NewShellTopBar />
      </BrowserRouter>
    );
    // Szukamy przycisku z klasami hidden lg:flex
    const buttons = container.querySelectorAll('button');
    const createBtn = Array.from(buttons).find(
      (btn) => btn.className.includes('hidden') && btn.className.includes('lg:flex')
    );
    expect(createBtn).not.toBeUndefined();
  });

  it('zawiera przycisk konta użytkownika dostępny na każdym urządzeniu', () => {
    render(
      <BrowserRouter>
        <NewShellTopBar />
      </BrowserRouter>
    );
    const accountBtn = screen.getByRole('button', { name: /konto/i });
    expect(accountBtn).toBeDefined();
  });
});
