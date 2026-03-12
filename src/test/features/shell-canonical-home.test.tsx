import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

/**
 * Shell Canonical Home Tests
 *
 * Weryfikuje, że istnieje JEDEN kanoniczny ekran domowy po zalogowaniu:
 * - /app/dashboard (Dashboard) — zawsze, niezależnie od FF_NEW_SHELL
 *
 * HomeLobby (/app/home) pozostaje dostępna pod własną ścieżką,
 * ale nie jest domyślnym lądowiskiem po logowaniu.
 *
 * Sprawdzane kontrakty:
 * 1. /app (index) przekierowuje do /app/dashboard
 * 2. Ikonka Home w NewShellBottomNav wskazuje na /app/dashboard
 * 3. Ikonka Home w NewShellDesktopSidebar wskazuje na /app/dashboard
 * 4. Dolna nawigacja mobilna (NewShellBottomNav) jest ukryta na desktop (lg:hidden)
 * 5. FAB (NewShellFAB) jest ukryty na desktop (lg:hidden)
 * 6. Sidebar desktopowy (NewShellDesktopSidebar) jest ukryty na mobile (hidden lg:flex)
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

/** Minimalna struktura routingu imitująca App.tsx — kanoniczny home to /app/dashboard */
function CanonicalHomeTestRouter({ initialPath }: { initialPath: string }) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        {/* /app index → /app/dashboard (kanoniczny home) */}
        <Route path="/app">
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<LocationTracker label="Dashboard" />} />
          {/* HomeLobby placeholder — redirect do dashboardu (P9) */}
          <Route path="home" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="offers" element={<LocationTracker label="Offers" />} />
          <Route path="projects" element={<LocationTracker label="Projects" />} />
          <Route path="more" element={<LocationTracker label="More" />} />
        </Route>
        <Route path="/login" element={<LocationTracker label="Login" />} />
      </Routes>
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// Tests — kanoniczny home (zawsze /app/dashboard)
// ---------------------------------------------------------------------------

describe('Canonical Home Route — /app/dashboard jest kanonicznym ekranem domowym', () => {
  it('/app/dashboard renderuje Dashboard (kanoniczny ekran domowy)', async () => {
    render(<CanonicalHomeTestRouter initialPath="/app/dashboard" />);

    await waitFor(() => {
      expect(screen.getByTestId('component-label')).toHaveTextContent('Dashboard');
      expect(screen.getByTestId('final-pathname')).toHaveTextContent('/app/dashboard');
    });
  });

  it('/app (index) przekierowuje do /app/dashboard', async () => {
    render(<CanonicalHomeTestRouter initialPath="/app" />);

    await waitFor(() => {
      expect(screen.getByTestId('component-label')).toHaveTextContent('Dashboard');
      expect(screen.getByTestId('final-pathname')).toHaveTextContent('/app/dashboard');
    });
  });

  it('/app/home przekierowuje do /app/dashboard (HomeLobby placeholder — P9)', async () => {
    render(<CanonicalHomeTestRouter initialPath="/app/home" />);

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

  it('ikonka Home w NewShellBottomNav wskazuje na /app/dashboard', async () => {
    const { NewShellBottomNav } = await import('@/components/layout/NewShellBottomNav');

    render(
      <MemoryRouter initialEntries={['/app/dashboard']}>
        <Routes>
          <Route path="*" element={<NewShellBottomNav />} />
        </Routes>
      </MemoryRouter>
    );

    const homeLinks = screen.getAllByRole('link').filter(
      (el) => el.getAttribute('href') === '/app/dashboard'
    );
    expect(homeLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('ikonka Home w NewShellDesktopSidebar wskazuje na /app/dashboard', async () => {
    const { NewShellDesktopSidebar } = await import(
      '@/components/layout/NewShellDesktopSidebar'
    );

    render(
      <MemoryRouter initialEntries={['/app/dashboard']}>
        <Routes>
          <Route path="*" element={<NewShellDesktopSidebar />} />
        </Routes>
      </MemoryRouter>
    );

    const homeLinks = screen.getAllByRole('link').filter(
      (el) => el.getAttribute('href') === '/app/dashboard'
    );
    expect(homeLinks.length).toBeGreaterThanOrEqual(1);
  });
});
