import { format, isToday, parseISO } from 'date-fns';
import type { Locale } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/hooks/useCalendarEvents';
import { eventTypeColors } from './calendarTypes';

interface CalendarAgendaViewProps {
  eventsByDate: Record<string, CalendarEvent[]>;
  openEventDialog: (date?: Date, event?: CalendarEvent) => void;
  dateLocale: Locale;
}

export function CalendarAgendaView({ eventsByDate, openEventDialog, dateLocale }: CalendarAgendaViewProps) {
  const { t } = useTranslation();
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
            const [y, m, d] = dateKey.split('-').map(Number);
            const date = new Date(y, m - 1, d);
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
                <div className="space-y-2 ml-4">
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
}
