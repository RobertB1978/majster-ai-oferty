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
  icon: LucideIcon;
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
 * Grupowanie jest celowe: Finanse i Klienci to narzędzia pracy, nie ustawienia.
 * Ustawienia i Profil firmy razem wyznaczają granicę "konfiguracja konta".
 *
 * Wywołane wewnątrz komponentu, by FF_READY_DOCUMENTS_ENABLED był czytany
 * przy każdym renderze (potrzebne m.in. do testów z mockowaną flagą).
 */
function buildMoreGroups(): MoreGroup[] {
  return [
    {
      titleKey: 'newShell.more.groupTools',
      items: [
        { id: 'calendar',           labelKey: 'newShell.more.calendar',          icon: CalendarDays, route: '/app/calendar' },
        { id: 'document-templates', labelKey: 'newShell.more.documentTemplates', icon: BookOpen,     route: '/app/document-templates' },
        ...(FF_READY_DOCUMENTS_ENABLED
          ? [{ id: 'ready-documents', labelKey: 'newShell.more.readyDocuments', icon: FileCheck, route: '/app/ready-documents' } as MoreItem]
          : []
        ),
        { id: 'finance',            labelKey: 'newShell.more.finance',           icon: TrendingUp,   route: '/app/finance' },
        { id: 'photos',             labelKey: 'newShell.more.photos',            icon: Camera,       route: '/app/photos' },
        { id: 'clients',            labelKey: 'newShell.more.clients',           icon: Users,        route: '/app/customers' },
        { id: 'team',               labelKey: 'nav.team',                        icon: UserPlus,     route: '/app/team' },
        // { id: 'marketplace',        labelKey: 'nav.marketplace',                 icon: Store,        route: '/app/marketplace' }, // hidden temporarily
      ],
    },
    {
      titleKey: 'newShell.more.groupAccount',
      items: [
        { id: 'profile',  labelKey: 'newShell.more.profile',  icon: Building2, route: '/app/profile' },
        { id: 'settings', labelKey: 'newShell.more.settings', icon: Settings,  route: '/app/settings' },
      ],
    },
  ];
}

/**
 * MoreScreen — ekran "Więcej" nowego shella.
 *
 * Dwie celowe grupy:
 *  - Narzędzia: Kalendarz, Wzory dokumentów, [Gotowe dokumenty — gdy FF_READY_DOCUMENTS_ENABLED], Finanse, Klienci
 *  - Firma i konto: Profil firmy, Ustawienia
 *
 * Ustawienia i Profil Firmy zawsze dostępne (PR-05).
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
          {t('nav.comingSoon')}
        </span>
      ) : (
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      )}
    </button>
  );
}
