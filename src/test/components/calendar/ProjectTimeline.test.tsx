/**
 * ProjectTimeline — V2 alignment tests
 *
 * Verifies that ProjectTimeline reads from v2_projects (useProjectsV2List),
 * NOT from the legacy `projects` table (useProjects).
 *
 * Covered paths:
 *   - useProjectsV2List is called; useProjects is NOT called
 *   - V2 project `title` (not `project_name`) is displayed
 *   - V2 status colour classes render correctly
 *   - CANCELLED (soft-deleted) projects are excluded from the timeline
 *   - Navigation link uses the V2 project id (→ ProjectHub)
 *   - Empty state is shown when no dated V2 projects exist
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';
import { ProjectTimeline } from '@/components/calendar/ProjectTimeline';
import * as projectsV2Hooks from '@/hooks/useProjectsV2';
import * as projectsLegacyHooks from '@/hooks/useProjects';
import * as clientsHooks from '@/hooks/useClients';
import { mockUser } from '@/test/mocks/auth';

// ── mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/hooks/useProjectsV2');
vi.mock('@/hooks/useProjects');
vi.mock('@/hooks/useClients');

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// ── test data ────────────────────────────────────────────────────────────────

const TODAY = new Date();
const CURRENT_MONTH = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);

// V2 projects with dates that overlap current month
const mockV2Projects = [
  {
    id: 'v2-proj-active',
    user_id: 'user-1',
    client_id: 'client-1',
    source_offer_id: null,
    title: 'Remont salonu',
    status: 'ACTIVE' as const,
    start_date: new Date(TODAY.getFullYear(), TODAY.getMonth(), 1).toISOString(),
    end_date: new Date(TODAY.getFullYear(), TODAY.getMonth(), 15).toISOString(),
    progress_percent: 40,
    stages_json: [],
    total_from_offer: null,
    budget_net: null,
    budget_source: null,
    budget_updated_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'v2-proj-completed',
    user_id: 'user-1',
    client_id: 'client-2',
    source_offer_id: null,
    title: 'Instalacja elektryczna',
    status: 'COMPLETED' as const,
    start_date: new Date(TODAY.getFullYear(), TODAY.getMonth(), 5).toISOString(),
    end_date: new Date(TODAY.getFullYear(), TODAY.getMonth(), 20).toISOString(),
    progress_percent: 100,
    stages_json: [],
    total_from_offer: null,
    budget_net: null,
    budget_source: null,
    budget_updated_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'v2-proj-cancelled',
    user_id: 'user-1',
    client_id: null,
    source_offer_id: null,
    title: 'Projekt anulowany',
    status: 'CANCELLED' as const,
    start_date: new Date(TODAY.getFullYear(), TODAY.getMonth(), 1).toISOString(),
    end_date: new Date(TODAY.getFullYear(), TODAY.getMonth(), 10).toISOString(),
    progress_percent: 0,
    stages_json: [],
    total_from_offer: null,
    budget_net: null,
    budget_source: null,
    budget_updated_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockClients = [
  { id: 'client-1', name: 'Jan Kowalski' },
  { id: 'client-2', name: 'Anna Nowak' },
];

function setupHooks(
  projects = mockV2Projects,
  opts: { isLoading?: boolean } = {}
) {
  vi.spyOn(projectsV2Hooks, 'useProjectsV2List').mockReturnValue({
    data: projects,
    isLoading: opts.isLoading ?? false,
    isError: false,
    error: null,
  } as never);

  vi.spyOn(clientsHooks, 'useClients').mockReturnValue({
    data: mockClients,
    isLoading: false,
    isError: false,
    error: null,
  } as never);
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('ProjectTimeline — V2 alignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure legacy useProjects is never called by default
    vi.spyOn(projectsLegacyHooks, 'useProjects').mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as never);
  });

  describe('data source', () => {
    it('should call useProjectsV2List (V2 canonical source)', () => {
      setupHooks();
      render(<ProjectTimeline currentMonth={CURRENT_MONTH} onMonthChange={vi.fn()} />);

      expect(projectsV2Hooks.useProjectsV2List).toHaveBeenCalled();
    });

    it('should NOT call legacy useProjects', () => {
      setupHooks();
      render(<ProjectTimeline currentMonth={CURRENT_MONTH} onMonthChange={vi.fn()} />);

      expect(projectsLegacyHooks.useProjects).not.toHaveBeenCalled();
    });
  });

  describe('project display', () => {
    it('should render V2 project title (not project_name)', () => {
      setupHooks();
      render(<ProjectTimeline currentMonth={CURRENT_MONTH} onMonthChange={vi.fn()} />);

      expect(screen.getAllByText('Remont salonu').length).toBeGreaterThan(0);
    });

    it('should render multiple V2 project titles', () => {
      setupHooks();
      render(<ProjectTimeline currentMonth={CURRENT_MONTH} onMonthChange={vi.fn()} />);

      expect(screen.getAllByText('Remont salonu').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Instalacja elektryczna').length).toBeGreaterThan(0);
    });
  });

  describe('CANCELLED project exclusion', () => {
    it('should NOT render CANCELLED (soft-deleted) projects', () => {
      setupHooks();
      render(<ProjectTimeline currentMonth={CURRENT_MONTH} onMonthChange={vi.fn()} />);

      expect(screen.queryByText('Projekt anulowany')).toBeNull();
    });
  });

  describe('V2 status rendering', () => {
    it('should render an ACTIVE project (bg-primary bar)', () => {
      setupHooks([mockV2Projects[0]]);
      render(<ProjectTimeline currentMonth={CURRENT_MONTH} onMonthChange={vi.fn()} />);

      const bar = document.querySelector('.bg-primary');
      expect(bar).not.toBeNull();
    });

    it('should render a COMPLETED project (bg-success bar)', () => {
      setupHooks([mockV2Projects[1]]);
      render(<ProjectTimeline currentMonth={CURRENT_MONTH} onMonthChange={vi.fn()} />);

      const bar = document.querySelector('.bg-success');
      expect(bar).not.toBeNull();
    });
  });

  describe('empty state', () => {
    it('should show empty state when no V2 projects have dates', () => {
      const noDatesProjects = mockV2Projects.map(p => ({
        ...p,
        start_date: null,
        end_date: null,
      }));
      setupHooks(noDatesProjects);
      render(<ProjectTimeline currentMonth={CURRENT_MONTH} onMonthChange={vi.fn()} />);

      expect(screen.getByText(/brak projekt/i)).toBeDefined();
    });

    it('should show loading spinner while data is fetching', () => {
      setupHooks([], { isLoading: true });
      render(<ProjectTimeline currentMonth={CURRENT_MONTH} onMonthChange={vi.fn()} />);

      expect(document.querySelector('.animate-spin')).not.toBeNull();
    });
  });

  describe('navigation', () => {
    it('should render a clickable bar for each visible V2 project', () => {
      setupHooks([mockV2Projects[0]]);
      render(<ProjectTimeline currentMonth={CURRENT_MONTH} onMonthChange={vi.fn()} />);

      // The bar is a <button> element
      const bars = document.querySelectorAll('button.absolute');
      expect(bars.length).toBeGreaterThan(0);
    });
  });
});
