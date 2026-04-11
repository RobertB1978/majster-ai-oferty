import { useEffect, useRef, useState } from 'react';
import { format, isToday as dateFnsIsToday, isSameDay } from 'date-fns';
import type { Locale } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/hooks/useCalendarEvents';
import { eventTypeColors, HOURS } from './calendarTypes';

interface CalendarDayViewProps {
  selectedDate: Date;
  eventsByDate: Record<string, CalendarEvent[]>;
  openEventDialog: (date?: Date, event?: CalendarEvent) => void;
  dateLocale: Locale;
}

const HOUR_HEIGHT = 60; // px per hour — must match min-h-[60px]

export function CalendarDayView({ selectedDate, eventsByDate, openEventDialog, dateLocale }: CalendarDayViewProps) {
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

  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const dayEvents = eventsByDate[dateKey] || [];
  const allDayEvents = dayEvents.filter(e => !e.event_time);
  const timedEvents = dayEvents.filter(e => !!e.event_time);

  const isViewingToday = isSameDay(selectedDate, now) && dateFnsIsToday(selectedDate);
  const nowMinutes = now.getMinutes();
  const nowHour = now.getHours();

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      {/* Day header */}
      <div className="p-4 border-b bg-muted/30">
        <h3 className="text-lg font-semibold">{format(selectedDate, 'EEEE, d MMMM yyyy', { locale: dateLocale })}</h3>
        <p className="text-sm text-muted-foreground">
          {dayEvents.length === 0
            ? t('calendar.noEventsForDay')
            : `${dayEvents.length} ${t('calendar.eventsList')}`}
        </p>
      </div>

      {/* All-day events section */}
      {allDayEvents.length > 0 && (
        <div className="border-b bg-muted/10 px-4 py-2">
          <div className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
            {t('calendar.allDay')}
          </div>
          <div className="space-y-1">
            {allDayEvents.map(event => {
              const isCompleted = event.status === 'completed';
              return (
                <div
                  key={event.id}
                  onClick={e => { e.stopPropagation(); openEventDialog(selectedDate, event); }}
                  className={cn(
                    'p-2 rounded-md cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2',
                    isCompleted
                      ? 'bg-muted/30 border-muted opacity-60'
                      : cn(
                          eventTypeColors[event.event_type]?.bg || eventTypeColors.other.bg,
                          'border',
                          eventTypeColors[event.event_type]?.border || eventTypeColors.other.border
                        )
                  )}
                >
                  <div className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    isCompleted ? 'bg-green-500' : eventTypeColors[event.event_type]?.dot
                  )} />
                  <span className={cn('text-sm font-medium truncate', isCompleted && 'line-through')}>{event.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timed events grid */}
      <div ref={scrollRef} className="max-h-[600px] overflow-y-auto">
        {HOURS.map(hour => {
          const hourEvents = timedEvents.filter(e => {
            const eventHour = parseInt(e.event_time!.split(':')[0]);
            return eventHour === hour;
          });
          const isCurrentHour = isViewingToday && hour === nowHour;

          return (
            <div key={hour} className="flex border-b min-h-[60px] relative">
              {/* Hour label */}
              <div className="w-20 px-3 py-2 text-sm text-muted-foreground border-r flex-shrink-0 select-none">
                {hour.toString().padStart(2, '0')}:00
              </div>

              {/* Event slot */}
              <div
                onClick={() => openEventDialog(selectedDate)}
                className="flex-1 p-1 hover:bg-accent/30 cursor-pointer relative"
              >
                {hourEvents.map(event => {
                  const isCompleted = event.status === 'completed';
                  return (
                    <div
                      key={event.id}
                      onClick={e => { e.stopPropagation(); openEventDialog(selectedDate, event); }}
                      className={cn(
                        'p-2 rounded mb-1 cursor-pointer transition-opacity',
                        isCompleted
                          ? 'bg-muted/30 border-muted opacity-60'
                          : cn(
                              eventTypeColors[event.event_type]?.bg || eventTypeColors.other.bg,
                              'border',
                              eventTypeColors[event.event_type]?.border || eventTypeColors.other.border
                            )
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'w-2 h-2 rounded-full flex-shrink-0',
                          isCompleted ? 'bg-green-500' : eventTypeColors[event.event_type]?.dot
                        )} />
                        <span className={cn('font-medium text-sm', isCompleted && 'line-through')}>{event.title}</span>
                        {event.event_time && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            {event.event_time.slice(0, 5)}
                            {event.end_time && ` – ${event.end_time.slice(0, 5)}`}
                          </span>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-xs text-muted-foreground mt-1 pl-4 truncate">{event.description}</p>
                      )}
                    </div>
                  );
                })}

                {/* Current time indicator */}
                {isCurrentHour && (
                  <div
                    className="absolute left-0 right-0 pointer-events-none z-10 flex items-center"
                    style={{ top: `${(nowMinutes / 60) * HOUR_HEIGHT}px` }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0 -ml-1.5" />
                    <div className="flex-1 h-0.5 bg-red-500" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
