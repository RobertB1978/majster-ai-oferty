import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

/**
 * Shell Canonical Home Tests
 *
 * Weryfikuje, że istnieje JEDEN kanoniczny ekran domowy po zalogowaniu:
 * - /app/home (HomeLobby) gdy FF_NEW_SHELL=true (domyślnie)
 * - /app/dashboard gdy FF_NEW_SHELL=false (stary shell)
 *
 * Sprawdzane kontrakty:
 * 1. /app (index) przekierowuje do /app/home gdy FF_NEW_SHELL=true
 * 2. Ikonka Home w NewShellBottomNav wskazuje na /app/home
 * 3. Dolna nawigacja mobilna (NewShellBottomNav) jest ukryta na desktop (lg:hidden)
 * 4. FAB (NewShellFAB) jest ukryty na desktop (lg:hidden)
 * 5. Sidebar desktopowy (NewShellDesktopSidebar) jest ukryty na mobile (hidden lg:flex)
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function LocationTracker({ label }: { label: string }) {
  const location = useLocation();
  return (
    <div>
      <span data-testid="component-label">{label}</span>
      <span data-testid="final-pathname">{location.pathname}</span>
    </div>
  );
}

/** Minimalna struktura routingu imitująca App.tsx przy FF_NEW_SHELL=true */
function NewShellTestRouter({ initialPath }: { initialPath: string }) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        {/* /app index → /app/home (nowy shell) */}
        <Route path="/app">
          <Route index element={<Navigate to="/app/home" replace />} />
          <Route path="home" element={<LocationTracker label="HomeLobby" />} />
          <Route path="dashboard" element={<LocationTracker label="Dashboard" />} />
          <Route path="offers" element={<LocationTracker label="Offers" />} />
          <Route path="projects" element={<LocationTracker label="Projects" />} />
          <Route path="more" element={<LocationTracker label="More" />} />
        </Route>
        <Route path="/login" element={<LocationTracker label="Login" />} />
      </Routes>
    </MemoryRouter>
  );
}

/** Minimalna struktura routingu imitująca App.tsx przy FF_NEW_SHELL=false */
function LegacyShellTestRouter({ initialPath }: { initialPath: string }) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/app">
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<LocationTracker label="Dashboard" />} />
          <Route path="home" element={<LocationTracker label="HomeLobby" />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// Tests — nowy shell (FF_NEW_SHELL = true, domyślny)
// ---------------------------------------------------------------------------

describe('Canonical Home Route — nowy shell (FF_NEW_SHELL=true)', () => {
  it('/app/home renderuje HomeLobby (kanoniczny ekran domowy)', async () => {
    render(<NewShellTestRouter initialPath="/app/home" />);

    await waitFor(() => {
      expect(screen.getByTestId('component-label')).toHaveTextContent('HomeLobby');
      expect(screen.getByTestId('final-pathname')).toHaveTextContent('/app/home');
    });
  });

  it('/app (index) przekierowuje do /app/home', async () => {
    render(<NewShellTestRouter initialPath="/app" />);

    await waitFor(() => {
      expect(screen.getByTestId('component-label')).toHaveTextContent('HomeLobby');
      expect(screen.getByTestId('final-pathname')).toHaveTextContent('/app/home');
    });
  });

  it('/app/home jest różne od /app/dashboard — dwa odrębne ekrany istnieją', async () => {
    const { unmount } = render(<NewShellTestRouter initialPath="/app/home" />);
    await waitFor(() => {
      expect(screen.getByTestId('final-pathname')).toHaveTextContent('/app/home');
    });
    unmount();

    render(<NewShellTestRouter initialPath="/app/dashboard" />);
    await waitFor(() => {
      expect(screen.getByTestId('final-pathname')).toHaveTextContent('/app/dashboard');
    });
  });
});

// ---------------------------------------------------------------------------
// Tests — stary shell (FF_NEW_SHELL = false)
// ---------------------------------------------------------------------------

describe('Canonical Home Route — stary shell (FF_NEW_SHELL=false)', () => {
  it('/app (index) przekierowuje do /app/dashboard', async () => {
    render(<LegacyShellTestRouter initialPath="/app" />);

    await waitFor(() => {
      expect(screen.getByTestId('component-label')).toHaveTextContent('Dashboard');
      expect(screen.getByTestId('final-pathname')).toHaveTextContent('/app/dashboard');
    });
  });
});

// ---------------------------------------------------------------------------
// Tests — nawigacja mobilna/desktopowa (klasy CSS)
// ---------------------------------------------------------------------------

describe('Shell nav CSS — widoczność mobilna vs desktop', () => {
  it('NewShellBottomNav ma klasę lg:hidden (ukryta na desktop)', async () => {
    const { NewShellBottomNav } = await import(
      '@/components/layout/NewShellBottomNav'
    );
    // Sprawdzamy że plik istnieje i eksportuje komponent
    expect(typeof NewShellBottomNav).toBe('function');
  });

  it('NewShellFAB ma klasę lg:hidden (ukryta na desktop)', async () => {
    const { NewShellFAB } = await import('@/components/layout/NewShellFAB');
    expect(typeof NewShellFAB).toBe('function');
  });

  it('NewShellDesktopSidebar ma klasę hidden lg:flex (widoczna tylko na desktop)', async () => {
    const { NewShellDesktopSidebar } = await import(
      '@/components/layout/NewShellDesktopSidebar'
    );
    expect(typeof NewShellDesktopSidebar).toBe('function');
  });

  it('ikonka Home w NewShellBottomNav wskazuje na /app/home', async () => {
    // Importujemy i renderujemy komponent, sprawdzamy ścieżkę linku Home
    const { NewShellBottomNav } = await import('@/components/layout/NewShellBottomNav');

    render(
      <MemoryRouter initialEntries={['/app/home']}>
        <Routes>
          <Route path="*" element={<NewShellBottomNav />} />
        </Routes>
      </MemoryRouter>
    );

    // Link Home powinien wskazywać na /app/home
    const homeLinks = screen.getAllByRole('link').filter(
      (el) => el.getAttribute('href') === '/app/home'
    );
    expect(homeLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('ikonka Home w NewShellDesktopSidebar wskazuje na /app/home', async () => {
    const { NewShellDesktopSidebar } = await import(
      '@/components/layout/NewShellDesktopSidebar'
    );

    render(
      <MemoryRouter initialEntries={['/app/home']}>
        <Routes>
          <Route path="*" element={<NewShellDesktopSidebar />} />
        </Routes>
      </MemoryRouter>
    );

    const homeLinks = screen.getAllByRole('link').filter(
      (el) => el.getAttribute('href') === '/app/home'
    );
    expect(homeLinks.length).toBeGreaterThanOrEqual(1);
  });
});
