import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  HardHat,
  Calculator,
  FileText,
  Users,
  ArrowRight,
  Shield,
  Clock,
  Smartphone
} from 'lucide-react';

const features = [
  {
    icon: Calculator,
    title: 'Szybkie wyceny',
    description: 'Twórz profesjonalne wyceny w minuty, nie godziny.',
  },
  {
    icon: FileText,
    title: 'PDF i oferty',
    description: 'Generuj dokumenty gotowe do wysyłki jednym kliknięciem.',
  },
  {
    icon: Users,
    title: 'Zarządzanie klientami',
    description: 'Baza klientów, historia zleceń, automatyczne przypomnienia.',
  },
  {
    icon: Clock,
    title: 'Kalendarz zleceń',
    description: 'Planuj prace, śledź terminy, zarządzaj zespołem.',
  },
  {
    icon: Smartphone,
    title: 'Działa na telefonie',
    description: 'Pełna funkcjonalność na budowie, w terenie, w biurze.',
  },
  {
    icon: Shield,
    title: 'Bezpieczne dane',
    description: 'Szyfrowanie, kopie zapasowe, zgodność z RODO.',
  },
];

export default function Landing() {
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
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Zaloguj się</Link>
            </Button>
            <Button asChild>
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
        <div className="container py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Cyfrowe narzędzie
              <span className="block text-primary"> dla fachowców</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              Wyceny, oferty, zlecenia i faktury — wszystko w jednym miejscu.
              Stworzony dla ekip budowlanych i remontowych w Polsce.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="h-14 px-8 text-base" asChild>
                <Link to="/register">
                  Zacznij za darmo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-base" asChild>
                <Link to="/login">
                  Mam już konto
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-center text-3xl font-bold">
            Wszystko czego potrzebujesz na budowie
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Jeden system do zarządzania wycenami, klientami, dokumentami i zespołem.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border">
                <CardContent className="pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
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
          <p className="mt-4 text-accent-foreground/80">
            Dołącz do fachowców, którzy oszczędzają czas i zarabiają więcej.
          </p>
          <Button size="lg" variant="secondary" className="mt-8 h-14 px-8 text-base" asChild>
            <Link to="/register">
              Załóż konto za darmo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Majster.AI. Wszystkie prawa zastrzeżone.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/legal/privacy" className="hover:text-foreground transition-colors">
                Prywatność
              </Link>
              <Link to="/legal/terms" className="hover:text-foreground transition-colors">
                Regulamin
              </Link>
              <Link to="/legal/cookies" className="hover:text-foreground transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
