import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Info } from 'lucide-react';

interface CalendarProvider {
  id: string;
  name: string;
  icon: string;
}

const CALENDAR_PROVIDERS: CalendarProvider[] = [
  { id: 'google', name: 'Google Calendar', icon: '📅' },
  { id: 'outlook', name: 'Microsoft Outlook', icon: '📧' },
  { id: 'apple', name: 'Apple Calendar', icon: '🍎' },
];

/**
 * CalendarSync — sekcja integracji z zewnętrznymi kalendarzami w Ustawieniach.
 *
 * Status: integracja OAuth z Google/Outlook/Apple nie jest jeszcze wdrożona.
 * Komponent pokazuje planowane dostawce bez aktywnych przycisków "Połącz",
 * żeby użytkownicy bety nie trafiały w martwy punkt.
 */
export function CalendarSync() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Honest beta notice */}
      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          {t(
            'calendarSync.betaNotice',
            'Synchronizacja z zewnętrznymi kalendarzami (Google, Outlook, Apple) jest w przygotowaniu. Zostanie udostępniona w kolejnej wersji.'
          )}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('calendarSync.title', 'Synchronizacja kalendarzy')}
          </CardTitle>
          <CardDescription>
            {t('calendarSync.description', 'Połącz zewnętrzne kalendarze, aby synchronizować wydarzenia')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {CALENDAR_PROVIDERS.map((provider) => (
            <div
              key={provider.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card opacity-60"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{provider.icon}</span>
                <p className="font-medium">{provider.name}</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {t('nav.comingSoon', 'Wkrótce')}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
