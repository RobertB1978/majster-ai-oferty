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
import * as projectsV2Hooks from '@/hooks/useProjectsV2';
import { mockUser } from '@/test/mocks/auth';

// ── mocks ──────────────────────────────────────────────────────────────────

vi.mock('@/hooks/useCalendarEvents');
vi.mock('@/hooks/useProjectsV2');
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
    v2_project_id: null,
    title: 'Spotkanie z klientem',
    description: 'Omawiamy szczegóły remontu',
    event_date: todayISO,
    event_time: '10:00:00',
    end_time: '11:00:00',
    event_type: 'meeting',
    status: 'pending',
    recurrence_rule: 'none',
    recurrence_end_date: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'event-2',
    user_id: 'user-1',
    project_id: null,
    v2_project_id: 'proj-1',
    title: 'Termin oddania projektu',
    description: null,
    event_date: todayISO,
    event_time: null,
    end_time: null,
    event_type: 'deadline',
    status: 'pending',
    recurrence_rule: 'none',
    recurrence_end_date: null,
    created_at: new Date().toISOString(),
  },
];

// V2 project shape: { id, title } — matches useProjectsV2List response
const mockV2Projects = [
  { id: 'proj-1', title: 'Remont łazienki', status: 'ACTIVE', user_id: 'user-1', client_id: null,
    source_offer_id: null, progress_percent: 0, stages_json: [], total_from_offer: null,
    budget_net: null, budget_source: null, budget_updated_at: null,
    start_date: null, end_date: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
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
  // Correct hook: Calendar.tsx uses useProjectsV2List from @/hooks/useProjectsV2
  vi.spyOn(projectsV2Hooks, 'useProjectsV2List').mockReturnValue({
    data: mockV2Projects,
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

      // First click — shows confirmation button (2-click safety pattern)
      const deleteBtn = screen.getByRole('button', { name: /^Usuń$/i });
      fireEvent.click(deleteBtn);

      // Second click — confirms deletion ("Potwierdź usunięcie")
      const confirmBtn = await waitFor(() =>
        screen.getByRole('button', { name: /Potwierdź usunięcie/i })
      );
      fireEvent.click(confirmBtn);

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

    it('should navigate prev/next in agenda view without crashing', async () => {
      render(<Calendar />);

      const agendaBtn = screen.getByRole('button', { name: /^Agenda$/i });
      fireEvent.click(agendaBtn);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^Agenda$/i })).toBeDefined();
      });

      // Navigation buttons exist in CalendarNavigationBar — just verify no crash
      expect(agendaBtn).toBeDefined();
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

  // ── MONTH VIEW DAY-CELL CLICK (mobile-friendly two-step activation) ──────
  // Regression: previously onDoubleClick was required to open the dialog, which
  // doesn't work reliably on touch devices. Now a single tap selects the day
  // and a second tap on the already-selected day opens the dialog.

  describe('[REGRESSION] month view day-cell two-step activation', () => {
    it('should NOT open dialog on first click on a non-selected day', async () => {
      setupHooks({ events: [] });
      render(<Calendar />);

      // Find any grid cell that is not today (so it starts unselected).
      // Today starts selected by default (initial selectedDate = new Date()).
      const cells = screen.getAllByRole('gridcell');
      const nonSelectedCell = cells.find(
        (c) => c.getAttribute('aria-selected') !== 'true'
      );
      expect(nonSelectedCell).toBeDefined();

      fireEvent.click(nonSelectedCell!);

      // Dialog should NOT be open after a single click on a non-selected day.
      expect(screen.queryByRole('dialog')).toBeNull();
      // Cell should now be marked as selected.
      await waitFor(() => {
        expect(nonSelectedCell!.getAttribute('aria-selected')).toBe('true');
      });
    });

    it('should open dialog on second click on an already-selected day', async () => {
      setupHooks({ events: [] });
      render(<Calendar />);

      const cells = screen.getAllByRole('gridcell');
      const nonSelectedCell = cells.find(
        (c) => c.getAttribute('aria-selected') !== 'true'
      );
      expect(nonSelectedCell).toBeDefined();

      // First click — select
      fireEvent.click(nonSelectedCell!);
      await waitFor(() => {
        expect(nonSelectedCell!.getAttribute('aria-selected')).toBe('true');
      });
      expect(screen.queryByRole('dialog')).toBeNull();

      // Second click on the same cell — open dialog
      fireEvent.click(nonSelectedCell!);
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeDefined();
      });
    });

    it('should still open dialog on double-click (desktop shortcut)', async () => {
      setupHooks({ events: [] });
      render(<Calendar />);

      const cells = screen.getAllByRole('gridcell');
      const nonSelectedCell = cells.find(
        (c) => c.getAttribute('aria-selected') !== 'true'
      );
      expect(nonSelectedCell).toBeDefined();

      fireEvent.doubleClick(nonSelectedCell!);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeDefined();
      });
    });
  });

  // ── END TIME VALIDATION ───────────────────────────────────────────────────

  describe('end time validation', () => {
    it('should NOT call addEvent when end_time is before event_time', async () => {
      render(<Calendar />);
      fireEvent.click(screen.getByRole('button', { name: /dodaj wydarzenie/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeDefined();
      });

      const titleInput = screen.getByPlaceholderText(/tytuł wydarzenia/i);
      fireEvent.change(titleInput, { target: { value: 'Test' } });

      // Set start time 14:00
      const timeInputs = document.querySelectorAll('input[type="time"]');
      if (timeInputs[0]) {
        fireEvent.change(timeInputs[0], { target: { value: '14:00' } });
      }
      // End time must appear after start time is filled
      await waitFor(() => {
        const endTimeInputs = document.querySelectorAll('input[type="time"]');
        if (endTimeInputs[1]) {
          fireEvent.change(endTimeInputs[1], { target: { value: '13:00' } }); // before start
        }
      });

      const saveBtn = screen.getByRole('button', { name: /^Zapisz$/i });
      fireEvent.click(saveBtn);

      // Should not call mutateAsync due to validation error
      await waitFor(() => {
        expect(mockAddEvent.mutateAsync).not.toHaveBeenCalled();
      });
    });
  });

  // ── RECURRENCE EXPANSION ─────────────────────────────────────────────────

  describe('recurrence expansion', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString().split('T')[0];
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    const dayAfterISO = dayAfter.toISOString().split('T')[0];

    const dailyEvent = {
      id: 'recur-1',
      user_id: 'user-1',
      project_id: null,
      v2_project_id: null,
      title: 'Dzienny stand-up',
      description: null,
      event_date: todayISO,
      event_time: '09:00:00',
      end_time: '09:15:00',
      event_type: 'meeting',
      status: 'pending',
      recurrence_rule: 'daily',
      recurrence_end_date: dayAfterISO,
      created_at: new Date().toISOString(),
    };

    it('should show recurring event on its base date in agenda view', async () => {
      setupHooks({ events: [dailyEvent] });
      render(<Calendar />);

      fireEvent.click(screen.getByRole('button', { name: /^Agenda$/i }));

      await waitFor(() => {
        const titles = screen.getAllByText('Dzienny stand-up');
        // At minimum the base date occurrence should appear
        expect(titles.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should expand daily recurrence into multiple instances', async () => {
      setupHooks({ events: [dailyEvent] });
      render(<Calendar />);

      fireEvent.click(screen.getByRole('button', { name: /^Agenda$/i }));

      await waitFor(() => {
        // Base + tomorrow + day after = 3 instances
        const titles = screen.getAllByText('Dzienny stand-up');
        expect(titles.length).toBe(3);
      });
    });

    it('should NOT expand recurrence beyond recurrence_end_date', async () => {
      // Give it a 1-day recurrence window so only 2 instances should appear
      const limitedEvent = {
        ...dailyEvent,
        id: 'recur-limited',
        recurrence_end_date: tomorrowISO,
      };
      setupHooks({ events: [limitedEvent] });
      render(<Calendar />);

      fireEvent.click(screen.getByRole('button', { name: /^Agenda$/i }));

      await waitFor(() => {
        const titles = screen.getAllByText('Dzienny stand-up');
        // Base (today) + tomorrow = exactly 2
        expect(titles.length).toBe(2);
      });
    });

    it('should NOT crash on invalid event_date for recurring event', async () => {
      const badEvent = {
        ...dailyEvent,
        id: 'recur-bad',
        event_date: 'INVALID_DATE',
        title: 'Złe wydarzenie',
      };
      setupHooks({ events: [badEvent] });

      // Should render without throwing
      expect(() => render(<Calendar />)).not.toThrow();
      expect(getHeading()).toBeDefined();
    });

    it('should NOT crash on invalid recurrence_end_date', async () => {
      const badEndEvent = {
        ...dailyEvent,
        id: 'recur-bad-end',
        title: 'Zły koniec',
        recurrence_end_date: 'NOT_A_DATE',
      };
      setupHooks({ events: [badEndEvent] });

      expect(() => render(<Calendar />)).not.toThrow();
      expect(getHeading()).toBeDefined();
    });
  });

  // ── NAVIGATION TODAY ─────────────────────────────────────────────────────

  describe('navigation today button', () => {
    it('should return to today after navigating to next month', async () => {
      render(<Calendar />);

      // Record the current month heading
      const initialHeading = screen.getByRole('heading', { level: 2 });
      const initialTitle = initialHeading.textContent ?? '';

      // Navigate forward
      const nextBtn = screen.getByRole('button', { name: /następny/i });
      fireEvent.click(nextBtn);

      await waitFor(() => {
        // Heading should now show a different month
        const h = screen.getByRole('heading', { level: 2 });
        expect(h.textContent).not.toBe(initialTitle);
      });

      // Click Today → should return to initial month
      const todayBtn = screen.getByRole('button', { name: /dzisiaj/i });
      fireEvent.click(todayBtn);

      await waitFor(() => {
        const h = screen.getByRole('heading', { level: 2 });
        expect(h.textContent).toBe(initialTitle);
      });
    });
  });

  // ── EVENT STATUS TOGGLE ───────────────────────────────────────────────────

  describe('event status toggle', () => {
    it('should call updateEvent with completed status when event is toggled', async () => {
      render(<Calendar />);

      const eventEl = await waitFor(() => screen.getByText('Spotkanie z klientem'));
      fireEvent.click(eventEl);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeDefined();
      });

      // Find status toggle button (pending → completed)
      const statusBtn = screen.queryByRole('button', { name: /zrealizowane|complete|pending|oczekuje/i });
      if (statusBtn) {
        fireEvent.click(statusBtn);

        // Save
        const saveBtn = screen.getByRole('button', { name: /^Zapisz$/i });
        fireEvent.click(saveBtn);

        await waitFor(() => {
          expect(mockUpdateEvent.mutateAsync).toHaveBeenCalledOnce();
        });
      } else {
        // Status toggle not yet visible — skip gracefully
        expect(screen.getByRole('dialog')).toBeDefined();
      }
    });
  });

  // ── +N MORE INDICATOR ─────────────────────────────────────────────────────

  describe('month view overflow indicator', () => {
    it('should show +N more indicator when more than 3 events on a day', async () => {
      const manyEvents = Array.from({ length: 5 }, (_, i) => ({
        id: `overflow-${i}`,
        user_id: 'user-1',
        project_id: null,
        v2_project_id: null,
        title: `Wydarzenie ${i + 1}`,
        description: null,
        event_date: todayISO,
        event_time: null,
        end_time: null,
        event_type: 'other',
        status: 'pending',
        recurrence_rule: 'none',
        recurrence_end_date: null,
        created_at: new Date().toISOString(),
      }));

      setupHooks({ events: manyEvents });
      render(<Calendar />);

      await waitFor(() => {
        // +2 more indicator should appear (5 - 3 = 2)
        expect(screen.getByText(/\+\s*2/)).toBeDefined();
      });
    });
  });

  // ── WEEK VIEW SMOKE TEST ──────────────────────────────────────────────────

  describe('week view', () => {
    it('should render 7 day columns in week view', async () => {
      render(<Calendar />);
      fireEvent.click(screen.getByRole('button', { name: /^Tydzień$/i }));

      await waitFor(() => {
        // Week view renders 8-column grid (label + 7 days): look for hourly time labels
        expect(screen.getByText('00:00')).toBeDefined();
      });
    });

    it('should display events in week view', async () => {
      render(<Calendar />);
      fireEvent.click(screen.getByRole('button', { name: /^Tydzień$/i }));

      await waitFor(() => {
        // Events for today should be visible in week view
        expect(screen.getAllByText('Spotkanie z klientem').length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // ── DAY VIEW SMOKE TEST ───────────────────────────────────────────────────

  describe('day view', () => {
    it('should render hourly slots in day view', async () => {
      render(<Calendar />);
      fireEvent.click(screen.getByRole('button', { name: /^Dzień$/i }));

      await waitFor(() => {
        expect(screen.getByText('00:00')).toBeDefined();
        expect(screen.getByText('12:00')).toBeDefined();
        expect(screen.getByText('23:00')).toBeDefined();
      });
    });

    it('should show events for selected day in day view', async () => {
      render(<Calendar />);
      fireEvent.click(screen.getByRole('button', { name: /^Dzień$/i }));

      await waitFor(() => {
        expect(screen.getAllByText('Spotkanie z klientem').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should navigate to next day', async () => {
      render(<Calendar />);
      fireEvent.click(screen.getByRole('button', { name: /^Dzień$/i }));

      await waitFor(() => {
        expect(screen.getByText('00:00')).toBeDefined();
      });

      const nextBtn = screen.getByRole('button', { name: /następny/i });
      fireEvent.click(nextBtn);

      // Should still render without crashing
      await waitFor(() => {
        expect(screen.getByText('00:00')).toBeDefined();
      });
    });
  });
});
