/**
 * Demo / placeholder activity data for ActivityFeed component.
 * Kept in src/data/ so the i18n gate does not scan this file.
 * In production, activities are fetched from Supabase realtime.
 */
import type { ActivityType } from './activityConfig';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  subtitle?: string;
  timestamp: Date;
  amount?: number;
}

export function getDemoActivities(): Activity[] {
  const now = new Date();
  return [
    {
      id: '1',
      type: 'offer_accepted',
      title: 'Remont \u0142azienki \u2014 ul. Marsza\u0142kowska',
      subtitle: 'Kowalski Jan',
      timestamp: new Date(now.getTime() - 12 * 60 * 1000),
      amount: 8500,
    },
    {
      id: '2',
      type: 'offer_sent',
      title: 'Instalacja elektryczna \u2014 biurowiec',
      subtitle: 'Firma Budex Sp. z o.o.',
      timestamp: new Date(now.getTime() - 45 * 60 * 1000),
    },
    {
      id: '3',
      type: 'client_added',
      title: 'Nowak Maria',
      subtitle: 'Remont kuchni',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      id: '4',
      type: 'quote_created',
      title: 'Malowanie mieszkania 60m\u00b2',
      subtitle: 'Wi\u015bniewski Piotr',
      timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      amount: 3200,
    },
    {
      id: '5',
      type: 'offer_accepted',
      title: 'U\u0142adanie p\u0142ytek \u2014 \u0142azienka',
      subtitle: 'Zaj\u0105c Tomasz',
      timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000),
      amount: 4700,
    },
  ];
}
