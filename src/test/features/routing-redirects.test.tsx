import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';

/**
 * PR4: Canonical Routing + Redirects Pack
 *
 * Tests verify that legacy/buggy routes redirect to canonical routes
 * and that the FINAL location.pathname is correct.
 *
 * Critical redirects:
 * - /app/projects → /app/jobs
 * - /app/clients → /app/customers
 * - /app/dash%20board → /app/dashboard
 * - /app/dash board → /app/dashboard
 */

// Mock components to track final location
function LocationTracker({ label }: { label: string }) {
  const location = useLocation();
  return (
    <div>
      <div data-testid="component-label">{label}</div>
      <div data-testid="final-pathname">{location.pathname}</div>
    </div>
  );
}

// Mock ProjectRedirect matching App.tsx implementation
function ProjectRedirect({ suffix = '' }: { suffix?: string }) {
  const { id } = useParams();
  return <Navigate to={`/app/jobs/${id}${suffix}`} replace />;
}

// Minimal route structure matching App.tsx redirects
function TestRouter({ initialPath }: { initialPath: string }) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        {/* Canonical routes */}
        <Route path="/app/dashboard" element={<LocationTracker label="Dashboard" />} />
        <Route path="/app/jobs" element={<LocationTracker label="Jobs" />} />
        <Route path="/app/jobs/:id" element={<LocationTracker label="Job Detail" />} />
        <Route path="/app/customers" element={<LocationTracker label="Customers" />} />

        {/* Redirects - matching App.tsx:175-178 */}
        <Route path="/app/clients" element={<Navigate to="/app/customers" replace />} />
        <Route path="/app/projects" element={<Navigate to="/app/jobs" replace />} />
        <Route path="/app/projects/:id" element={<ProjectRedirect />} />
        <Route path="/app/dash%20board" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/app/dash board" element={<Navigate to="/app/dashboard" replace />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('PR4: Canonical Routing Redirects', () => {
  describe('/app/projects → /app/jobs', () => {
    it('should redirect /app/projects to /app/jobs and verify final pathname', async () => {
      render(<TestRouter initialPath="/app/projects" />);

      await waitFor(() => {
        expect(screen.getByTestId('component-label')).toHaveTextContent('Jobs');
        expect(screen.getByTestId('final-pathname')).toHaveTextContent('/app/jobs');
      });
    });

    it('should redirect /app/projects/:id to /app/jobs/:id preserving param', async () => {
      render(<TestRouter initialPath="/app/projects/abc-123" />);

      await waitFor(() => {
        expect(screen.getByTestId('component-label')).toHaveTextContent('Job Detail');
        expect(screen.getByTestId('final-pathname')).toHaveTextContent('/app/jobs/abc-123');
      });
    });
  });

  describe('/app/clients → /app/customers', () => {
    it('should redirect /app/clients to /app/customers and verify final pathname', async () => {
      render(<TestRouter initialPath="/app/clients" />);

      await waitFor(() => {
        expect(screen.getByTestId('component-label')).toHaveTextContent('Customers');
        expect(screen.getByTestId('final-pathname')).toHaveTextContent('/app/customers');
      });
    });
  });

  describe('Dashboard space/encoding variants → /app/dashboard', () => {
    it('should redirect /app/dash%20board to /app/dashboard and verify final pathname', async () => {
      render(<TestRouter initialPath="/app/dash%20board" />);

      await waitFor(() => {
        expect(screen.getByTestId('component-label')).toHaveTextContent('Dashboard');
        expect(screen.getByTestId('final-pathname')).toHaveTextContent('/app/dashboard');
      });
    });

    it('should redirect /app/dash board to /app/dashboard and verify final pathname', async () => {
      // Note: MemoryRouter normalizes spaces in path
      // This test verifies the Route declaration exists
      render(<TestRouter initialPath="/app/dash board" />);

      await waitFor(() => {
        expect(screen.getByTestId('component-label')).toHaveTextContent('Dashboard');
        expect(screen.getByTestId('final-pathname')).toHaveTextContent('/app/dashboard');
      });
    });
  });

  describe('Canonical routes remain stable (no redirect loops)', () => {
    it('should render /app/jobs without redirect', async () => {
      render(<TestRouter initialPath="/app/jobs" />);

      await waitFor(() => {
        expect(screen.getByTestId('component-label')).toHaveTextContent('Jobs');
        expect(screen.getByTestId('final-pathname')).toHaveTextContent('/app/jobs');
      });
    });

    it('should render /app/customers without redirect', async () => {
      render(<TestRouter initialPath="/app/customers" />);

      await waitFor(() => {
        expect(screen.getByTestId('component-label')).toHaveTextContent('Customers');
        expect(screen.getByTestId('final-pathname')).toHaveTextContent('/app/customers');
      });
    });

    it('should render /app/dashboard without redirect', async () => {
      render(<TestRouter initialPath="/app/dashboard" />);

      await waitFor(() => {
        expect(screen.getByTestId('component-label')).toHaveTextContent('Dashboard');
        expect(screen.getByTestId('final-pathname')).toHaveTextContent('/app/dashboard');
      });
    });
  });
});
