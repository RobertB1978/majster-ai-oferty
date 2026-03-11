import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';

/**
 * Canonical Routing + Redirects Pack
 *
 * Tests verify that legacy/buggy routes redirect to canonical routes
 * and that the FINAL location.pathname is correct.
 *
 * Critical redirects:
 * - /app/jobs → /app/projects (legacy jobs → canonical projects)
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

// Mock JobsRedirect matching App.tsx implementation
function JobsRedirect({ suffix = '' }: { suffix?: string }) {
  const { id } = useParams();
  return <Navigate to={`/app/projects/${id}${suffix}`} replace />;
}

// Minimal route structure matching App.tsx redirects
function TestRouter({ initialPath }: { initialPath: string }) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        {/* Canonical routes */}
        <Route path="/app/dashboard" element={<LocationTracker label="Dashboard" />} />
        <Route path="/app/projects" element={<LocationTracker label="Projects" />} />
        <Route path="/app/projects/:id" element={<LocationTracker label="Project Detail" />} />
        <Route path="/app/projects/:id/quote" element={<LocationTracker label="Project Quote" />} />
        <Route path="/app/projects/:id/pdf" element={<LocationTracker label="Project PDF" />} />
        <Route path="/app/customers" element={<LocationTracker label="Customers" />} />

        {/* Legacy /app/jobs → /app/projects redirects */}
        <Route path="/app/jobs" element={<Navigate to="/app/projects" replace />} />
        <Route path="/app/jobs/new" element={<Navigate to="/app/projects/new" replace />} />
        <Route path="/app/jobs/:id" element={<JobsRedirect />} />
        <Route path="/app/jobs/:id/quote" element={<JobsRedirect suffix="/quote" />} />
        <Route path="/app/jobs/:id/pdf" element={<JobsRedirect suffix="/pdf" />} />

        {/* Other redirects */}
        <Route path="/app/clients" element={<Navigate to="/app/customers" replace />} />
        <Route path="/app/dash%20board" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/app/dash board" element={<Navigate to="/app/dashboard" replace />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Canonical Routing Redirects', () => {
  describe('/app/jobs → /app/projects (legacy redirect)', () => {
    it('should redirect /app/jobs to /app/projects and verify final pathname', async () => {
      render(<TestRouter initialPath="/app/jobs" />);

      await waitFor(() => {
        expect(screen.getByTestId('component-label')).toHaveTextContent('Projects');
        expect(screen.getByTestId('final-pathname')).toHaveTextContent('/app/projects');
      });
    });

    it('should redirect /app/jobs/:id to /app/projects/:id preserving param', async () => {
      render(<TestRouter initialPath="/app/jobs/abc-123" />);

      await waitFor(() => {
        expect(screen.getByTestId('component-label')).toHaveTextContent('Project Detail');
        expect(screen.getByTestId('final-pathname')).toHaveTextContent('/app/projects/abc-123');
      });
    });

    it('should redirect /app/jobs/:id/quote to /app/projects/:id/quote', async () => {
      render(<TestRouter initialPath="/app/jobs/abc-123/quote" />);

      await waitFor(() => {
        expect(screen.getByTestId('component-label')).toHaveTextContent('Project Quote');
        expect(screen.getByTestId('final-pathname')).toHaveTextContent('/app/projects/abc-123/quote');
      });
    });

    it('should redirect /app/jobs/:id/pdf to /app/projects/:id/pdf', async () => {
      render(<TestRouter initialPath="/app/jobs/abc-123/pdf" />);

      await waitFor(() => {
        expect(screen.getByTestId('component-label')).toHaveTextContent('Project PDF');
        expect(screen.getByTestId('final-pathname')).toHaveTextContent('/app/projects/abc-123/pdf');
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
      render(<TestRouter initialPath="/app/dash board" />);

      await waitFor(() => {
        expect(screen.getByTestId('component-label')).toHaveTextContent('Dashboard');
        expect(screen.getByTestId('final-pathname')).toHaveTextContent('/app/dashboard');
      });
    });
  });

  describe('Canonical routes remain stable (no redirect loops)', () => {
    it('should render /app/projects without redirect', async () => {
      render(<TestRouter initialPath="/app/projects" />);

      await waitFor(() => {
        expect(screen.getByTestId('component-label')).toHaveTextContent('Projects');
        expect(screen.getByTestId('final-pathname')).toHaveTextContent('/app/projects');
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
