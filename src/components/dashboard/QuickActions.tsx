import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Users, FileText, Calendar, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Action {
  label: string;
  sublabel?: string;
  icon: LucideIcon;
  onClick: () => void;
  primary?: boolean;
  color: 'primary' | 'slate' | 'teal' | 'violet';
}

const colorMap = {
  primary: {
    card: 'bg-primary hover:bg-primary/90 text-white border-transparent shadow-md',
    icon: 'bg-white/20',
  },
  slate: {
    card: 'bg-card hover:bg-muted/60 text-foreground border-border/60',
    icon: 'bg-muted',
  },
  teal: {
    card: 'bg-card hover:bg-muted/60 text-foreground border-border/60',
    icon: 'bg-muted',
  },
  violet: {
    card: 'bg-card hover:bg-muted/60 text-foreground border-border/60',
    icon: 'bg-muted',
  },
} as const;

export function QuickActions() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const actions: Action[] = [
    {
      label: t('dashboard.newProject', 'Nowy projekt'),
      sublabel: t('dashboard.newProjectSub'),
      icon: Plus,
      onClick: () => navigate('/app/jobs/new'),
      primary: true,
      color: 'primary',
    },
    {
      label: t('dashboard.addClient', 'Dodaj klienta'),
      sublabel: t('dashboard.addClientSub'),
      icon: Users,
      onClick: () => navigate('/app/customers'),
      color: 'slate',
    },
    {
      label: t('nav.templates', 'Szablony'),
      sublabel: t('dashboard.templatesSub'),
      icon: FileText,
      onClick: () => navigate('/app/templates'),
      color: 'teal',
    },
    {
      label: t('nav.calendar', 'Kalendarz'),
      sublabel: t('dashboard.calendarSub'),
      icon: Calendar,
      onClick: () => navigate('/app/calendar'),
      color: 'violet',
    },
  ];

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
        {t('dashboard.quickActions')}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((action, index) => {
          const cfg = colorMap[action.color];
          const Icon = action.icon;

          return (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.96 }}
              onClick={action.onClick}
              className={cn(
                'flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                cfg.card
              )}
            >
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', cfg.icon)}>
                <Icon className={cn('h-4.5 w-4.5', action.primary ? 'text-white' : 'text-foreground')} style={{ width: '18px', height: '18px' }} />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">{action.label}</p>
                {action.sublabel && (
                  <p className={cn('text-[11px] leading-tight mt-0.5', action.primary ? 'text-white/70' : 'text-muted-foreground')}>
                    {action.sublabel}
                  </p>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
