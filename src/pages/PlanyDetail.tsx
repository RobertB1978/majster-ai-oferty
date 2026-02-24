import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ArrowLeft, HardHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PLANS } from './Plany';
import { formatDualCurrency } from '@/config/currency';

export default function PlanyDetail() {
  const { i18n } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const plan = PLANS.find((p) => p.slug === slug);

  if (!plan) return <Navigate to="/plany" replace />;

  const isHighlighted = plan.highlighted;

  return (
    <>
      <Helmet>
        <title>Plan {plan.name} | Majster.AI</title>
        <meta
          name="description"
          content={`${plan.description} Cena: ${plan.pricePLN === 0 ? 'Bezpłatny' : `${plan.pricePLN} zł/mies.`}`}
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border bg-card">
          <div className="container flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <HardHat className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">Majster.AI</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Zaloguj się</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Wypróbuj za darmo</Link>
              </Button>
            </div>
          </div>
        </header>

        <div className="container py-10 max-w-3xl">
          {/* Back */}
          <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
            <Link to="/plany">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Wszystkie plany
            </Link>
          </Button>

          {/* Hero */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold">{plan.name}</h1>
              {isHighlighted && (
                <Badge className="text-sm">Najpopularniejszy</Badge>
              )}
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-5xl font-bold">
                {formatDualCurrency(plan.pricePLN, i18n.language)}
              </span>
              {plan.pricePLN > 0 && (
                <span className="text-lg text-muted-foreground">/ miesiąc netto</span>
              )}
            </div>
            <p className="text-lg text-muted-foreground">{plan.description}</p>
            {plan.pricePLN > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Cena netto, do ceny doliczamy 23% VAT. Wystawiamy fakturę VAT.
              </p>
            )}
          </div>

          {/* Feature checklist */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Co zawiera plan {plan.name}?</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 mb-12">
            {plan.pricePLN === 0 ? (
              <Button size="lg" className="flex-1" asChild>
                <Link to="/register">Zacznij za darmo →</Link>
              </Button>
            ) : (
              <>
                <Button size="lg" className="flex-1" asChild>
                  {/* TODO: Replace with Stripe checkout when configured */}
                  <Link to="/register">
                    Kup teraz — {formatDualCurrency(plan.pricePLN, i18n.language)}/mies.
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/register">Wypróbuj 30 dni za darmo</Link>
                </Button>
              </>
            )}
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Często zadawane pytania</h2>
            <div className="space-y-4">
              {plan.faq.map((item) => (
                <Card key={item.q}>
                  <CardContent className="py-4">
                    <p className="font-semibold mb-1">{item.q}</p>
                    <p className="text-sm text-muted-foreground">{item.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Cross-sell */}
          <div className="mt-12 pt-8 border-t text-center">
            <p className="text-muted-foreground mb-4">
              Porównaj wszystkie plany i wybierz ten właściwy dla siebie.
            </p>
            <Button variant="outline" asChild>
              <Link to="/plany">Porównaj plany</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
