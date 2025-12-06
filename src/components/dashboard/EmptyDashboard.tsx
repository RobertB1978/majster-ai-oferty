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
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-500/10 to-cyan-500/10',
  },
  {
    icon: TrendingUp,
    title: 'Śledź przychody',
    description: 'Analizuj rentowność projektów i optymalizuj cenniki',
    gradient: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-emerald-500/10 to-teal-500/10',
  },
  {
    icon: Clock,
    title: 'Oszczędzaj czas',
    description: 'Automatyczne obliczenia i szablony przyspieszają pracę',
    gradient: 'from-violet-500 to-purple-500',
    bgGradient: 'from-violet-500/10 to-purple-500/10',
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
      {/* Background mesh gradient */}
      <div className="fixed inset-0 bg-mesh-gradient pointer-events-none opacity-50" />
      
      {/* Floating decorations */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl animate-float" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-br from-accent/30 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-500 to-pink-500 rounded-full blur-3xl opacity-30 animate-pulse-glow" />
        <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 shadow-2xl shadow-primary/30">
          <Sparkles className="h-14 w-14 text-white" />
        </div>
      </div>

      <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 text-sm text-muted-foreground animate-fade-in"
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
        className="mb-12 shadow-xl bg-gradient-to-r from-primary via-purple-500 to-pink-500 hover:shadow-2xl hover:shadow-primary/30 hover:scale-105 transition-all duration-300 text-lg px-8 py-6"
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
            <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
              <div className={`absolute inset-0 bg-gradient-to-br ${benefit.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <CardContent className="p-6 text-center relative">
                <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${benefit.gradient} shadow-lg`}>
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
