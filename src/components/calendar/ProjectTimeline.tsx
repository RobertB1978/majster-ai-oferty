import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO, isValid, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, addMonths, subMonths } from 'date-fns';
import { pl } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { uk } from 'date-fns/locale';
import { useProjectsV2List } from '@/hooks/useProjectsV2';
import { useClients } from '@/hooks/useClients';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Loader2, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

/** Map V2 status values → semantic colour classes */
const STATUS_COLOR: Record<string, string> = {
  'ACTIVE':    'bg-primary',           // --primary amber (#F59E0B)
  'ON_HOLD':   'bg-warning',           // --state-warning (#D97706)
  'CANCELLED': 'bg-muted-foreground',  // neutral grey (#5E646E)
  'COMPLETED': 'bg-success',           // --state-success (#16A34A)
};

/** Map V2 status → full i18n key */
const STATUS_I18N: Record<string, string> = {
  'ACTIVE':    'projectsV2.statusActive',
  'COMPLETED': 'projectsV2.statusCompleted',
  'ON_HOLD':   'projectsV2.statusOnHold',
  'CANCELLED': 'projectsV2.statusCancelled',
};

const getDateLocale = (lang: string) => {
  switch (lang) {
    case 'uk': return uk;
    case 'en': return enUS;
    default: return pl;
  }
};

interface ProjectTimelineProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function ProjectTimeline({ currentMonth, onMonthChange }: ProjectTimelineProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const dateLocale = getDateLocale(i18n.language);

  // V2-aligned: reads from v2_projects (same canonical source as ProjectsList / ProjectHub)
  const { data: projects = [], isLoading: projectsLoading } = useProjectsV2List();
  const { data: clients = [] } = useClients();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const totalDays = daysInMonth.length;

  // Filter projects that have dates and overlap with current month.
  // Exclude CANCELLED (soft-deleted) projects — they are not visible in ProjectsList either.
  const timelineProjects = useMemo(() => {
    type ProjectRow = (typeof projects)[number] & {
      clientName: string;
      startDate: Date | null;
      endDate: Date | null;
      leftPercent: number;
      widthPercent: number;
      startsBeforeMonth: boolean;
      endsAfterMonth: boolean;
    };

    return projects
      .filter(p => p.status !== 'CANCELLED' && (p.start_date || p.end_date))
      .reduce<ProjectRow[]>((acc, p) => {
        const startDate = p.start_date ? parseISO(p.start_date) : null;
        const endDate = p.end_date ? parseISO(p.end_date) : null;

        // Guard against invalid parsed dates (e.g. empty string / corrupted data)
        if (startDate && !isValid(startDate)) return acc;
        if (endDate && !isValid(endDate)) return acc;

        const client = clients.find(c => c.id === p.client_id);

        // Use whichever date is available as the range boundary
        const projectStart = startDate || endDate;
        const projectEnd = endDate || startDate;

        if (!projectStart || !projectEnd) return acc;

        const overlapsMonth = (
          isWithinInterval(projectStart, { start: monthStart, end: monthEnd }) ||
          isWithinInterval(projectEnd, { start: monthStart, end: monthEnd }) ||
          (projectStart <= monthStart && projectEnd >= monthEnd)
        );

        if (!overlapsMonth) return acc;

        // Calculate bar position and width
        const barStart = projectStart < monthStart ? monthStart : projectStart;
        const barEnd = projectEnd > monthEnd ? monthEnd : projectEnd;

        const startDay = differenceInDays(barStart, monthStart);
        const duration = differenceInDays(barEnd, barStart) + 1;

        const leftPercent = (startDay / totalDays) * 100;
        const widthPercent = (duration / totalDays) * 100;

        acc.push({
          ...p,
          clientName: client?.name || t('projectTimeline.unknownClient'),
          startDate,
          endDate,
          leftPercent,
          widthPercent,
          startsBeforeMonth: projectStart < monthStart,
          endsAfterMonth: projectEnd > monthEnd,
        });
        return acc;
      }, []);
  }, [projects, clients, monthStart, monthEnd, totalDays, t]);

  // Week markers
  const weekMarkers = useMemo(() => {
    const markers: { day: number; label: string }[] = [];
    daysInMonth.forEach((day, index) => {
      if (day.getDay() === 1 || index === 0) { // Monday or first day
        markers.push({
          day: index,
          label: format(day, 'd', { locale: dateLocale }),
        });
      }
    });
    return markers;
  }, [daysInMonth, dateLocale]);

  /** Get translated label for a V2 project status */
  const getStatusLabel = (status: string): string => {
    const i18nKey = STATUS_I18N[status];
    if (i18nKey) {
      return t(i18nKey, status);
    }
    return status;
  };

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
          {t('projectTimeline.title', { month: format(currentMonth, 'LLLL yyyy', { locale: dateLocale }) })}
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
            <p className="text-muted-foreground">{t('projectTimeline.noProjects')}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t('projectTimeline.noProjectsHint')}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {timelineProjects.map((project) => (
              <div
                key={project.id}
                className="relative h-14 group"
              >
                {/* Project label */}
                <div className="absolute left-0 top-0 w-48 pr-2 h-full flex flex-col justify-center z-10">
                  <p className="text-sm font-medium truncate">{project.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{project.clientName}</p>
                </div>

                {/* Timeline bar area */}
                <div className="absolute left-48 right-0 top-0 h-full">
                  {/* Background grid */}
                  <div className="absolute inset-0 bg-muted/20 rounded" />

                  {/* Project bar */}
                  <button
                    onClick={() => navigate(`/app/projects/${project.id}`)}
                    className={cn(
                      'absolute top-2 h-10 rounded transition-all cursor-pointer',
                      'hover:brightness-110 hover:shadow-md',
                      'flex items-center px-2 gap-2 overflow-hidden',
                      STATUS_COLOR[project.status] || 'bg-muted',
                      project.startsBeforeMonth && 'rounded-l-none',
                      project.endsAfterMonth && 'rounded-r-none'
                    )}
                    style={{
                      left: `${project.leftPercent}%`,
                      width: `${Math.max(project.widthPercent, 5)}%`,
                    }}
                  >
                    <span className="text-xs text-white font-medium truncate">
                      {project.title}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1 py-0 shrink-0 bg-white/20 text-white border-0"
                    >
                      {getStatusLabel(project.status)}
                    </Badge>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">{t('projectTimeline.statusLegend')}</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(STATUS_COLOR).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={cn('w-3 h-3 rounded-sm', color)} />
                <span className="text-xs">{getStatusLabel(status)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
