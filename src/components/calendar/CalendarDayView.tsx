import { format } from 'date-fns';
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

export function CalendarDayView({ selectedDate, eventsByDate, openEventDialog, dateLocale }: CalendarDayViewProps) {
  const { t } = useTranslation();
  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const dayEvents = eventsByDate[dateKey] || [];

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      <div className="p-4 border-b bg-muted/30">
        <h3 className="text-lg font-semibold">{format(selectedDate, 'EEEE, d MMMM yyyy', { locale: dateLocale })}</h3>
        <p className="text-sm text-muted-foreground">
          {dayEvents.length === 0
            ? t('calendar.noEventsForDay', 'No events — click any slot to add one')
            : `${dayEvents.length} ${t('analytics.allEvents').toLowerCase()}`}
        </p>
      </div>
      <div className="max-h-[600px] overflow-y-auto">
        {HOURS.map(hour => {
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
}
