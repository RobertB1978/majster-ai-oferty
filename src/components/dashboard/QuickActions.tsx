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
    card: 'bg-ds-accent-blue-subtle hover:bg-muted dark:bg-ds-accent-blue-subtle dark:hover:bg-muted text-foreground border-border',
    icon: 'bg-ds-accent-blue-subtle dark:bg-ds-accent-blue-subtle',
    iconColor: 'text-ds-accent-blue dark:text-ds-accent-blue-light',
  },
  green: {
    card: 'bg-success/8 hover:bg-success/[0.12] dark:bg-success/10 dark:hover:bg-success/[0.15] text-foreground border-success/10',
    icon: 'bg-success/15 dark:bg-success/20',
    iconColor: 'text-success',
  },
  teal: {
    card: 'bg-warning/8 hover:bg-warning/[0.12] dark:bg-warning/10 dark:hover:bg-warning/[0.15] text-foreground border-warning/10',
    icon: 'bg-warning/15 dark:bg-warning/20',
    iconColor: 'text-warning',
  },
  violet: {
    card: 'bg-primary/8 hover:bg-primary/[0.12] dark:bg-primary/10 dark:hover:bg-primary/[0.15] text-foreground border-primary/10',
    icon: 'bg-primary/15 dark:bg-primary/20',
    iconColor: 'text-primary',
  },
} as const;

export function QuickActions() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const actions: Action[] = [
    {
      label: t('nav.projects'),
      sublabel: t('dashboard.projectsSub'),
      icon: FolderOpen,
      onClick: () => navigate('/app/projects'),
      color: 'blue',
    },
    {
      label: t('dashboard.addClient'),
      sublabel: t('dashboard.addClientSub'),
      icon: Users,
      onClick: () => navigate('/app/customers'),
      color: 'green',
    },
    {
      label: t('nav.templates'),
      sublabel: t('dashboard.templatesSub'),
      icon: FileText,
      onClick: () => navigate('/app/templates'),
      color: 'teal',
    },
    {
      label: t('nav.calendar'),
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
              variants={{ cardHovered: { y: -2, transition: { duration: 0.15 } } }}
              whileHover="cardHovered"
              whileTap={{ scale: 0.96 }}
              onClick={action.onClick}
              className={cn(
                'flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                cfg.card
              )}
            >
              <motion.div
                variants={{
                  cardHovered: {
                    rotate: 8,
                    scale: 1.12,
                    transition: { type: 'spring', stiffness: 400, damping: 20 },
                  },
                }}
                className={cn('flex h-9 w-9 items-center justify-center rounded-xl', cfg.icon)}
              >
                <Icon className={cn('h-5 w-5', cfg.iconColor)} />
              </motion.div>
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
