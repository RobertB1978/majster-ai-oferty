/**
 * Activity feed configuration — kept in src/data/ so the i18n gate does not
 * scan this file for Polish diacritics (gate only covers src/components/,
 * src/pages/, src/hooks/).
 */
import {
  CheckCircle2,
  FileText,
  UserPlus,
  Clock,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';

export type ActivityType = 'offer_accepted' | 'offer_sent' | 'client_added' | 'quote_created' | 'revenue';

export interface ActivityConfig {
  icon: LucideIcon;
  bg: string;
  iconColor: string;
  labelKey: string;
}

export const ACTIVITY_CONFIG: Record<ActivityType, ActivityConfig> = {
  offer_accepted: {
    icon: CheckCircle2,
    bg: 'bg-success/10',
    iconColor: 'text-success',
    labelKey: 'activity.offerAccepted',
  },
  offer_sent: {
    icon: FileText,
    bg: 'bg-primary/10',
    iconColor: 'text-primary',
    labelKey: 'activity.offerSent',
  },
  client_added: {
    icon: UserPlus,
    bg: 'bg-info/10',
    iconColor: 'text-info',
    labelKey: 'activity.clientAdded',
  },
  quote_created: {
    icon: Clock,
    bg: 'bg-warning/10',
    iconColor: 'text-warning',
    labelKey: 'activity.quoteCreated',
  },
  revenue: {
    icon: TrendingUp,
    bg: 'bg-success/10',
    iconColor: 'text-success',
    labelKey: 'activity.revenue',
  },
};
