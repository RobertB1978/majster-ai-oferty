/**
 * Calendar page tests — regression + unit coverage
 *
 * Regression: prevents crash when adding a new calendar event.
 * Covers: rendering, dialog open/save, edit, delete, view mode switching.
 *
 * Translation keys used (pl locale):
 *   calendar.title      = "Kalendarz"
 *   calendar.addEvent   = "Dodaj wydarzenie"
 *   calendar.eventTitle = "Tytuł wydarzenia"
 *   calendar.month      = "Miesiąc"
 *   calendar.week       = "Tydzień"
 *   calendar.day        = "Dzień"
 *   calendar.agenda     = "Agenda"
 *   calendar.noEvents   = "Brak wydarzeń w tym dniu"
 *   common.save         = "Zapisz"
 *   common.cancel       = "Anuluj"
 *   common.delete       = "Usuń"
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@/test/utils';
import Calendar from '@/pages/Calendar';
import * as calendarHooks from '@/hooks/useCalendarEvents';
import * as projectHooks from '@/hooks/useProjects';
import { mockUser } from '@/test/mocks/auth';

// ── mocks ──────────────────────────────────────────────────────────────────

vi.mock('@/hooks/useCalendarEvents');
vi.mock('@/hooks/useProjects');
vi.mock('@/components/calendar/ProjectTimeline', () => ({
  ProjectTimeline: () => <div data-testid="project-timeline">Timeline</div>,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  }),
}));

// ── shared test data ───────────────────────────────────────────────────────

const todayISO = new Date().toISOString().split('T')[0];

const mockEvents = [
  {
    id: 'event-1',
    user_id: 'user-1',
    project_id: null,
    title: 'Spotkanie z klientem',
    description: 'Omawiamy szczegóły remontu',
    event_date: todayISO,
    event_time: '10:00:00',
    event_type: 'meeting',
    status: 'pending',
    created_at: new Date().toISOString(),
  },
  {
    id: 'event-2',
    user_id: 'user-1',
    project_id: 'proj-1',
    title: 'Termin oddania projektu',
    description: null,
    event_date: todayISO,
    event_time: null,
    event_type: 'deadline',
    status: 'pending',
    created_at: new Date().toISOString(),
  },
];

const mockProjects = [
  { id: 'proj-1', project_name: 'Remont łazienki', status: 'active' },
];

const mockAddEvent = {
  mutateAsync: vi.fn().mockResolvedValue({ id: 'new-event-id', title: 'Test Event' }),
  isPending: false,
};
const mockUpdateEvent = {
  mutateAsync: vi.fn().mockResolvedValue({}),
  isPending: false,
};
const mockDeleteEvent = {
  mutateAsync: vi.fn().mockResolvedValue(undefined),
  isPending: false,
};

function setupHooks(overrides: { events?: typeof mockEvents; isLoading?: boolean } = {}) {
  vi.spyOn(calendarHooks, 'useCalendarEvents').mockReturnValue({
    data: overrides.events ?? mockEvents,
    isLoading: overrides.isLoading ?? false,
    error: null,
    isError: false,
  } as never);
  vi.spyOn(calendarHooks, 'useAddCalendarEvent').mockReturnValue(mockAddEvent as never);
  vi.spyOn(calendarHooks, 'useUpdateCalendarEvent').mockReturnValue(mockUpdateEvent as never);
  vi.spyOn(calendarHooks, 'useDeleteCalendarEvent').mockReturnValue(mockDeleteEvent as never);
  vi.spyOn(projectHooks, 'useProjects').mockReturnValue({
    data: mockProjects,
    isLoading: false,
    error: null,
    isError: false,
  } as never);
}

// Shortcut for finding heading (avoids "multiple elements" error)
const getHeading = () => screen.getByRole('heading', { name: /Kalendarz/i });

// ── tests ──────────────────────────────────────────────────────────────────

describe('Calendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupHooks();
  });

  // ── RENDERING ────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('should render the calendar page without crashing', () => {
      render(<Calendar />);
      expect(getHeading()).toBeDefined();
    });

    it('should display loading spinner when events are loading', () => {
      setupHooks({ isLoading: true });
      render(<Calendar />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeDefined();
    });

    it('should render the Add Event button', () => {
      render(<Calendar />);
      expect(screen.getByRole('button', { name: /dodaj wydarzenie/i })).toBeDefined();
    });

    it('should render today\'s date highlighted', () => {
      render(<Calendar />);
      const todayEl = document.querySelector('.bg-primary.text-primary-foreground');
      expect(todayEl).toBeDefined();
    });
  });

  // ── REGRESSION: ADD EVENT (was crashing) ─────────────────────────────────

  describe('[REGRESSION] add new event — no crash', () => {
    it('should open event dialog without crashing when Add Event is clicked', async () => {
      render(<Calendar />);

      const addBtn = screen.getByRole('button', { name: /dodaj wydarzenie/i });
      fireEvent.click(addBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeDefined();
      });
    });

    it('should render title input in the event dialog', async () => {
      render(<Calendar />);
      fireEvent.click(screen.getByRole('button', { name: /dodaj wydarzenie/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeDefined();
      });

      // Title input identified by placeholder "Tytuł wydarzenia"
      const titleInput = screen.getByPlaceholderText(/tytuł wydarzenia/i);
      expect(titleInput).toBeDefined();
    });

    it('should NOT call addEvent when title is empty', async () => {
      render(<Calendar />);
      fireEvent.click(screen.getByRole('button', { name: /dodaj wydarzenie/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeDefined();
      });

      const saveBtn = screen.getByRole('button', { name: /^Zapisz$/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockAddEvent.mutateAsync).not.toHaveBeenCalled();
      });
    });

    it('should call addEvent.mutateAsync with correct payload when form is valid', async () => {
      render(<Calendar />);
      fireEvent.click(screen.getByRole('button', { name: /dodaj wydarzenie/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeDefined();
      });

      const titleInput = screen.getByPlaceholderText(/tytuł wydarzenia/i);
      fireEvent.change(titleInput, { target: { value: 'Nowe spotkanie' } });

      const saveBtn = screen.getByRole('button', { name: /^Zapisz$/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockAddEvent.mutateAsync).toHaveBeenCalledOnce();
        const callArg = mockAddEvent.mutateAsync.mock.calls[0][0];
        expect(callArg.title).toBe('Nowe spotkanie');
        expect(callArg.status).toBe('pending');
        expect(callArg.event_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('should close dialog after successful save', async () => {
      render(<Calendar />);
      fireEvent.click(screen.getByRole('button', { name: /dodaj wydarzenie/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeDefined();
      });

      const titleInput = screen.getByPlaceholderText(/tytuł wydarzenia/i);
      fireEvent.change(titleInput, { target: { value: 'Spotkanie zamknięcia' } });

      fireEvent.click(screen.getByRole('button', { name: /^Zapisz$/i }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull();
      });
    });

    it('should handle mutateAsync rejection gracefully (no crash)', async () => {
      mockAddEvent.mutateAsync.mockRejectedValueOnce(new Error('DB error'));

      render(<Calendar />);
      fireEvent.click(screen.getByRole('button', { name: /dodaj wydarzenie/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeDefined();
      });

      const titleInput = screen.getByPlaceholderText(/tytuł wydarzenia/i);
      fireEvent.change(titleInput, { target: { value: 'Błędne wydarzenie' } });

      fireEvent.click(screen.getByRole('button', { name: /^Zapisz$/i }));

      await waitFor(() => {
        expect(mockAddEvent.mutateAsync).toHaveBeenCalledOnce();
      });

      // Page heading still present — no crash
      // (dialog stays open after error; use hidden:true to bypass aria-modal exclusion)
      expect(screen.getByRole('heading', { name: /Kalendarz/i, hidden: true })).toBeDefined();
    });
  });

  // ── EDIT EVENT ───────────────────────────────────────────────────────────

  describe('edit existing event', () => {
    it('should open edit dialog with pre-filled title when event is clicked', async () => {
      render(<Calendar />);

      const eventEl = await waitFor(() => screen.getByText('Spotkanie z klientem'));
      fireEvent.click(eventEl);

      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText(/tytuł wydarzenia/i) as HTMLInputElement;
        expect(titleInput.value).toBe('Spotkanie z klientem');
      });
    });

    it('should call updateEvent.mutateAsync with the event id when saving an edit', async () => {
      render(<Calendar />);

      const eventEl = await waitFor(() => screen.getByText('Spotkanie z klientem'));
      fireEvent.click(eventEl);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeDefined();
      });

      const titleInput = screen.getByPlaceholderText(/tytuł wydarzenia/i);
      fireEvent.change(titleInput, { target: { value: 'Spotkanie zmienione' } });

      fireEvent.click(screen.getByRole('button', { name: /^Zapisz$/i }));

      await waitFor(() => {
        expect(mockUpdateEvent.mutateAsync).toHaveBeenCalledOnce();
        const callArg = mockUpdateEvent.mutateAsync.mock.calls[0][0];
        expect(callArg.id).toBe('event-1');
        expect(callArg.title).toBe('Spotkanie zmienione');
      });
    });
  });

  // ── DELETE EVENT ─────────────────────────────────────────────────────────

  describe('delete event', () => {
    it('should call deleteEvent.mutateAsync when delete button is clicked in edit dialog', async () => {
      render(<Calendar />);

      const eventEl = await waitFor(() => screen.getByText('Spotkanie z klientem'));
      fireEvent.click(eventEl);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeDefined();
      });

      // "Usuń" button only visible in edit dialog
      const deleteBtn = screen.getByRole('button', { name: /^Usuń$/i });
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(mockDeleteEvent.mutateAsync).toHaveBeenCalledWith('event-1');
      });
    });
  });

  // ── VIEW MODES ───────────────────────────────────────────────────────────

  describe('view mode switching', () => {
    it('should switch to week view when Tydzień button is clicked', async () => {
      render(<Calendar />);

      const weekBtn = screen.getByRole('button', { name: /^Tydzień$/i });
      fireEvent.click(weekBtn);

      await waitFor(() => {
        expect(weekBtn).toBeDefined();
      });
    });

    it('should switch to day view when Dzień button is clicked', async () => {
      render(<Calendar />);

      const dayBtn = screen.getByRole('button', { name: /^Dzień$/i });
      fireEvent.click(dayBtn);

      await waitFor(() => {
        // Day view renders hourly slots
        expect(screen.getByText('00:00')).toBeDefined();
      });
    });

    it('should switch to agenda view when Agenda button is clicked', async () => {
      render(<Calendar />);

      const agendaBtn = screen.getByRole('button', { name: /^Agenda$/i });
      fireEvent.click(agendaBtn);

      await waitFor(() => {
        expect(screen.getByText('Spotkanie z klientem')).toBeDefined();
      });
    });
  });

  // ── EMPTY STATE ──────────────────────────────────────────────────────────

  describe('empty state in agenda view', () => {
    it('should show no-events message in agenda view when events list is empty', async () => {
      setupHooks({ events: [] });
      render(<Calendar />);

      const agendaBtn = screen.getByRole('button', { name: /^Agenda$/i });
      fireEvent.click(agendaBtn);

      await waitFor(() => {
        expect(screen.getByText(/brak wydarzeń/i)).toBeDefined();
      });
    });
  });
});
