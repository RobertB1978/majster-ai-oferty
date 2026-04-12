import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
  format, parseISO, isValid, isAfter, isBefore,
  startOfMonth, endOfMonth, eachDayOfInterval,
  addMonths, subMonths,
  startOfWeek, endOfWeek, addWeeks, subWeeks,
  addDays, addYears,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { uk } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import { useCalendarEvents, useAddCalendarEvent, useDeleteCalendarEvent, useUpdateCalendarEvent, CalendarEvent } from '@/hooks/useCalendarEvents';
import { useProjectsV2List } from '@/hooks/useProjectsV2';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarIcon, Plus, Loader2, GanttChart } from 'lucide-react';
import { toast } from 'sonner';
import { ProjectTimeline } from '@/components/calendar/ProjectTimeline';
import { CalendarMonthView } from '@/components/calendar/CalendarMonthView';
import { CalendarWeekView } from '@/components/calendar/CalendarWeekView';
import { CalendarDayView } from '@/components/calendar/CalendarDayView';
import { CalendarAgendaView } from '@/components/calendar/CalendarAgendaView';
import { CalendarEventDialog } from '@/components/calendar/CalendarEventDialog';
import { CalendarNavigationBar } from '@/components/calendar/CalendarNavigationBar';
import { type ViewMode, type EventFormData, type RecurrenceRule, initialEventData } from '@/components/calendar/calendarTypes';

function getDateLocale(lang: string): Locale {
  switch (lang) {
    case 'uk': return uk;
    case 'en': return enUS;
    default: return pl;
  }
}

