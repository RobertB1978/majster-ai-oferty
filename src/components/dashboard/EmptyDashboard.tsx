import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  FolderPlus,
  FileText,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  Zap,
  Shield
} from 'lucide-react';

const benefits = [
  {
    icon: FileText,
    title: 'Profesjonalne wyceny',
    description: 'Twórz szczegółowe wyceny z podziałem na materiały i robociznę',
    bg: 'bg-primary/10',
    iconBg: 'bg-primary',
  },
  {
    icon: TrendingUp,
    title: 'Śledź przychody',
    description: 'Analizuj rentowność projektów i optymalizuj cenniki',
    bg: 'bg-success/10',
    iconBg: 'bg-success',
  },
  {
    icon: Clock,
    title: 'Oszczędzaj czas',
    description: 'Automatyczne obliczenia i szablony przyspieszają pracę',
    bg: 'bg-warning/10',
    iconBg: 'bg-warning',
  },
];

const features = [
  { icon: Zap, label: 'AI Sugestie' },
  { icon: Shield, label: 'Bezpieczeństwo' },
  { icon: Sparkles, label: 'Automatyzacja' },
];

export function EmptyDashboard() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-fade-in">
      <div className="relative mb-8">
        <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-primary shadow-lg">
          <Sparkles className="h-14 w-14 text-primary-foreground" />
        </div>
      </div>

      <h1 className="text-4xl font-bold mb-3 text-foreground">
        Witaj w Majster.AI
      </h1>
      <p className="text-muted-foreground max-w-lg mb-4 text-lg">
        Twój inteligentny asystent do tworzenia profesjonalnych wycen i zarządzania projektami budowlanymi.
      </p>

      {/* Feature pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {features.map((feature, i) => (
          <div
            key={feature.label}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-muted-foreground animate-fade-in"
            style={{ animationDelay: `${0.3 + i * 0.1}s` }}
          >
            <feature.icon className="h-3.5 w-3.5 text-primary" />
            {feature.label}
          </div>
        ))}
      </div>

      <Button
        size="lg"
        onClick={() => navigate('/projects/new')}
        className="mb-12 shadow-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 text-lg px-8 py-6"
      >
        <FolderPlus className="mr-2 h-5 w-5" />
        Utwórz pierwszy projekt
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>

      <div className="grid gap-6 sm:grid-cols-3 max-w-4xl w-full">
        {benefits.map((benefit, index) => (
          <div
            key={benefit.title}
            className="animate-fade-in-up"
            style={{ animationDelay: `${0.3 + index * 0.15}s` }}
          >
            <Card className="h-full border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
              <CardContent className="p-6 text-center relative">
                <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${benefit.iconBg} shadow-sm`}>
                  <benefit.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
