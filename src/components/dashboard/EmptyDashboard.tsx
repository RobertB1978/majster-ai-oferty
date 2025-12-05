import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FolderPlus, 
  FileText, 
  TrendingUp, 
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const benefits = [
  {
    icon: FileText,
    title: 'Profesjonalne wyceny',
    description: 'Twórz szczegółowe wyceny z podziałem na materiały i robociznę',
  },
  {
    icon: TrendingUp,
    title: 'Śledź przychody',
    description: 'Analizuj rentowność projektów i optymalizuj cenniki',
  },
  {
    icon: Clock,
    title: 'Oszczędzaj czas',
    description: 'Automatyczne obliczenia i szablony przyspieszają pracę',
  },
];

export function EmptyDashboard() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-xl">
          <Sparkles className="h-12 w-12 text-primary-foreground" />
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-3">
        Witaj w Majster.AI
      </h1>
      <p className="text-muted-foreground max-w-md mb-8">
        Twój asystent do tworzenia profesjonalnych wycen i zarządzania projektami budowlanymi.
        Zacznij od utworzenia pierwszego projektu.
      </p>

      <Button 
        size="lg" 
        onClick={() => navigate('/projects/new')}
        className="mb-12 shadow-lg"
      >
        <FolderPlus className="mr-2 h-5 w-5" />
        Utwórz pierwszy projekt
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>

      <div className="grid gap-6 sm:grid-cols-3 max-w-3xl">
        {benefits.map((benefit, index) => (
          <div
            key={benefit.title}
            className="animate-fade-in"
            style={{ animationDelay: `${0.2 + index * 0.1}s` }}
          >
            <Card className="h-full">
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
