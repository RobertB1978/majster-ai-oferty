import { useMemo } from 'react';
import { format, parseISO, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, addMonths, subMonths } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useProjects } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Loader2, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const statusColors: Record<string, string> = {
  'Nowy': 'bg-blue-500',
  'Wycena w toku': 'bg-amber-500',
  'Oferta wysłana': 'bg-purple-500',
  'Zaakceptowany': 'bg-emerald-500',
};

const priorityColors: Record<string, string> = {
  'low': 'border-l-muted-foreground',
  'normal': 'border-l-primary',
  'high': 'border-l-destructive',
};

interface ProjectTimelineProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function ProjectTimeline({ currentMonth, onMonthChange }: ProjectTimelineProps) {
  const navigate = useNavigate();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: clients = [] } = useClients();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const totalDays = daysInMonth.length;

  // Filter projects that have dates and overlap with current month
  const timelineProjects = useMemo(() => {
    return projects
      .filter(p => p.start_date || p.end_date)
      .map(p => {
        const startDate = p.start_date ? parseISO(p.start_date) : null;
        const endDate = p.end_date ? parseISO(p.end_date) : null;
        const client = clients.find(c => c.id === p.client_id);

        // Check if project overlaps with current month
        const projectStart = startDate || endDate;
        const projectEnd = endDate || startDate;

        if (!projectStart || !projectEnd) return null;

        const overlapsMonth = (
          isWithinInterval(projectStart, { start: monthStart, end: monthEnd }) ||
          isWithinInterval(projectEnd, { start: monthStart, end: monthEnd }) ||
          (projectStart <= monthStart && projectEnd >= monthEnd)
        );

        if (!overlapsMonth) return null;

        // Calculate bar position and width
        const barStart = projectStart < monthStart ? monthStart : projectStart;
        const barEnd = projectEnd > monthEnd ? monthEnd : projectEnd;

        const startDay = differenceInDays(barStart, monthStart);
        const duration = differenceInDays(barEnd, barStart) + 1;

        const leftPercent = (startDay / totalDays) * 100;
        const widthPercent = (duration / totalDays) * 100;

        return {
          ...p,
          clientName: client?.name || 'Nieznany klient',
          startDate,
          endDate,
          leftPercent,
          widthPercent,
          startsBeforeMonth: projectStart < monthStart,
          endsAfterMonth: projectEnd > monthEnd,
        };
      })
      .filter(Boolean);
  }, [projects, clients, monthStart, monthEnd, totalDays]);

  // Week markers
  const weekMarkers = useMemo(() => {
    const markers: { day: number; label: string }[] = [];
    daysInMonth.forEach((day, index) => {
      if (day.getDay() === 1 || index === 0) { // Monday or first day
        markers.push({
          day: index,
          label: format(day, 'd', { locale: pl }),
        });
      }
    });
    return markers;
  }, [daysInMonth]);

  if (projectsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Timeline Projektów - {format(currentMonth, 'LLLL yyyy', { locale: pl })}
        </CardTitle>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={() => onMonthChange(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => onMonthChange(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Day header */}
        <div className="relative mb-4">
          <div className="flex border-b border-border pb-2">
            {weekMarkers.map((marker, i) => (
              <div
                key={i}
                className="absolute text-xs text-muted-foreground"
                style={{ left: `${(marker.day / totalDays) * 100}%` }}
              >
                {marker.label}
              </div>
            ))}
          </div>
          {/* Day grid lines */}
          <div className="absolute inset-0 flex pointer-events-none" style={{ top: '24px' }}>
            {Array.from({ length: Math.ceil(totalDays / 7) + 1 }).map((_, i) => (
              <div
                key={i}
                className="absolute h-full border-l border-border/30"
                style={{ left: `${(i * 7 / totalDays) * 100}%` }}
              />
            ))}
          </div>
        </div>

        {/* Timeline rows */}
        {timelineProjects.length === 0 ? (
          <div className="py-12 text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Brak projektów z datami w tym miesiącu</p>
            <p className="text-sm text-muted-foreground mt-1">
              Dodaj daty rozpoczęcia i zakończenia do projektów, aby zobaczyć je na osi czasu
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {timelineProjects.map((project) => (
              <div
                key={project!.id}
                className="relative h-14 group"
              >
                {/* Project label */}
                <div className="absolute left-0 top-0 w-48 pr-2 h-full flex flex-col justify-center z-10">
                  <p className="text-sm font-medium truncate">{project!.project_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{project!.clientName}</p>
                </div>

                {/* Timeline bar area */}
                <div className="absolute left-48 right-0 top-0 h-full">
                  {/* Background grid */}
                  <div className="absolute inset-0 bg-muted/20 rounded" />

                  {/* Project bar */}
                  <button
                    onClick={() => navigate(`/app/jobs/${project!.id}`)}
                    className={cn(
                      'absolute top-2 h-10 rounded transition-all cursor-pointer',
                      'hover:brightness-110 hover:shadow-md',
                      'flex items-center px-2 gap-2 overflow-hidden',
                      'border-l-4',
                      statusColors[project!.status] || 'bg-muted',
                      priorityColors[project!.priority || 'normal'],
                      project!.startsBeforeMonth && 'rounded-l-none',
                      project!.endsAfterMonth && 'rounded-r-none'
                    )}
                    style={{
                      left: `${project!.leftPercent}%`,
                      width: `${Math.max(project!.widthPercent, 5)}%`,
                    }}
                  >
                    <span className="text-xs text-white font-medium truncate">
                      {project!.project_name}
                    </span>
                    <Badge 
                      variant="secondary" 
                      className="text-[10px] px-1 py-0 shrink-0 bg-white/20 text-white border-0"
                    >
                      {project!.status}
                    </Badge>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Status projektów:</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(statusColors).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={cn('w-3 h-3 rounded-sm', color)} />
                <span className="text-xs">{status}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
