import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, isToday } from 'date-fns';
import { pl } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { uk } from 'date-fns/locale';
import { useCalendarEvents, useAddCalendarEvent, useDeleteCalendarEvent, useUpdateCalendarEvent, CalendarEvent } from '@/hooks/useCalendarEvents';
import { useProjects } from '@/hooks/useProjects';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalendarIcon, Loader2, GanttChart, LayoutGrid, List, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProjectTimeline } from '@/components/calendar/ProjectTimeline';
import { toast } from 'sonner';

const eventTypeColors: Record<string, { bg: string; dot: string; border: string }> = {
  deadline: { bg: 'bg-red-500/10', dot: 'bg-red-500', border: 'border-red-500/30' },
  meeting: { bg: 'bg-blue-500/10', dot: 'bg-blue-500', border: 'border-blue-500/30' },
  reminder: { bg: 'bg-amber-500/10', dot: 'bg-amber-500', border: 'border-amber-500/30' },
  other: { bg: 'bg-gray-500/10', dot: 'bg-gray-500', border: 'border-gray-500/30' },
};

type ViewMode = 'month' | 'week' | 'day' | 'agenda';

interface EventFormData {
  title: string;
  description: string;
  event_type: string;
  event_time: string;
  end_time: string;
  project_id: string;
}

const initialEventData: EventFormData = {
  title: '',
  description: '',
  event_type: 'deadline',
  event_time: '',
  end_time: '',
  project_id: '',
};

