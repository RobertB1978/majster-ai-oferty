import { useMemo, useState } from 'react';
import { format, parseISO, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isWithinInterval } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Users, Calendar, Loader2 } from 'lucide-react';
import { useWorkTasks } from '@/hooks/useWorkTasks';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useProjects } from '@/hooks/useProjects';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  planned: 'bg-blue-500',
  in_progress: 'bg-amber-500',
  done: 'bg-emerald-500',
};

const statusLabels: Record<string, string> = {
  planned: 'Planowane',
  in_progress: 'W trakcie',
  done: 'Zakończone',
};

interface WorkTasksGanttProps {
  projectId?: string;
}

export function WorkTasksGantt({ projectId }: WorkTasksGanttProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data: tasks = [], isLoading: tasksLoading } = useWorkTasks(projectId);
  const { data: teamMembers = [] } = useTeamMembers();
  const { data: projects = [] } = useProjects();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const totalDays = daysInMonth.length;

  // Calculate team member capacity
  const memberCapacity = useMemo(() => {
    const capacity: Record<string, { total: number; used: number }> = {};
    
    teamMembers.forEach(member => {
      capacity[member.id] = { total: totalDays * 8, used: 0 }; // 8 hours per day
    });

    tasks.forEach(task => {
      if (!task.assigned_team_member_id) return;
      const start = parseISO(task.start_date);
      const end = parseISO(task.end_date);
      const days = differenceInDays(end, start) + 1;
      
      if (capacity[task.assigned_team_member_id]) {
        capacity[task.assigned_team_member_id].used += days * 8;
      }
    });

    return capacity;
  }, [tasks, teamMembers, totalDays]);

  // Filter tasks that overlap with current month
  const visibleTasks = useMemo(() => {
    return tasks.filter(task => {
      const start = parseISO(task.start_date);
      const end = parseISO(task.end_date);
      
      return (
        isWithinInterval(start, { start: monthStart, end: monthEnd }) ||
        isWithinInterval(end, { start: monthStart, end: monthEnd }) ||
        (start <= monthStart && end >= monthEnd)
      );
    }).map(task => {
      const start = parseISO(task.start_date);
      const end = parseISO(task.end_date);
      
      const barStart = start < monthStart ? monthStart : start;
      const barEnd = end > monthEnd ? monthEnd : end;
      
      const startDay = differenceInDays(barStart, monthStart);
      const duration = differenceInDays(barEnd, barStart) + 1;
      
      const leftPercent = (startDay / totalDays) * 100;
      const widthPercent = (duration / totalDays) * 100;
      
      const project = projects.find(p => p.id === task.project_id);
      const member = teamMembers.find(m => m.id === task.assigned_team_member_id);
      
      return {
        ...task,
        projectName: project?.project_name || 'Nieznany projekt',
        memberName: member?.name,
        leftPercent,
        widthPercent,
        startsBeforeMonth: start < monthStart,
        endsAfterMonth: end > monthEnd,
      };
    });
  }, [tasks, projects, teamMembers, monthStart, monthEnd, totalDays]);

  // Week markers
  const weekMarkers = useMemo(() => {
    const markers: { day: number; label: string }[] = [];
    daysInMonth.forEach((day, index) => {
      if (day.getDay() === 1 || index === 0) {
        markers.push({ day: index, label: format(day, 'd', { locale: pl }) });
      }
    });
    return markers;
  }, [daysInMonth]);

  if (tasksLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gantt Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Harmonogram - {format(currentMonth, 'LLLL yyyy', { locale: pl })}
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
          </div>

          {/* Tasks */}
          {visibleTasks.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Brak zadań w tym miesiącu</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleTasks.map((task) => (
                <div key={task.id} className="relative h-14 group">
                  {/* Task label */}
                  <div className="absolute left-0 top-0 w-48 pr-2 h-full flex flex-col justify-center z-10">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground truncate">{task.projectName}</p>
                      {task.memberName && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {task.memberName}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Timeline bar area */}
                  <div className="absolute left-48 right-0 top-0 h-full">
                    <div className="absolute inset-0 bg-muted/20 rounded" />
                    
                    {/* Task bar */}
                    <div
                      className={cn(
                        'absolute top-2 h-10 rounded transition-all',
                        'flex items-center px-2 gap-2 overflow-hidden',
                        statusColors[task.status] || 'bg-muted',
                        task.startsBeforeMonth && 'rounded-l-none',
                        task.endsAfterMonth && 'rounded-r-none'
                      )}
                      style={{
                        left: `${task.leftPercent}%`,
                        width: `${Math.max(task.widthPercent, 5)}%`,
                        backgroundColor: task.color || undefined,
                      }}
                    >
                      <span className="text-xs text-white font-medium truncate">
                        {task.title}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className="text-[10px] px-1 py-0 shrink-0 bg-white/20 text-white border-0"
                      >
                        {statusLabels[task.status]}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Status zadań:</p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(statusColors).map(([status, color]) => (
                <div key={status} className="flex items-center gap-1.5">
                  <div className={cn('w-3 h-3 rounded-sm', color)} />
                  <span className="text-xs">{statusLabels[status]}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Capacity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Obciążenie zespołu
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground">Brak członków zespołu</p>
          ) : (
            <div className="space-y-4">
              {teamMembers.map((member) => {
                const capacity = memberCapacity[member.id] || { total: 0, used: 0 };
                const usagePercent = capacity.total > 0 ? (capacity.used / capacity.total) * 100 : 0;
                
                return (
                  <div key={member.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                      <span className="text-sm">
                        {capacity.used}h / {capacity.total}h
                      </span>
                    </div>
                    <Progress 
                      value={usagePercent} 
                      className={cn(
                        "h-2",
                        usagePercent > 100 && "[&>div]:bg-destructive",
                        usagePercent > 80 && usagePercent <= 100 && "[&>div]:bg-amber-500"
                      )}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
