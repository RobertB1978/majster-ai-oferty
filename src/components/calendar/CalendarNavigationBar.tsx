import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ViewMode } from './calendarTypes';

interface CalendarNavigationBarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  navigationTitle: string;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
}

export function CalendarNavigationBar({
  viewMode,
  setViewMode,
  navigationTitle,
  onNavigate,
}: CalendarNavigationBarProps) {
  const { t } = useTranslation();

  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => onNavigate('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => onNavigate('today')}>
            {t('calendar.today')}
          </Button>
          <Button variant="outline" size="icon" onClick={() => onNavigate('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold ml-2 capitalize">{navigationTitle}</h2>
        </div>

        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
          <Button
            variant={viewMode === 'month' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            {t('calendar.month')}
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            {t('calendar.week')}
          </Button>
          <Button
            variant={viewMode === 'day' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('day')}
          >
            {t('calendar.day')}
          </Button>
          <Button
            variant={viewMode === 'agenda' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('agenda')}
          >
            <List className="h-4 w-4 mr-1" />
            {t('calendar.agenda')}
          </Button>
        </div>
      </div>
    </Card>
  );
}
