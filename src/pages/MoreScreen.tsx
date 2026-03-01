import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  Building2,
  TrendingUp,
  Star,
  Users,
  Settings,
  Trash2,
  CalendarDays,
  Shield,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MoreItem {
  id: string;
  labelKey: string;
  icon: LucideIcon;
  route?: string;
  placeholder?: boolean;
  destructive?: boolean;
}

interface MoreGroup {
  titleKey: string;
  items: MoreItem[];
}

const MORE_GROUPS: MoreGroup[] = [
  {
    titleKey: 'newShell.more.groupDocs',
    items: [
      { id: 'documents',  labelKey: 'newShell.more.documents',  icon: FolderOpen,    placeholder: true },
      { id: 'calendar',   labelKey: 'newShell.more.calendar',   icon: CalendarDays,  route: '/app/calendar' },
      { id: 'guarantees', labelKey: 'newShell.more.guarantees', icon: Shield,        placeholder: true },
    ],
  },
  {
    titleKey: 'newShell.more.groupOrg',
    items: [
      { id: 'profile',   labelKey: 'newShell.more.profile',   icon: Building2, route: '/app/profile' },
      { id: 'finance',   labelKey: 'newShell.more.finance',   icon: TrendingUp, route: '/app/finance' },
      { id: 'quality',   labelKey: 'newShell.more.quality',   icon: Star,      placeholder: true },
      { id: 'clients',   labelKey: 'newShell.more.clients',   icon: Users,     route: '/app/customers' },
    ],
  },
  {
    titleKey: 'newShell.more.groupSettings',
    items: [
      { id: 'settings',       labelKey: 'newShell.more.settings',       icon: Settings, route: '/app/settings' },
      { id: 'deleteAccount',  labelKey: 'newShell.more.deleteAccount',  icon: Trash2,   route: '/app/settings', destructive: true },
    ],
  },
];

/**
 * MoreScreen — ekran "Więcej" nowego shella.
 *
 * Zawiera pogrupowane linki do wszystkich sekcji aplikacji.
 * Ustawienia i Profil Firmy zawsze dostępne (PR-05).
 * Pozycje z `placeholder: true` pokazują etykietę "Wkrótce".
 */
export default function MoreScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 pt-4 pb-3 sticky top-0 z-40">
        <h1 className="text-xl font-bold text-foreground">{t('newShell.more.title', 'Więcej')}</h1>
      </div>

      <div className="px-4 py-4 space-y-6">
        {MORE_GROUPS.map((group) => (
          <section key={group.titleKey} aria-labelledby={`group-${group.titleKey}`}>
            <h2
              id={`group-${group.titleKey}`}
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1"
            >
              {t(group.titleKey)}
            </h2>
            <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
              {group.items.map((item) => (
                <MoreItemRow
                  key={item.id}
                  item={item}
                  onClick={() => {
                    if (!item.placeholder && item.route) {
                      navigate(item.route);
                    }
                  }}
                  t={t}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function MoreItemRow({
  item,
  onClick,
  t,
}: {
  item: MoreItem;
  onClick: () => void;
  t: (key: string) => string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={item.placeholder}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors',
        item.placeholder
          ? 'opacity-50 cursor-default'
          : item.destructive
            ? 'text-destructive hover:bg-destructive/5 active:bg-destructive/10'
            : 'text-foreground hover:bg-secondary/50 active:bg-secondary'
      )}
    >
      <item.icon
        className={cn(
          'h-5 w-5 shrink-0',
          item.destructive ? 'text-destructive' : 'text-muted-foreground'
        )}
      />
      <span className="flex-1 text-sm font-medium">{t(item.labelKey)}</span>
      {item.placeholder ? (
        <span className="text-[11px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
          {t('nav.comingSoon', 'Wkrótce')}
        </span>
      ) : (
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      )}
    </button>
  );
}
