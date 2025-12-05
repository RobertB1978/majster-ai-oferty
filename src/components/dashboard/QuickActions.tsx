import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Users, FileText, Calendar } from 'lucide-react';

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    { 
      label: 'Nowy projekt', 
      icon: Plus, 
      onClick: () => navigate('/projects/new'),
      primary: true 
    },
    { 
      label: 'Dodaj klienta', 
      icon: Users, 
      onClick: () => navigate('/clients') 
    },
    { 
      label: 'Szablony', 
      icon: FileText, 
      onClick: () => navigate('/templates') 
    },
    { 
      label: 'Kalendarz', 
      icon: Calendar, 
      onClick: () => navigate('/calendar') 
    },
  ];

  return (
    <div className="flex flex-wrap gap-3 animate-fade-in opacity-0" style={{ animationDelay: '0.25s' }}>
      {actions.map((action) => (
        <Button
          key={action.label}
          variant={action.primary ? 'default' : 'outline'}
          size="lg"
          onClick={action.onClick}
          className={action.primary ? 'shadow-lg' : ''}
        >
          <action.icon className="mr-2 h-5 w-5" />
          {action.label}
        </Button>
      ))}
    </div>
  );
}
