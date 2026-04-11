import { format, isSameMonth, isSameDay, isToday } from 'date-fns';
import type { Locale } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/hooks/useCalendarEvents';
import { eventTypeColors } from './calendarTypes';

interface CalendarMonthViewProps {
  calendarDays: Date[];
  dayNames: string[];
  eventsByDate: Record<string, CalendarEvent[]>;
  selectedDate: Date;
  currentDate: Date;
  isLoading: boolean;
  events: CalendarEvent[];
  setSelectedDate: (date: Date) => void;
  openEventDialog: (date?: Date, event?: CalendarEvent) => void;
  dateLocale: Locale;
}

export function CalendarMonthView({
  calendarDays,
  dayNames,
  eventsByDate,
  selectedDate,
  currentDate,
  isLoading,
  events,
  setSelectedDate,
  openEventDialog,
  dateLocale,
}: CalendarMonthViewProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {dayNames.map(day => (
          <div key={day} className="px-2 py-3 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {calendarDays.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDate[dateKey] || [];
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const isCurrentMonth = isSameMonth(day, currentDate);

          return (
            <div
              key={dateKey}
              role="gridcell"
              tabIndex={0}
              onClick={() => setSelectedDate(day)}
              onDoubleClick={() => openEventDialog(day)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') openEventDialog(day);
                if (e.key === ' ') { e.preventDefault(); setSelectedDate(day); }
              }}
              aria-label={`${format(day, 'd MMMM yyyy', { locale: dateLocale })}${isSelected ? ', zaznaczony' : ''}${isTodayDate ? ', dzisiaj' : ''}`}
              aria-selected={isSelected}
              className={cn(
                'min-h-[100px] sm:min-h-[120px] p-1 sm:p-2 border-r border-b cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
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
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); openEventDialog(day, event); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); openEventDialog(day, event); } }}
                    aria-label={`${event.title}${event.event_time ? `, ${event.event_time.slice(0, 5)}` : ''}`}
                    className={cn(
                      'text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity',
                      event.status === 'completed'
                        ? 'bg-muted/50 border-muted line-through opacity-60'
                        : cn(
                            eventTypeColors[event.event_type]?.bg || eventTypeColors.other.bg,
                            'border',
                            eventTypeColors[event.event_type]?.border || eventTypeColors.other.border
                          )
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
                    +{dayEvents.length - 3} {t('common.more')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {events.length === 0 && !isLoading && (
        <div className="p-6 text-center border-t">
          <p className="text-sm text-muted-foreground">{t('calendar.noEventsHint')}</p>
        </div>
      )}
    </div>
  );
}
