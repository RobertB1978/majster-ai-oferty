import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  TrendingUp,
  Users,
  Settings,
  CalendarDays,
  BookOpen,
  FileCheck,
  Camera,
  ChevronRight,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FF_READY_DOCUMENTS_ENABLED } from '@/config/featureFlags';

interface MoreItem {
  id: string;
  labelKey: string;
  /** Optional subtitle translation key */
  descKey?: string;
  icon: LucideIcon;
  /** Tailwind classes for icon wrapper (bg + text color) */
  iconStyle: string;
  route?: string;
  placeholder?: boolean;
  destructive?: boolean;
}

interface MoreGroup {
  titleKey: string;
  items: MoreItem[];
}

/**
 * Buduje grupy nawigacyjne dla ekranu "Więcej".
 *
 * "Narzędzia"      — operacyjne moduły (spójne z desktopowym sidebarem)
 * "Firma i konto"  — konfiguracja: profil + ustawienia
 *
 * Wywołane wewnątrz komponentu, by FF_READY_DOCUMENTS_ENABLED był czytany
 * przy każdym renderze (potrzebne m.in. do testów z mockowaną flagą).
 */
function buildMoreGroups(): MoreGroup[] {
  return [
    {
      titleKey: 'newShell.more.groupTools',
      items: [
        {
          id: 'calendar',
          labelKey: 'newShell.more.calendar',
          icon: CalendarDays,
          iconStyle: 'bg-info/10 text-info',
          route: '/app/calendar',
        },
        {
          id: 'document-templates',
          labelKey: 'newShell.more.documentTemplates',
          icon: BookOpen,
          iconStyle: 'bg-category-protocol text-category-protocol',
          route: '/app/document-templates',
        },
        ...(FF_READY_DOCUMENTS_ENABLED
          ? [{
              id: 'ready-documents',
              labelKey: 'newShell.more.readyDocuments',
              icon: FileCheck,
              iconStyle: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
              route: '/app/ready-documents',
            } as MoreItem]
          : []
        ),
        {
          id: 'finance',
          labelKey: 'newShell.more.finance',
          icon: TrendingUp,
          iconStyle: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
          route: '/app/finance',
        },
        {
          id: 'photos',
          labelKey: 'newShell.more.photos',
          icon: Camera,
          iconStyle: 'bg-accent-amber/10 text-accent-amber',
          route: '/app/photos',
        },
        {
          id: 'clients',
          labelKey: 'newShell.more.clients',
          icon: Users,
          iconStyle: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
          route: '/app/customers',
        },
        {
          id: 'team',
          labelKey: 'nav.team',
          icon: UserPlus,
          iconStyle: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
          route: '/app/team',
        },
        // { id: 'marketplace', labelKey: 'nav.marketplace', icon: Store, iconStyle: '...', route: '/app/marketplace' }, // hidden temporarily
      ],
    },
    {
      titleKey: 'newShell.more.groupAccount',
      items: [
        {
          id: 'profile',
          labelKey: 'newShell.more.profile',
          icon: Building2,
          iconStyle: 'bg-warning/10 text-warning',
          route: '/app/profile',
        },
        {
          id: 'settings',
          labelKey: 'newShell.more.settings',
          icon: Settings,
          iconStyle: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
          route: '/app/settings',
        },
      ],
    },
  ];
}

/**
 * MoreScreen — ekran "Więcej" nowego shella.
 *
 * Dwie celowe grupy:
 *  - Narzędzia: Kalendarz, Wzory dokumentów, [Gotowe dokumenty — gdy FF_READY_DOCUMENTS_ENABLED], Finanse, Zdjęcia, Klienci, Zespół
 *  - Firma i konto: Profil firmy, Ustawienia
 *
 * Profil firmy i Ustawienia zawsze dostępne (PR-05).
 * Design: kolorowe ikony w zaokrąglonych kwadratach (enterprise/iOS-style).
 */
export default function MoreScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const groups = buildMoreGroups();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 pt-4 pb-3 sticky top-12 z-40">
        <h1 className="text-xl font-bold text-foreground">{t('newShell.more.title')}</h1>
      </div>

      <div className="px-4 py-4 space-y-6">
        {groups.map((group) => (
          <section key={group.titleKey} aria-labelledby={`group-${group.titleKey}`}>
            <h2
              id={`group-${group.titleKey}`}
              className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-2 px-1"
            >
              {t(group.titleKey)}
            </h2>
            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm divide-y divide-border/50">
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
        'w-full flex items-center gap-3.5 px-4 py-3 text-left transition-all duration-150 active:scale-[0.99]',
        item.placeholder
          ? 'opacity-50 cursor-default'
          : item.destructive
            ? 'text-destructive hover:bg-destructive/5 active:bg-destructive/10'
            : 'text-foreground hover:bg-secondary/50 active:bg-secondary'
      )}
    >
      {/* Colored icon badge */}
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
          item.destructive ? 'bg-destructive/10 text-destructive' : item.iconStyle
        )}
      >
        <item.icon className="h-5 w-5" />
      </div>

      {/* Label (+ optional desc) */}
      <div className="flex-1 min-w-0">
        <span className="block text-sm font-medium leading-snug">{t(item.labelKey)}</span>
        {item.descKey && (
          <span className="block text-xs text-muted-foreground truncate">{t(item.descKey)}</span>
        )}
      </div>

      {/* Right side */}
      {item.placeholder ? (
        <span className="text-[10px] font-semibold text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full shrink-0">
          {t('nav.comingSoon')}
        </span>
      ) : (
        <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
      )}
    </button>
  );
}
