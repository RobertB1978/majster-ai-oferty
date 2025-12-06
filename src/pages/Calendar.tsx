import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useCalendarEvents, useAddCalendarEvent, useDeleteCalendarEvent, CalendarEvent } from '@/hooks/useCalendarEvents';
import { useProjects } from '@/hooks/useProjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalendarIcon, Loader2, GanttChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProjectTimeline } from '@/components/calendar/ProjectTimeline';

const eventTypeColors: Record<string, string> = {
  deadline: 'bg-destructive/10 text-destructive border-destructive/20',
  meeting: 'bg-primary/10 text-primary border-primary/20',
  reminder: 'bg-warning/10 text-warning border-warning/20',
  other: 'bg-muted text-muted-foreground border-border',
};

const eventTypeLabels: Record<string, string> = {
  deadline: 'Termin',
  meeting: 'Spotkanie',
  reminder: 'Przypomnienie',
  other: 'Inne',
};

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'timeline'>('calendar');
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_type: 'deadline',
    event_time: '',
    project_id: '',
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const { data: events = [], isLoading } = useCalendarEvents(
    format(monthStart, 'yyyy-MM-dd'),
    format(monthEnd, 'yyyy-MM-dd')
  );
  const { data: projects = [] } = useProjects();
  const addEvent = useAddCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach(event => {
      const dateKey = event.event_date;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(event);
    });
    return map;
  }, [events]);

  const selectedDateEvents = selectedDate 
    ? eventsByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  const handleAddEvent = async () => {
    if (!selectedDate || !newEvent.title.trim()) return;

    await addEvent.mutateAsync({
      title: newEvent.title,
      description: newEvent.description,
      event_date: format(selectedDate, 'yyyy-MM-dd'),
      event_time: newEvent.event_time || null,
      event_type: newEvent.event_type,
      project_id: newEvent.project_id || null,
      status: 'pending',
    });

    setNewEvent({ title: '', description: '', event_type: 'deadline', event_time: '', project_id: '' });
    setIsAddDialogOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
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
        <ProjectTimeline currentMonth={currentMonth} onMonthChange={setCurrentMonth} />
      ) : (
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {format(currentMonth, 'LLLL yyyy', { locale: pl })}
            </CardTitle>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {/* Offset for first day of month */}
                  {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}
                  {days.map(day => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const dayEvents = eventsByDate[dateKey] || [];
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, new Date());

                    return (
                      <button
                        key={dateKey}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          'aspect-square p-1 rounded-lg text-sm transition-colors relative',
                          'hover:bg-accent',
                          isSelected && 'bg-primary text-primary-foreground hover:bg-primary',
                          isToday && !isSelected && 'ring-2 ring-primary/50',
                          !isSameMonth(day, currentMonth) && 'text-muted-foreground opacity-50'
                        )}
                      >
                        <span className="font-medium">{format(day, 'd')}</span>
                        {dayEvents.length > 0 && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {dayEvents.slice(0, 3).map((e, i) => (
                              <div
                                key={i}
                                className={cn(
                                  'w-1.5 h-1.5 rounded-full',
                                  e.event_type === 'deadline' && 'bg-destructive',
                                  e.event_type === 'meeting' && 'bg-primary',
                                  e.event_type === 'reminder' && 'bg-warning',
                                  e.event_type === 'other' && 'bg-muted-foreground'
                                )}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Selected Date Panel */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">
              {selectedDate ? format(selectedDate, 'd MMMM yyyy', { locale: pl }) : 'Wybierz datę'}
            </CardTitle>
            {selectedDate && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Dodaj
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nowe wydarzenie</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Tytuł</Label>
                      <Input
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        placeholder="Nazwa wydarzenia"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Typ</Label>
                      <Select
                        value={newEvent.event_type}
                        onValueChange={(v) => setNewEvent({ ...newEvent, event_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="deadline">Termin</SelectItem>
                          <SelectItem value="meeting">Spotkanie</SelectItem>
                          <SelectItem value="reminder">Przypomnienie</SelectItem>
                          <SelectItem value="other">Inne</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Godzina (opcjonalnie)</Label>
                      <Input
                        type="time"
                        value={newEvent.event_time}
                        onChange={(e) => setNewEvent({ ...newEvent, event_time: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Projekt (opcjonalnie)</Label>
                      <Select
                        value={newEvent.project_id}
                        onValueChange={(v) => setNewEvent({ ...newEvent, project_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz projekt" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Brak</SelectItem>
                          {projects.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Opis</Label>
                      <Input
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                        placeholder="Opcjonalny opis"
                      />
                    </div>
                    <Button
                      onClick={handleAddEvent}
                      disabled={!newEvent.title.trim() || addEvent.isPending}
                      className="w-full"
                    >
                      {addEvent.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Dodaj wydarzenie
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-muted-foreground text-sm py-8 text-center">
                Kliknij na dzień, aby zobaczyć wydarzenia
              </p>
            ) : selectedDateEvents.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">
                Brak wydarzeń w tym dniu
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map(event => (
                  <div
                    key={event.id}
                    className={cn(
                      'p-3 rounded-lg border',
                      eventTypeColors[event.event_type] || eventTypeColors.other
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{event.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {eventTypeLabels[event.event_type]}
                          </Badge>
                          {event.event_time && (
                            <span className="text-xs">{event.event_time.slice(0, 5)}</span>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-xs mt-2 opacity-80">{event.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => deleteEvent.mutate(event.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  );
}