export default function Calendar() {
  const { t, i18n } = useTranslation();
  const dateLocale = getDateLocale(i18n.language);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [eventData, setEventData] = useState<EventFormData>(initialEventData);
  const [activeTab, setActiveTab] = useState<'calendar' | 'timeline'>('calendar');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  // String keys for stable useMemo dependencies (Date objects are new refs every render)
  const calendarStartStr = format(calendarStart, 'yyyy-MM-dd');
  const calendarEndStr = format(calendarEnd, 'yyyy-MM-dd');
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: events = [], isLoading, isError } = useCalendarEvents(
    format(calendarStart, 'yyyy-MM-dd'),
    format(calendarEnd, 'yyyy-MM-dd')
  );
  // V2-aligned: reads from v2_projects (same canonical source as Dashboard / ProjectsList)
  const { data: v2Projects = [] } = useProjectsV2List();
  // Adapt V2 project shape { id, title } → CalendarEventDialog's expected { id, project_name }
  const projects = v2Projects.map((p) => ({ id: p.id, project_name: p.title }));
  const addEvent = useAddCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();

  const dayNames = [
    t('calendar.days.mon'),
    t('calendar.days.tue'),
    t('calendar.days.wed'),
    t('calendar.days.thu'),
    t('calendar.days.fri'),
    t('calendar.days.sat'),
    t('calendar.days.sun'),
  ];

  const eventsByDate = useMemo(() => {
    function nextRecurrenceDate(date: Date, rule: string): Date {
      switch (rule) {
        case 'daily':   return addDays(date, 1);
        case 'weekly':  return addWeeks(date, 1);
        case 'monthly': return addMonths(date, 1);
        case 'yearly':  return addYears(date, 1);
        default:        return date;
      }
    }

    const map: Record<string, CalendarEvent[]> = {};
    events.forEach(event => {
      // Base occurrence
      const baseKey = event.event_date;
      if (!map[baseKey]) map[baseKey] = [];
      map[baseKey].push(event);

      // Expand recurring instances within the current calendar range
      if (event.recurrence_rule && event.recurrence_rule !== 'none') {
        const baseDate = parseISO(event.event_date);
        if (!isValid(baseDate)) return; // skip events with corrupted/unparseable dates
        const parsedRecEnd = event.recurrence_end_date ? parseISO(event.recurrence_end_date) : null;
        const maxEnd = (parsedRecEnd && isValid(parsedRecEnd)) ? parsedRecEnd : calendarEnd;
        const effectiveEnd = isBefore(maxEnd, calendarEnd) ? maxEnd : calendarEnd;

        let next = nextRecurrenceDate(baseDate, event.recurrence_rule);
        let safety = 0;
        while (!isAfter(next, effectiveEnd) && safety < 500) {
          safety++;
          if (!isBefore(next, calendarStart)) {
            const dateKey = format(next, 'yyyy-MM-dd');
            if (!map[dateKey]) map[dateKey] = [];
            map[dateKey].push({ ...event, event_date: dateKey });
          }
          next = nextRecurrenceDate(next, event.recurrence_rule);
        }
      }
    });

    Object.keys(map).forEach(key => {
      map[key].sort((a, b) => {
        if (!a.event_time) return 1;
        if (!b.event_time) return -1;
        return a.event_time.localeCompare(b.event_time);
      });
    });
    return map;
  // calendarStartStr/EndStr are stable string deps — avoid Date object reference churn
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, calendarStartStr, calendarEndStr]);

  const handleNavigate = useCallback((direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
      setSelectedDate(new Date());
      return;
    }
    const delta = direction === 'prev' ? -1 : 1;
    switch (viewMode) {
      case 'month':
      case 'agenda':
        setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
        break;
      case 'week':
        setCurrentDate(prev => direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1));
        break;
      case 'day':
        setCurrentDate(prev => addDays(prev, delta));
        setSelectedDate(prev => addDays(prev, delta));
        break;
    }
  }, [viewMode]);

  const openEventDialog = (date?: Date, event?: CalendarEvent, prefilledTime?: string) => {
    if (event) {
      // For recurring virtual instances, always edit the base event (same id)
      setEditingEvent(event);
      setEventData({
        title: event.title,
        description: event.description || '',
        event_type: event.event_type,
        event_time: event.event_time?.slice(0, 5) || '',
        end_time: event.end_time?.slice(0, 5) || '',
        project_id: event.project_id || '',
        status: event.status || 'pending',
        recurrence_rule: (event.recurrence_rule as RecurrenceRule) || 'none',
        recurrence_end_date: event.recurrence_end_date || '',
      });
    } else {
      setEditingEvent(null);
      setEventData({ ...initialEventData, event_time: prefilledTime || '' });
    }
    if (date) setSelectedDate(date);
    setIsEventDialogOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!eventData.title.trim()) {
      toast.error(t('errors.required'));
      return;
    }
    if (eventData.event_time && eventData.end_time && eventData.end_time <= eventData.event_time) {
      toast.error(t('calendar.endTimeBeforeStart'));
      return;
    }
    try {
      if (editingEvent) {
        await updateEvent.mutateAsync({
          id: editingEvent.id,
          title: eventData.title,
          description: eventData.description,
          event_type: eventData.event_type,
          event_time: eventData.event_time || null,
          end_time: eventData.end_time || null,
          project_id: eventData.project_id || null,
          status: eventData.status,
          recurrence_rule: eventData.recurrence_rule,
          recurrence_end_date: eventData.recurrence_end_date || null,
        });
      } else {
        await addEvent.mutateAsync({
          title: eventData.title,
          description: eventData.description,
          event_date: format(selectedDate, 'yyyy-MM-dd'),
          event_time: eventData.event_time || null,
          end_time: eventData.end_time || null,
          event_type: eventData.event_type,
          project_id: eventData.project_id || null,
          status: eventData.status,
          recurrence_rule: eventData.recurrence_rule,
          recurrence_end_date: eventData.recurrence_end_date || null,
        });
      }
      setIsEventDialogOpen(false);
      setEventData(initialEventData);
      setEditingEvent(null);
      // Toast is shown by the mutation hook's onSuccess — no duplicate here
    } catch {
      // Toast is shown by the mutation hook's onError — no duplicate here
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    await deleteEvent.mutateAsync(eventId);
    // Toast is shown by the mutation hook's onSuccess/onError
  };

  const getNavigationTitle = () => {
    switch (viewMode) {
      case 'month':
        return format(currentDate, 'LLLL yyyy', { locale: dateLocale });
      case 'week':
        return `${format(weekStart, 'd MMM', { locale: dateLocale })} - ${format(weekEnd, 'd MMM yyyy', { locale: dateLocale })}`;
      case 'day':
        return format(selectedDate, 'EEEE, d MMMM yyyy', { locale: dateLocale });
      case 'agenda':
        return t('calendar.agenda');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-center px-4">
        <CalendarIcon className="h-12 w-12 text-muted-foreground/50" />
        <p className="text-muted-foreground font-medium">
          {t('calendar.loadError')}
        </p>
        <p className="text-sm text-muted-foreground">
          {t('calendar.loadErrorHint')}
        </p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('calendar.title')} | Majster.AI</title>
        <meta name="description" content={t('calendar.subtitle')} />
      </Helmet>

      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl flex items-center gap-3 type-title">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
                <CalendarIcon className="h-5 w-5 text-primary-foreground" />
              </div>
              {t('calendar.title')}
            </h1>
            <p className="text-muted-foreground mt-1">{t('calendar.subtitle')}</p>
          </div>
          <Button
            onClick={() => openEventDialog(selectedDate)}
            size="lg"
            className="shadow-sm bg-primary hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('calendar.addEvent')}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'calendar' | 'timeline')}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="calendar" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <CalendarIcon className="h-4 w-4" />
              {t('calendar.title')}
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <GanttChart className="h-4 w-4" />
              {t('calendar.timeline')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-4 space-y-4">
            <CalendarNavigationBar
              viewMode={viewMode}
              setViewMode={setViewMode}
              navigationTitle={getNavigationTitle()}
              onNavigate={handleNavigate}
            />

            {viewMode === 'month' && (
              <CalendarMonthView
                calendarDays={calendarDays}
                dayNames={dayNames}
                eventsByDate={eventsByDate}
                selectedDate={selectedDate}
                currentDate={currentDate}
                isLoading={isLoading}
                events={events}
                setSelectedDate={setSelectedDate}
                openEventDialog={openEventDialog}
                dateLocale={dateLocale}
              />
            )}
            {viewMode === 'week' && (
              <CalendarWeekView
                weekDays={weekDays}
                eventsByDate={eventsByDate}
                openEventDialog={openEventDialog}
                dateLocale={dateLocale}
              />
            )}
            {viewMode === 'day' && (
              <CalendarDayView
                selectedDate={selectedDate}
                eventsByDate={eventsByDate}
                openEventDialog={openEventDialog}
                dateLocale={dateLocale}
              />
            )}
            {viewMode === 'agenda' && (
              <CalendarAgendaView
                eventsByDate={eventsByDate}
                openEventDialog={openEventDialog}
                dateLocale={dateLocale}
              />
            )}
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <ProjectTimeline currentMonth={currentDate} onMonthChange={setCurrentDate} />
          </TabsContent>
        </Tabs>

        <CalendarEventDialog
          isOpen={isEventDialogOpen}
          onOpenChange={setIsEventDialogOpen}
          editingEvent={editingEvent}
          eventData={eventData}
          setEventData={setEventData}
          selectedDate={selectedDate}
          projects={projects}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          isSaving={addEvent.isPending || updateEvent.isPending}
        />
      </div>
    </>
  );
}
