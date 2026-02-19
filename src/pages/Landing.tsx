import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  HardHat,
  Calculator,
  FileText,
  Users,
  ArrowRight,
  ArrowDown,
  Shield,
  Clock,
  Smartphone,
  BarChart3,
  Bot,
  Camera,
  CreditCard,
  CheckCircle2,
  Zap,
  TrendingUp,
  FolderKanban,
  Star,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

const features = [
  {
    icon: Calculator,
    title: 'Szybkie wyceny',
    description: 'Twórz profesjonalne wyceny w minuty, nie godziny. Dyktuj głosem, użyj AI lub utwórz ręcznie.',
    benefits: ['Wycena głosem w 2 minuty', 'AI sugestie cenowe', 'Szablony pozycji'],
  },
  {
    icon: FileText,
    title: 'PDF i oferty',
    description: 'Generuj dokumenty gotowe do wysyłki jednym kliknięciem. Klient zatwierdza online.',
    benefits: ['Profesjonalny PDF z logo', 'Wysyłka mailem', 'Podpis elektroniczny'],
  },
  {
    icon: Users,
    title: 'Baza klientów',
    description: 'Cała historia projektów klienta w jednym miejscu. Automatyczne przypomnienia o follow-up.',
    benefits: ['Historia projektów', 'Dane kontaktowe', 'Notatki i tagi'],
  },
  {
    icon: FolderKanban,
    title: 'Zarządzanie projektami',
    description: 'Śledź status każdego projektu od wyceny po zakończenie. Zdjęcia z budowy jako dowód prac.',
    benefits: ['Status workflow', 'Zdjęcia z budowy', 'Dokumentacja prac'],
  },
  {
    icon: Clock,
    title: 'Kalendarz projektów',
    description: 'Planuj prace, śledź terminy, zarządzaj zespołem. Nigdy nie przegapisz terminu.',
    benefits: ['Widok tygodnia/miesiąca', 'Przypomnienia', 'Koordynacja zespołu'],
  },
  {
    icon: TrendingUp,
    title: 'Finanse i koszty',
    description: 'Kontroluj rentowność każdego projektu. Śledź przychody, koszty materiałów i robocizny.',
    benefits: ['Zysk na projekcie', 'Koszty materiałów', 'Raporty finansowe'],
  },
  {
    icon: Bot,
    title: 'AI Asystent',
    description: 'Inteligentny asystent pomoże Ci z wycenami, odpowie na pytania i zasugeruje rozwiązania.',
    benefits: ['Czat AI 24/7', 'Sugestie cenowe', 'Analiza zdjęć'],
  },
  {
    icon: BarChart3,
    title: 'Analityka biznesu',
    description: 'Dashboardy pokazują jak rośnie Twój biznes. Podejmuj lepsze decyzje na podstawie danych.',
    benefits: ['Trendy przychodów', 'Statystyki projektów', 'Konwersja ofert'],
  },
  {
    icon: Smartphone,
    title: 'Działa na telefonie',
    description: 'Pełna funkcjonalność na budowie. Duże przyciski, czytelny interfejs, działa offline.',
    benefits: ['Aplikacja mobilna', 'Tryb offline', 'Interfejs na rękawice'],
  },
  {
    icon: Camera,
    title: 'Zdjęcia z budowy',
    description: 'Dokumentuj postęp prac zdjęciami. AI przeanalizuje zdjęcie i pomoże z wyceną.',
    benefits: ['Galeria projektów', 'Wycena ze zdjęcia', 'Dowody prac'],
  },
  {
    icon: CreditCard,
    title: 'Plany i rozliczenia',
    description: 'Zacznij za darmo, upgrade gdy rośniesz. Przejrzyste ceny bez ukrytych opłat.',
    benefits: ['Plan darmowy', 'Pro dla zespołów', 'Faktura VAT'],
  },
  {
    icon: Shield,
    title: 'Bezpieczeństwo danych',
    description: 'Szyfrowanie, kopie zapasowe, pełna zgodność z RODO. Twoje dane są bezpieczne.',
    benefits: ['Szyfrowanie SSL', 'Kopie zapasowe', 'Zgodność z RODO'],
  },
];

const stats = [
  { value: '2 min', label: 'Średni czas wyceny' },
  { value: '85%', label: 'Szybciej niż ręcznie' },
  { value: '100%', label: 'Zgodność z RODO' },
  { value: '24/7', label: 'Dostęp do danych' },
];

const testimonials = [
  {
    name: 'Marek K.',
    role: 'Właściciel firmy remontowej',
    text: 'Wreszcie mogę robić wyceny prosto z budowy. Klient dostaje PDF w 5 minut.',
  },
  {
    name: 'Tomasz W.',
    role: 'Elektryk, jednoosobowa firma',
    text: 'Dyktowanie wyceny głosem to game changer. Oszczędzam 2 godziny dziennie.',
  },
  {
    name: 'Anna S.',
    role: 'Biuro projektowe',
    text: 'Zarządzanie klientami i projektami w jednym miejscu. Polecam każdemu fachowcowi.',
  },
];

