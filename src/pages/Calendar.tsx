import { useState, useMemo, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, isToday } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useCalendarEvents, useAddCalendarEvent, useDeleteCalendarEvent, useUpdateCalendarEvent, CalendarEvent } from '@/hooks/useCalendarEvents';
import { useProjects } from '@/hooks/useProjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalendarIcon, Loader2, GanttChart, LayoutGrid, List, Clock, MapPin, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProjectTimeline } from '@/components/calendar/ProjectTimeline';
import { toast } from 'sonner';

const eventTypeColors: Record<string, { bg: string; dot: string; border: string }> = {
  deadline: { bg: 'bg-red-500/10', dot: 'bg-red-500', border: 'border-red-500/30' },
  meeting: { bg: 'bg-blue-500/10', dot: 'bg-blue-500', border: 'border-blue-500/30' },
  reminder: { bg: 'bg-amber-500/10', dot: 'bg-amber-500', border: 'border-amber-500/30' },
  other: { bg: 'bg-gray-500/10', dot: 'bg-gray-500', border: 'border-gray-500/30' },
};

const eventTypeLabels: Record<string, string> = {
  deadline: 'Termin',
  meeting: 'Spotkanie',
  reminder: 'Przypomnienie',
  other: 'Inne',
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

export default function Calendar() {
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

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach(event => {
      const dateKey = event.event_date;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(event);
    });
    // Sort events by time
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
      toast.error('Podaj tytuł wydarzenia');
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
    await deleteEvent.mutateAsync(eventId);
  };

  const getNavigationTitle = () => {
    switch (viewMode) {
      case 'month':
        return format(currentDate, 'LLLL yyyy', { locale: pl });
      case 'week':
        return `${format(weekStart, 'd MMM', { locale: pl })} - ${format(weekEnd, 'd MMM yyyy', { locale: pl })}`;
      case 'day':
        return format(selectedDate, 'EEEE, d MMMM yyyy', { locale: pl });
      case 'agenda':
        return 'Agenda';
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Render month view
  const renderMonthView = () => (
    <div className="bg-card rounded-xl border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'].map(day => (
          <div key={day} className="px-2 py-3 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0">
            {day}
          </div>
        ))}
      </div>
      {/* Days grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
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
                    +{dayEvents.length - 3} więcej
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Render week view
  const renderWeekView = () => (
    <div className="bg-card rounded-xl border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-8 border-b bg-muted/30">
        <div className="px-2 py-3 text-center text-xs font-medium text-muted-foreground border-r" />
        {weekDays.map(day => {
          const isTodayDate = isToday(day);
          return (
            <div key={day.toISOString()} className="px-2 py-3 text-center border-r last:border-r-0">
              <div className="text-xs text-muted-foreground">{format(day, 'EEE', { locale: pl })}</div>
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
      {/* Time grid */}
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

  // Render day view
  const renderDayView = () => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const dayEvents = eventsByDate[dateKey] || [];

    return (
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="p-4 border-b bg-muted/30">
          <h3 className="text-lg font-semibold">{format(selectedDate, 'EEEE, d MMMM yyyy', { locale: pl })}</h3>
          <p className="text-sm text-muted-foreground">{dayEvents.length} wydarzeń</p>
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

  // Render agenda view
  const renderAgendaView = () => {
    const sortedDates = Object.keys(eventsByDate).sort();
    
    return (
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto divide-y">
          {sortedDates.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Brak wydarzeń w tym miesiącu</p>
            </div>
          ) : (
            sortedDates.map(dateKey => {
              const dayEvents = eventsByDate[dateKey];
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
                      <span className="text-xs uppercase">{format(date, 'EEE', { locale: pl })}</span>
                      <span className="text-lg font-bold">{format(date, 'd')}</span>
                    </div>
                    <div>
                      <p className="font-medium">{format(date, 'EEEE', { locale: pl })}</p>
                      <p className="text-sm text-muted-foreground">{format(date, 'd MMMM yyyy', { locale: pl })}</p>
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
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={cn('w-2 h-2 rounded-full', eventTypeColors[event.event_type]?.dot)} />
                            <span className="font-medium">{event.title}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {event.event_time && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {event.event_time.slice(0, 5)}
                              </span>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {eventTypeLabels[event.event_type]}
                            </Badge>
                          </div>
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-2">{event.description}</p>
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-md">
              <CalendarIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            Kalendarz
          </h1>
          <p className="mt-1 text-muted-foreground">Zarządzaj terminami i wydarzeniami</p>
        </div>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'calendar' | 'timeline')}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="calendar" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <CalendarIcon className="h-4 w-4" />
              Kalendarz
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <GanttChart className="h-4 w-4" />
              Timeline
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeTab === 'timeline' ? (
        <ProjectTimeline currentMonth={currentDate} onMonthChange={setCurrentDate} />
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card rounded-xl border p-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleNavigate('today')}>
                Dziś
              </Button>
              <div className="flex items-center border rounded-lg">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleNavigate('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleNavigate('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <h2 className="text-lg font-semibold min-w-[200px] capitalize">{getNavigationTitle()}</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex border rounded-lg overflow-hidden">
                {([
                  { mode: 'month', icon: LayoutGrid, label: 'Miesiąc' },
                  { mode: 'week', icon: List, label: 'Tydzień' },
                  { mode: 'day', icon: Clock, label: 'Dzień' },
                  { mode: 'agenda', icon: List, label: 'Agenda' },
                ] as const).map(({ mode, icon: Icon, label }) => (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? 'secondary' : 'ghost'}
                    size="sm"
                    className="rounded-none px-3"
                    onClick={() => setViewMode(mode)}
                  >
                    <Icon className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{label}</span>
                  </Button>
                ))}
              </div>
              <Button onClick={() => openEventDialog(selectedDate)} className="bg-gradient-to-r from-primary to-primary-glow">
                <Plus className="h-4 w-4 mr-2" />
                Nowe wydarzenie
              </Button>
            </div>
          </div>

          {/* Calendar content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {viewMode === 'month' && renderMonthView()}
              {viewMode === 'week' && renderWeekView()}
              {viewMode === 'day' && renderDayView()}
              {viewMode === 'agenda' && renderAgendaView()}
            </>
          )}
        </>
      )}

      {/* Event Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingEvent ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editingEvent ? 'Edytuj wydarzenie' : 'Nowe wydarzenie'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tytuł *</Label>
              <Input
                value={eventData.title}
                onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                placeholder="Nazwa wydarzenia"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Typ wydarzenia</Label>
                <Select
                  value={eventData.event_type}
                  onValueChange={(v) => setEventData({ ...eventData, event_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deadline">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        Termin
                      </div>
                    </SelectItem>
                    <SelectItem value="meeting">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        Spotkanie
                      </div>
                    </SelectItem>
                    <SelectItem value="reminder">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        Przypomnienie
                      </div>
                    </SelectItem>
                    <SelectItem value="other">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-500" />
                        Inne
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Godzina</Label>
                <Input
                  type="time"
                  value={eventData.event_time}
                  onChange={(e) => setEventData({ ...eventData, event_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Projekt (opcjonalnie)</Label>
              <Select
                value={eventData.project_id}
                onValueChange={(v) => setEventData({ ...eventData, project_id: v === 'none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz projekt" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Brak</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Opis</Label>
              <Textarea
                value={eventData.description}
                onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                placeholder="Szczegóły wydarzenia..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {editingEvent && (
              <Button
                variant="destructive"
                onClick={() => {
                  handleDeleteEvent(editingEvent.id);
                  setIsEventDialogOpen(false);
                }}
                className="sm:mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Usuń
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>
              Anuluj
            </Button>
            <Button
              onClick={handleSaveEvent}
              disabled={!eventData.title.trim() || addEvent.isPending || updateEvent.isPending}
              className="bg-gradient-to-r from-primary to-primary-glow"
            >
              {(addEvent.isPending || updateEvent.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingEvent ? 'Zapisz zmiany' : 'Dodaj wydarzenie'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}