const getDateLocale = (lang: string) => {
  switch (lang) {
    case 'uk': return uk;
    case 'en': return enUS;
    default: return pl;
  }
};

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
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent.mutateAsync(eventId);
    } catch (error) {
      // Toast already handled by mutation's onError, but prevents unhandled rejection warnings
      console.error('Delete event error:', error);
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

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const renderMonthView = () => (
    <div className="bg-card rounded-xl border overflow-hidden">
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {dayNames.map(day => (
          <div key={day} className="px-2 py-3 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {calendarDays.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDate[dateKey] || [];
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const isCurrentMonth = isSameMonth(day, currentDate);

          return (
            <div
              key={dateKey}
              onClick={() => setSelectedDate(day)}
              onDoubleClick={() => openEventDialog(day)}
              className={cn(
                'min-h-[100px] sm:min-h-[120px] p-1 sm:p-2 border-r border-b cursor-pointer transition-colors',
                'last:border-r-0 hover:bg-accent/50',
                isSelected && 'bg-primary/5 ring-2 ring-primary ring-inset',
                !isCurrentMonth && 'bg-muted/20'
              )}
            >
              <div className={cn(
                'flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium mb-1',
                isTodayDate && 'bg-primary text-primary-foreground',
                !isCurrentMonth && 'text-muted-foreground'
              )}>
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5 overflow-hidden">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => { e.stopPropagation(); openEventDialog(day, event); }}
                    className={cn(
                      'text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity',
                      eventTypeColors[event.event_type]?.bg || eventTypeColors.other.bg,
                      'border',
                      eventTypeColors[event.event_type]?.border || eventTypeColors.other.border
                    )}
                  >
                    {event.event_time && (
                      <span className="font-medium mr-1">{event.event_time.slice(0, 5)}</span>
                    )}
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground px-1.5">
                    +{dayEvents.length - 3} {t('common.more')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderWeekView = () => (
    <div className="bg-card rounded-xl border overflow-hidden">
      <div className="grid grid-cols-8 border-b bg-muted/30">
        <div className="px-2 py-3 text-center text-xs font-medium text-muted-foreground border-r" />
        {weekDays.map(day => {
          const isTodayDate = isToday(day);
          return (
            <div key={day.toISOString()} className="px-2 py-3 text-center border-r last:border-r-0">
              <div className="text-xs text-muted-foreground">{format(day, 'EEE', { locale: dateLocale })}</div>
              <div className={cn(
                'text-lg font-semibold mt-1 w-8 h-8 mx-auto flex items-center justify-center rounded-full',
                isTodayDate && 'bg-primary text-primary-foreground'
              )}>
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>
      <div className="max-h-[600px] overflow-y-auto">
        {hours.map(hour => (
          <div key={hour} className="grid grid-cols-8 border-b min-h-[60px]">
            <div className="px-2 py-1 text-xs text-muted-foreground border-r text-right">
              {hour.toString().padStart(2, '0')}:00
            </div>
            {weekDays.map(day => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayEvents = (eventsByDate[dateKey] || []).filter(e => {
                if (!e.event_time) return hour === 9;
                const eventHour = parseInt(e.event_time.split(':')[0]);
                return eventHour === hour;
              });

              return (
                <div
                  key={`${dateKey}-${hour}`}
                  onClick={() => openEventDialog(day)}
                  className="border-r last:border-r-0 p-1 hover:bg-accent/30 cursor-pointer"
                >
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      onClick={(e) => { e.stopPropagation(); openEventDialog(day, event); }}
                      className={cn(
                        'text-xs px-1 py-0.5 rounded truncate cursor-pointer mb-0.5',
                        eventTypeColors[event.event_type]?.bg || eventTypeColors.other.bg,
                        'border',
                        eventTypeColors[event.event_type]?.border || eventTypeColors.other.border
                      )}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  const renderDayView = () => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const dayEvents = eventsByDate[dateKey] || [];

    return (
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="p-4 border-b bg-muted/30">
          <h3 className="text-lg font-semibold">{format(selectedDate, 'EEEE, d MMMM yyyy', { locale: dateLocale })}</h3>
          <p className="text-sm text-muted-foreground">{dayEvents.length} {t('analytics.allEvents').toLowerCase()}</p>
        </div>
        <div className="max-h-[600px] overflow-y-auto">
          {hours.map(hour => {
            const hourEvents = dayEvents.filter(e => {
              if (!e.event_time) return hour === 9;
              const eventHour = parseInt(e.event_time.split(':')[0]);
              return eventHour === hour;
            });

            return (
              <div key={hour} className="flex border-b min-h-[60px]">
                <div className="w-20 px-3 py-2 text-sm text-muted-foreground border-r flex-shrink-0">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div
                  onClick={() => openEventDialog(selectedDate)}
                  className="flex-1 p-1 hover:bg-accent/30 cursor-pointer"
                >
                  {hourEvents.map(event => (
                    <div
                      key={event.id}
                      onClick={(e) => { e.stopPropagation(); openEventDialog(selectedDate, event); }}
                      className={cn(
                        'p-2 rounded mb-1 cursor-pointer',
                        eventTypeColors[event.event_type]?.bg || eventTypeColors.other.bg,
                        'border',
                        eventTypeColors[event.event_type]?.border || eventTypeColors.other.border
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn('w-2 h-2 rounded-full', eventTypeColors[event.event_type]?.dot)} />
                        <span className="font-medium">{event.title}</span>
                        {event.event_time && (
                          <span className="text-xs text-muted-foreground">{event.event_time.slice(0, 5)}</span>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-xs text-muted-foreground mt-1 pl-4">{event.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAgendaView = () => {
    const sortedDates = Object.keys(eventsByDate).sort();
    
    return (
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto divide-y">
          {sortedDates.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t('calendar.noEvents')}</p>
            </div>
          ) : (
            sortedDates.map(dateKey => {
              const dayEvents = eventsByDate[dateKey] || [];
              const date = new Date(dateKey);
              const isTodayDate = isToday(date);

              return (
                <div key={dateKey} className="p-4">
                  <div className={cn(
                    'flex items-center gap-3 mb-3',
                    isTodayDate && 'text-primary'
                  )}>
                    <div className={cn(
                      'w-12 h-12 rounded-lg flex flex-col items-center justify-center',
                      isTodayDate ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}>
                      <span className="text-xs uppercase">{format(date, 'EEE', { locale: dateLocale })}</span>
                      <span className="text-lg font-bold">{format(date, 'd')}</span>
                    </div>
                    <div>
                      <p className="font-medium">{format(date, 'EEEE', { locale: dateLocale })}</p>
                      <p className="text-sm text-muted-foreground">{format(date, 'd MMMM yyyy', { locale: dateLocale })}</p>
                    </div>
                  </div>
                  <div className="space-y-2 pl-15">
                    {dayEvents.map(event => (
                      <div
                        key={event.id}
                        onClick={() => openEventDialog(date, event)}
                        className={cn(
                          'p-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity',
                          eventTypeColors[event.event_type]?.bg || eventTypeColors.other.bg,
                          'border',
                          eventTypeColors[event.event_type]?.border || eventTypeColors.other.border
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn('w-2 h-2 rounded-full', eventTypeColors[event.event_type]?.dot)} />
                          <span className="font-medium">{event.title}</span>
                          {event.event_time && (
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {event.event_time.slice(0, 5)}
                            </Badge>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1 pl-4">{event.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
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
            <Card className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleNavigate('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => handleNavigate('today')}>
                    {t('calendar.today')}
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleNavigate('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <h2 className="text-lg font-semibold ml-2 capitalize">{getNavigationTitle()}</h2>
                </div>
                
                <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
                  <Button
                    variant={viewMode === 'month' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('month')}
                  >
                    <LayoutGrid className="h-4 w-4 mr-1" />
                    {t('calendar.month')}
                  </Button>
                  <Button
                    variant={viewMode === 'week' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('week')}
                  >
                    {t('calendar.week')}
                  </Button>
                  <Button
                    variant={viewMode === 'day' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('day')}
                  >
                    {t('calendar.day')}
                  </Button>
                  <Button
                    variant={viewMode === 'agenda' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('agenda')}
                  >
                    <List className="h-4 w-4 mr-1" />
                    {t('calendar.agenda')}
                  </Button>
                </div>
              </div>
            </Card>

            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'day' && renderDayView()}
            {viewMode === 'agenda' && renderAgendaView()}
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <ProjectTimeline currentMonth={currentDate} onMonthChange={setCurrentDate} />
          </TabsContent>
        </Tabs>

        <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
          <DialogContent className="sm:max-w-md flex flex-col max-h-[85vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                {editingEvent ? t('common.edit') : t('calendar.addEvent')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-1">
              <div>
                <Label>{t('calendar.eventTitle')} *</Label>
                <Input
                  value={eventData.title}
                  onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                  placeholder={t('calendar.eventTitle')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('calendar.eventType')}</Label>
                  <Select value={eventData.event_type} onValueChange={(v) => setEventData({ ...eventData, event_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deadline">{t('calendar.eventTypes.deadline')}</SelectItem>
                      <SelectItem value="meeting">{t('calendar.eventTypes.meeting')}</SelectItem>
                      <SelectItem value="reminder">{t('calendar.eventTypes.reminder')}</SelectItem>
                      <SelectItem value="other">{t('calendar.eventTypes.other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('calendar.eventTime')}</Label>
                  <Input
                    type="time"
                    value={eventData.event_time}
                    onChange={(e) => setEventData({ ...eventData, event_time: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>{t('calendar.linkedProject')}</Label>
                <Select value={eventData.project_id || 'none'} onValueChange={(v) => setEventData({ ...eventData, project_id: v === 'none' ? '' : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.none')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">({t('common.none')})</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('calendar.eventDescription')}</Label>
                <Textarea
                  value={eventData.description}
                  onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="flex gap-2">
              {editingEvent && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDeleteEvent(editingEvent.id);
                    setIsEventDialogOpen(false);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('common.delete')}
                </Button>
              )}
              <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSaveEvent} disabled={addEvent.isPending || updateEvent.isPending}>
                {(addEvent.isPending || updateEvent.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('common.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}