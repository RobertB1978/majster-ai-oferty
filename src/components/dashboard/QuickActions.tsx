import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Plus, Users, FileText, Calendar, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function QuickActions() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const actions = [
    { 
      label: t('dashboard.newProject', 'Nowy projekt'), 
      icon: Plus, 
      onClick: () => navigate('/projects/new'),
      gradient: 'from-primary via-purple-500 to-pink-500',
      primary: true 
    },
    { 
      label: t('dashboard.addClient', 'Dodaj klienta'), 
      icon: Users, 
      onClick: () => navigate('/clients'),
      hoverGradient: 'hover:from-violet-500/10 hover:to-purple-500/10'
    },
    { 
      label: t('nav.templates', 'Szablony'), 
      icon: FileText, 
      onClick: () => navigate('/templates'),
      hoverGradient: 'hover:from-blue-500/10 hover:to-cyan-500/10'
    },
    { 
      label: t('nav.calendar', 'Kalendarz'), 
      icon: Calendar, 
      onClick: () => navigate('/calendar'),
      hoverGradient: 'hover:from-emerald-500/10 hover:to-teal-500/10'
    },
  ];

  return (
    <div 
      className="flex flex-wrap gap-3 animate-fade-in opacity-0" 
      style={{ animationDelay: '0.25s', animationFillMode: 'forwards' }}
    >
      {actions.map((action, index) => (
        <Button
          key={action.label}
          variant={action.primary ? 'default' : 'outline'}
          size="lg"
          onClick={action.onClick}
          className={cn(
            "transition-all duration-300 hover:scale-105",
            action.primary 
              ? `bg-gradient-to-r ${action.gradient} shadow-xl hover:shadow-2xl hover:shadow-primary/30` 
              : `hover:bg-gradient-to-r ${action.hoverGradient} hover:shadow-md`
          )}
          style={{ animationDelay: `${0.25 + index * 0.05}s` }}
        >
          {action.primary && <Sparkles className="mr-2 h-4 w-4" />}
          <action.icon className={cn("h-5 w-5", action.primary ? "" : "mr-2")} />
          <span className={action.primary ? "ml-1" : ""}>{action.label}</span>
        </Button>
      ))}
    </div>
  );
}