function scrollToFeatures() {
  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
}

export default function Landing() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <HardHat className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Majster.AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <button onClick={scrollToFeatures} className="hover:text-foreground transition-colors">
              Funkcje
            </button>
            <a href="#stats" className="hover:text-foreground transition-colors">
              Dlaczego my
            </a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">
              Opinie
            </a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Przełącz motyw">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link to="/login">Zaloguj się</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/register">
                Wypróbuj za darmo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border bg-card">
        <div className="container py-16 md:py-24 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Zap className="h-4 w-4" />
              Cyfrowe narzędzie dla branży budowlanej
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Zarządzaj firmą
              <span className="block text-primary">jak profesjonalista</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto">
              Wyceny, oferty, projekty, klienci i finanse — wszystko w jednym miejscu.
              Stworzony dla ekip budowlanych i remontowych w Polsce.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="h-14 px-8 text-base" asChild>
                <Link to="/register">
                  Zacznij za darmo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-base"
                onClick={scrollToFeatures}
              >
                Zobacz funkcje
                <ArrowDown className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Bez karty kredytowej. Darmowy plan na start.
            </p>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section id="stats" className="border-b border-border bg-card">
        <div className="container py-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - detailed */}
      <section id="features" className="py-16 md:py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold md:text-4xl">
              Wszystko czego potrzebujesz na budowie
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground text-lg">
              Jeden system zastępuje notatnik, Excela, maila i WhatsAppa.
              Każda funkcja zaprojektowana z myślą o fachowcach.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="border hover:border-primary/30 hover:shadow-md transition-all duration-200 group">
                <CardContent className="pt-6 pb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary group-hover:border-primary transition-colors duration-200">
                    <feature.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors duration-200" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {feature.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-20 border-t border-border bg-card">
        <div className="container">
          <h2 className="text-center text-3xl font-bold mb-12">
            Jak to działa?
          </h2>
          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            {[
              {
                step: '1',
                title: 'Załóż konto',
                desc: 'Rejestracja trwa 30 sekund. Bez karty kredytowej.',
              },
              {
                step: '2',
                title: 'Dodaj projekt',
                desc: 'Utwórz projekt i stwórz wycenę — ręcznie, głosem lub z AI.',
              },
              {
                step: '3',
                title: 'Wyślij ofertę',
                desc: 'Wygeneruj PDF, wyślij klientowi mailem. Klient zatwierdza online.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 md:py-20 border-t border-border">
        <div className="container">
          <h2 className="text-center text-3xl font-bold mb-12">
            Co mówią fachowcy
          </h2>
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {testimonials.map((t) => (
              <Card key={t.name} className="border">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-accent text-accent-foreground">
        <div className="container py-16 text-center">
          <h2 className="text-3xl font-bold">Gotowy na cyfrową zmianę?</h2>
          <p className="mt-4 text-accent-foreground/80 max-w-xl mx-auto">
            Dołącz do fachowców, którzy oszczędzają czas i zarabiają więcej.
            Zacznij od darmowego planu — bez zobowiązań.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="h-14 px-8 text-base" asChild>
              <Link to="/register">
                Załóż konto za darmo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-base border-accent-foreground/20 text-accent-foreground hover:bg-accent-foreground/10" asChild>
              <Link to="/login">
                Mam już konto
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container py-12">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <HardHat className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold">Majster.AI</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Profesjonalne wyceny i zarządzanie projektami dla fachowców. Szybko, łatwo, bezpiecznie.
              </p>
              <a href="mailto:kontakt@majster.ai" className="text-sm text-muted-foreground hover:text-foreground transition-colors mt-2 inline-block">
                kontakt@majster.ai
              </a>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Produkt</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/app/dashboard" className="hover:text-foreground transition-colors">Panel główny</Link></li>
                <li><Link to="/app/templates" className="hover:text-foreground transition-colors">Szablony</Link></li>
                <li><Link to="/app/jobs" className="hover:text-foreground transition-colors">Projekty</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Prawne</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/legal/privacy" className="hover:text-foreground transition-colors">Polityka Prywatności</Link></li>
                <li><Link to="/legal/terms" className="hover:text-foreground transition-colors">Regulamin</Link></li>
                <li><Link to="/legal/cookies" className="hover:text-foreground transition-colors">Polityka Cookies</Link></li>
                <li><Link to="/legal/dpa" className="hover:text-foreground transition-colors">Umowa DPA</Link></li>
                <li><Link to="/legal/rodo" className="hover:text-foreground transition-colors">Centrum RODO</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Wsparcie</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="mailto:support@majster.ai" className="hover:text-foreground transition-colors">Pomoc techniczna</a></li>
                <li><a href="mailto:sales@majster.ai" className="hover:text-foreground transition-colors">Sprzedaż</a></li>
                <li><a href="mailto:kontakt@majster.ai" className="hover:text-foreground transition-colors">Partnerstwo</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Majster.AI. Wszystkie prawa zastrzeżone.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              Made in Poland. RODO Compliant.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
