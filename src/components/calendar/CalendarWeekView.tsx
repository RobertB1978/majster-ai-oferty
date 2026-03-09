import { format, isToday } from 'date-fns';
import type { Locale } from 'date-fns';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/hooks/useCalendarEvents';
import { eventTypeColors, HOURS } from './calendarTypes';

interface CalendarWeekViewProps {
  weekDays: Date[];
  eventsByDate: Record<string, CalendarEvent[]>;
  openEventDialog: (date?: Date, event?: CalendarEvent) => void;
  dateLocale: Locale;
}

export function CalendarWeekView({ weekDays, eventsByDate, openEventDialog, dateLocale }: CalendarWeekViewProps) {
  return (
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
        {HOURS.map(hour => (
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
}
