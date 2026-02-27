import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Star, ArrowRight, HardHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PLANS } from '@/config/plans';
import { formatDualCurrency } from '@/config/currency';

// Re-export for backwards compatibility (PlanyDetail.tsx imports from here)
export { PLANS };

export default function Plany() {
  const { t, i18n } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('billing.pricingTitle', 'Pricing & Plans')} | Majster.AI</title>
        <meta name="description" content={t('billing.pricingDescription', 'Choose a Majster.AI plan that fits your business. Start for free.')} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Simple header */}
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
                <Link to="/login">{t('auth.login', 'Sign in')}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">{t('auth.tryForFree', 'Try for free')}</Link>
              </Button>
            </div>
          </div>
        </header>

        <div className="container py-16 max-w-5xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">{t('billing.pricingTitle', 'Pricing & Plans')}</h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              {t('billing.pricingSubtitle', 'Start for free. Scale when your business needs it.')}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {t('billing.vatNote', 'Prices are net, 23% VAT applies')}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {PLANS.map((plan) => (
              <Card
                key={plan.slug}
                className={`relative flex flex-col transition-all hover:-translate-y-1 hover:shadow-lg ${
                  plan.highlighted ? 'border-primary ring-2 ring-primary/20 shadow-md' : ''
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gap-1 shadow-sm">
                      <Star className="h-3 w-3 fill-current" />
                      {t('billing.mostPopular', 'Most Popular')}
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-foreground">
                      {formatDualCurrency(plan.pricePLN, i18n.language)}
                    </span>
                    {plan.pricePLN > 0 && <span className="text-sm"> {t('billing.perMonth', '/month')}</span>}
                  </CardDescription>
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4">
                  <ul className="space-y-2 text-sm flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2 space-y-2">
                    <Button
                      className="w-full"
                      variant={plan.highlighted ? 'default' : 'outline'}
                      asChild
                    >
                      <Link to={`/plany/${plan.slug}`}>
                        {t('common.details', 'Details')} <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                    {plan.pricePLN === 0 ? (
                      <Button className="w-full" asChild>
                        <Link to="/register">{t('billing.startFree', 'Start for free')}</Link>
                      </Button>
                    ) : (
                      <Button className="w-full" variant={plan.highlighted ? 'default' : 'secondary'} asChild>
                        <Link to="/register">{t('billing.try30days', 'Try 30 days')}</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* VAT note */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            {t('billing.vatFootnote', 'All prices in Polish Zloty (PLN), net. 23% VAT applies. We issue VAT invoices.')}
          </p>
        </div>
      </div>
    </>
  );
}
