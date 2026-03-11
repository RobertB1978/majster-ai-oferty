import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FolderOpen, Users, FileText, Calendar, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Action {
  label: string;
  sublabel?: string;
  icon: LucideIcon;
  onClick: () => void;
  color: 'blue' | 'green' | 'teal' | 'violet';
}

const colorMap = {
  blue: {
    card: 'bg-blue-50/70 hover:bg-blue-50 dark:bg-blue-900/10 dark:hover:bg-blue-900/20 text-foreground border-blue-100 dark:border-blue-800/30',
    icon: 'bg-blue-100 dark:bg-blue-800/40',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    card: 'bg-green-50/70 hover:bg-green-50 dark:bg-green-900/10 dark:hover:bg-green-900/20 text-foreground border-green-100 dark:border-green-800/30',
    icon: 'bg-green-100 dark:bg-green-800/40',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  teal: {
    card: 'bg-teal-50/70 hover:bg-teal-50 dark:bg-teal-900/10 dark:hover:bg-teal-900/20 text-foreground border-teal-100 dark:border-teal-800/30',
    icon: 'bg-teal-100 dark:bg-teal-800/40',
    iconColor: 'text-teal-600 dark:text-teal-400',
  },
  violet: {
    card: 'bg-violet-50/70 hover:bg-violet-50 dark:bg-violet-900/10 dark:hover:bg-violet-900/20 text-foreground border-violet-100 dark:border-violet-800/30',
    icon: 'bg-violet-100 dark:bg-violet-800/40',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
} as const;

export function QuickActions() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const actions: Action[] = [
    {
      label: t('nav.projects', 'Projekty'),
      sublabel: t('dashboard.projectsSub', 'Twoje zlecenia'),
      icon: FolderOpen,
      onClick: () => navigate('/app/projects'),
      color: 'blue',
    },
    {
      label: t('dashboard.addClient', 'Dodaj klienta'),
      sublabel: t('dashboard.addClientSub'),
      icon: Users,
      onClick: () => navigate('/app/customers'),
      color: 'green',
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
                <Icon className={cn(cfg.iconColor)} style={{ width: '18px', height: '18px' }} />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">{action.label}</p>
                {action.sublabel && (
                  <p className="text-[11px] leading-tight mt-0.5 text-muted-foreground">
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
