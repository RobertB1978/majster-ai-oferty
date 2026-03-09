import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
  format,
  startOfMonth, endOfMonth, eachDayOfInterval,
  addMonths, subMonths,
  startOfWeek, endOfWeek, addWeeks, subWeeks,
  addDays,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { uk } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import { useCalendarEvents, useAddCalendarEvent, useDeleteCalendarEvent, useUpdateCalendarEvent, CalendarEvent } from '@/hooks/useCalendarEvents';
import { useProjects } from '@/hooks/useProjects';
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
import { type ViewMode, type EventFormData, initialEventData } from '@/components/calendar/calendarTypes';

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
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: events = [], isLoading } = useCalendarEvents(
    format(calendarStart, 'yyyy-MM-dd'),
    format(calendarEnd, 'yyyy-MM-dd')
  );
  const { data: projects = [] } = useProjects();
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
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach(event => {
      const dateKey = event.event_date;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(event);
    });
    Object.keys(map).forEach(key => {
      map[key].sort((a, b) => {
        if (!a.event_time) return 1;
        if (!b.event_time) return -1;
        return a.event_time.localeCompare(b.event_time);
      });
    });
    return map;
  }, [events]);

  const handleNavigate = useCallback((direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
      setSelectedDate(new Date());
      return;
    }
    const multiplier = direction === 'prev' ? -1 : 1;
    switch (viewMode) {
      case 'month':
        setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
        break;
      case 'week':
        setCurrentDate(prev => direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1));
        break;
      case 'day':
        setCurrentDate(prev => addDays(prev, multiplier));
        setSelectedDate(prev => addDays(prev, multiplier));
        break;
    }
  }, [viewMode]);

  const openEventDialog = (date?: Date, event?: CalendarEvent) => {
    if (event) {
      setEditingEvent(event);
      setEventData({
        title: event.title,
        description: event.description || '',
        event_type: event.event_type,
        event_time: event.event_time?.slice(0, 5) || '',
        end_time: '',
        project_id: event.project_id || '',
      });
    } else {
      setEditingEvent(null);
      setEventData(initialEventData);
    }
    if (date) setSelectedDate(date);
    setIsEventDialogOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!eventData.title.trim()) {
      toast.error(t('errors.required'));
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
          project_id: eventData.project_id || null,
        });
      } else {
        await addEvent.mutateAsync({
          title: eventData.title,
          description: eventData.description,
          event_date: format(selectedDate, 'yyyy-MM-dd'),
          event_time: eventData.event_time || null,
          event_type: eventData.event_type,
          project_id: eventData.project_id || null,
          status: 'pending',
        });
      }
      setIsEventDialogOpen(false);
      setEventData(initialEventData);
      setEditingEvent(null);
      toast.success(editingEvent
        ? t('calendar.eventUpdated', 'Wydarzenie zaktualizowane')
        : t('calendar.eventAdded', 'Wydarzenie dodane'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('errors.generic', 'Wystąpił błąd');
      toast.error(t('calendar.eventSaveError', 'Nie udało się zapisać wydarzenia') + ': ' + message);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent.mutateAsync(eventId);
      toast.success(t('calendar.eventDeleted', 'Wydarzenie usunięte'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('errors.generic', 'Wystąpił błąd');
      toast.error(t('calendar.eventDeleteError', 'Nie udało się usunąć wydarzenia') + ': ' + message);
    }
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

  return (
    <>
      <Helmet>
        <title>{t('calendar.title')} | Majster.AI</title>
        <meta name="description" content={t('calendar.subtitle')} />
      </Helmet>

      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl flex items-center gap-3">
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
