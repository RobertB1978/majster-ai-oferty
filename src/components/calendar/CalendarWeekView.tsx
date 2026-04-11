import { useEffect, useRef, useState } from 'react';
import { format, isToday } from 'date-fns';
import type { Locale } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/hooks/useCalendarEvents';
import { eventTypeColors, HOURS } from './calendarTypes';

interface CalendarWeekViewProps {
  weekDays: Date[];
  eventsByDate: Record<string, CalendarEvent[]>;
  openEventDialog: (date?: Date, event?: CalendarEvent) => void;
  dateLocale: Locale;
}

const HOUR_HEIGHT = 60; // px per hour — must match min-h-[60px]

export function CalendarWeekView({ weekDays, eventsByDate, openEventDialog, dateLocale }: CalendarWeekViewProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      const minutesFromMidnight = now.getHours() * 60 + now.getMinutes();
      scrollRef.current.scrollTop = Math.max(0, minutesFromMidnight - 120);
    }
    // Only on mount — intentional
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nowHour = now.getHours();
  const nowMinutes = now.getMinutes();

  // Check if the current week contains today
  const todayKey = format(now, 'yyyy-MM-dd');
  const todayInView = weekDays.some(d => format(d, 'yyyy-MM-dd') === todayKey);

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-8 border-b bg-muted/30">
        <div className="px-2 py-3 text-center text-xs font-medium text-muted-foreground border-r" />
        {weekDays.map(day => {
          const isTodayDate = isToday(day);
          return (
            <div key={day.toISOString()} className="px-2 py-3 text-center border-r last:border-r-0">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                {format(day, 'EEE', { locale: dateLocale })}
              </div>
              <div className={cn(
                'text-lg font-semibold mt-1 w-8 h-8 mx-auto flex items-center justify-center rounded-full transition-colors',
                isTodayDate && 'bg-primary text-primary-foreground'
              )}>
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day events row */}
      {weekDays.some(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        return (eventsByDate[dateKey] || []).some(e => !e.event_time);
      }) && (
        <div className="grid grid-cols-8 border-b bg-muted/10 min-h-[36px]">
          <div className="px-2 py-1.5 text-xs text-muted-foreground border-r text-right flex items-center justify-end select-none uppercase tracking-wide">
            {t('calendar.allDay')}
          </div>
          {weekDays.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const allDayEvents = (eventsByDate[dateKey] || []).filter(e => !e.event_time);
            return (
              <div key={`allday-${dateKey}`} className="border-r last:border-r-0 p-1 space-y-0.5">
                {allDayEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={e => { e.stopPropagation(); openEventDialog(day, event); }}
                    className={cn(
                      'text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity',
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
      )}

      {/* Timed grid */}
      <div ref={scrollRef} className="max-h-[600px] overflow-y-auto">
        {HOURS.map(hour => (
          <div key={hour} className="grid grid-cols-8 border-b min-h-[60px]">
            {/* Hour label */}
            <div className="px-2 py-1 text-xs text-muted-foreground border-r text-right select-none">
              {hour.toString().padStart(2, '0')}:00
            </div>

            {/* Day columns */}
            {weekDays.map(day => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const isTodayCol = todayInView && isToday(day);
              const isCurrentHour = isTodayCol && hour === nowHour;

              const hourEvents = (eventsByDate[dateKey] || []).filter(e => {
                if (!e.event_time) return false; // all-day events are in the header
                const eventHour = parseInt(e.event_time.split(':')[0]);
                return eventHour === hour;
              });

              return (
                <div
                  key={`${dateKey}-${hour}`}
                  onClick={() => openEventDialog(day)}
                  className={cn(
                    'border-r last:border-r-0 p-1 hover:bg-accent/30 cursor-pointer relative',
                    isTodayCol && 'bg-primary/[0.02]'
                  )}
                >
                  {hourEvents.map(event => {
                    const isCompleted = event.status === 'completed';
                    return (
                      <div
                        key={event.id}
                        onClick={e => { e.stopPropagation(); openEventDialog(day, event); }}
                        className={cn(
                          'text-xs px-1 py-0.5 rounded truncate cursor-pointer mb-0.5 hover:opacity-80 transition-opacity',
                          isCompleted
                            ? 'bg-muted/40 border-muted line-through opacity-60'
                            : cn(
                                eventTypeColors[event.event_type]?.bg || eventTypeColors.other.bg,
                                'border',
                                eventTypeColors[event.event_type]?.border || eventTypeColors.other.border
                              )
                        )}
                      >
                        <span className="font-medium mr-1 opacity-70">{event.event_time!.slice(0, 5)}</span>
                        {event.title}
                      </div>
                    );
                  })}

                  {/* Current time indicator */}
                  {isCurrentHour && (
                    <div
                      className="absolute left-0 right-0 pointer-events-none z-10 flex items-center"
                      style={{ top: `${(nowMinutes / 60) * HOUR_HEIGHT}px` }}
                    >
                      <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 -ml-1" />
                      <div className="flex-1 h-0.5 bg-red-500/80" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
