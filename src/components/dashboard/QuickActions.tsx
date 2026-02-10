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
      primary: true
    },
    {
      label: t('dashboard.addClient', 'Dodaj klienta'),
      icon: Users,
      onClick: () => navigate('/clients'),
    },
    {
      label: t('nav.templates', 'Szablony'),
      icon: FileText,
      onClick: () => navigate('/templates'),
    },
    {
      label: t('nav.calendar', 'Kalendarz'),
      icon: Calendar,
      onClick: () => navigate('/calendar'),
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
            "transition-all duration-200",
            action.primary
              ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
              : "hover:bg-secondary hover:shadow-sm"
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
