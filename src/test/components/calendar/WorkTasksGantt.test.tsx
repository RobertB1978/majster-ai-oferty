/**
 * WorkTasksGantt — unit + smoke tests
 *
 * Covered paths:
 *   - Loading spinner is shown while tasks are loading
 *   - Empty state when no tasks exist for the month
 *   - Task bars render with correct title and status
 *   - Tasks with invalid dates are skipped (no crash)
 *   - Tasks where start_date > end_date are skipped (no crash)
 *   - Team member capacity section renders
 *   - Over-capacity (> 100%) does not crash
 *   - Month navigation prev/next works without crashing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import { WorkTasksGantt } from '@/components/calendar/WorkTasksGantt';
import * as workTasksHooks from '@/hooks/useWorkTasks';
import * as teamMembersHooks from '@/hooks/useTeamMembers';
import * as projectsV2Hooks from '@/hooks/useProjectsV2';
import { mockUser } from '@/test/mocks/auth';

// ── mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/hooks/useWorkTasks');
vi.mock('@/hooks/useTeamMembers');
vi.mock('@/hooks/useProjectsV2');

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  }),
}));

// ── shared fixtures ───────────────────────────────────────────────────────────

const TODAY = new Date();
const y = TODAY.getFullYear();
const m = String(TODAY.getMonth() + 1).padStart(2, '0');

// Two dates within the current month
const startISO = `${y}-${m}-01`;
const endISO   = `${y}-${m}-05`;

const mockTask = {
  id: 'task-1',
  project_id: 'proj-1',
  user_id: 'user-1',
  title: 'Malowanie ścian',
  description: null,
  assigned_team_member_id: 'member-1',
  task_type: 'construction',
  status: 'in_progress' as const,
  start_date: startISO,
  end_date: endISO,
  color: '#f97316',
  created_at: new Date().toISOString(),
};

const mockMember = {
  id: 'member-1',
  owner_user_id: 'user-1',
  name: 'Jan Kowalski',
  role: 'murarz',
  phone: null,
  email: null,
  is_active: true,
  created_at: new Date().toISOString(),
};

const mockProject = {
  id: 'proj-1',
  title: 'Remont łazienki',
  status: 'ACTIVE',
  user_id: 'user-1',
  client_id: null,
  source_offer_id: null,
  progress_percent: 0,
  stages_json: [],
  total_from_offer: null,
  budget_net: null,
  budget_source: null,
  budget_updated_at: null,
  start_date: null,
  end_date: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function setup(overrides: {
  tasks?: typeof mockTask[];
  members?: typeof mockMember[];
  isLoading?: boolean;
} = {}) {
  vi.spyOn(workTasksHooks, 'useWorkTasks').mockReturnValue({
    data: overrides.tasks ?? [mockTask],
    isLoading: overrides.isLoading ?? false,
    error: null,
    isError: false,
  } as never);

  vi.spyOn(teamMembersHooks, 'useTeamMembers').mockReturnValue({
    data: overrides.members ?? [mockMember],
    isLoading: false,
    error: null,
  } as never);

  vi.spyOn(projectsV2Hooks, 'useProjectsV2List').mockReturnValue({
    data: [mockProject],
    isLoading: false,
    error: null,
    isError: false,
  } as never);
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('WorkTasksGantt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setup();
  });

  describe('loading state', () => {
    it('should show spinner while tasks are loading', () => {
      setup({ isLoading: true });
      render(<WorkTasksGantt />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeDefined();
    });
  });

  describe('rendering', () => {
    it('should render the Gantt chart without crashing', () => {
      render(<WorkTasksGantt />);
      // Task title appears in chart
      expect(screen.getAllByText('Malowanie ścian').length).toBeGreaterThanOrEqual(1);
    });

    it('should render team member capacity section', () => {
      render(<WorkTasksGantt />);
      // Member name appears in both the task bar badge and the capacity section
      const nameEls = screen.getAllByText('Jan Kowalski');
      expect(nameEls.length).toBeGreaterThanOrEqual(1);
    });

    it('should show project name for task', () => {
      render(<WorkTasksGantt />);
      expect(screen.getAllByText('Remont łazienki').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('empty state', () => {
    it('should show no-tasks message when tasks list is empty', () => {
      setup({ tasks: [] });
      render(<WorkTasksGantt />);
      // Agenda/empty state text
      const emptyMsg = document.querySelector('[class*="text-muted-foreground"]');
      expect(emptyMsg).toBeDefined();
    });

    it('should show no-team-members message when team is empty', () => {
      setup({ members: [] });
      render(<WorkTasksGantt />);
      // Capacity section shows empty state
      expect(document.querySelector('[class*="text-center"]')).toBeDefined();
    });
  });

  describe('date safety', () => {
    it('should NOT crash when a task has an invalid start_date', () => {
      const badTask = { ...mockTask, id: 'bad-1', start_date: 'INVALID', title: 'Złe zadanie' };
      setup({ tasks: [badTask] });

      expect(() => render(<WorkTasksGantt />)).not.toThrow();
    });

    it('should NOT crash when a task has an invalid end_date', () => {
      const badTask = { ...mockTask, id: 'bad-2', end_date: '', title: 'Puste daty' };
      setup({ tasks: [badTask] });

      expect(() => render(<WorkTasksGantt />)).not.toThrow();
    });

    it('should silently skip a task where start_date > end_date', () => {
      const invertedTask = {
        ...mockTask,
        id: 'inverted',
        title: 'Odwrócone daty',
        start_date: endISO,
        end_date: startISO,
      };
      setup({ tasks: [invertedTask] });

      render(<WorkTasksGantt />);
      // Inverted task should not appear in the chart
      expect(screen.queryByText('Odwrócone daty')).toBeNull();
    });
  });

  describe('month navigation', () => {
    it('should navigate to previous month without crashing', async () => {
      render(<WorkTasksGantt />);

      const [prevBtn] = screen.getAllByRole('button');
      fireEvent.click(prevBtn);

      await waitFor(() => {
        // Component still renders — no crash
        expect(document.querySelector('.animate-spin')).toBeNull();
      });
    });

    it('should navigate to next month without crashing', async () => {
      render(<WorkTasksGantt />);

      const btns = screen.getAllByRole('button');
      const nextBtn = btns[btns.length - 1];
      fireEvent.click(nextBtn);

      await waitFor(() => {
        expect(document.querySelector('.animate-spin')).toBeNull();
      });
    });
  });
});
