import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="flex flex-wrap gap-3"
    >
      {actions.map((action, index) => (
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
    </motion.div>
  );
}
