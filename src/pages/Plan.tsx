import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, CreditCard, Zap, Users, HardDrive, FolderKanban, Star } from 'lucide-react';
import { useConfig } from '@/contexts/ConfigContext';

const PLAN_FEATURE_LABELS: Record<string, string> = {
  excelExport: 'Eksport Excel',
  team: 'Zarządzanie zespołem',
  customTemplates: 'Własne szablony',
  ai: 'Asystent AI',
  voice: 'Dyktowanie głosem',
  documents: 'Dokumenty firmowe',
  calendarSync: 'Synchronizacja kalendarza',
  marketplace: 'Marketplace',
  advancedAnalytics: 'Zaawansowana analityka',
  photoEstimation: 'Wycena ze zdjęcia',
  ocr: 'OCR faktur',
  api: 'Dostęp do API',
  prioritySupport: 'Priorytetowe wsparcie',
  unlimitedProjects: 'Nieograniczone projekty',
  unlimitedClients: 'Nieograniczeni klienci',
};

function formatStorage(mb: number): string {
  if (mb >= 1024) return `${mb / 1024} GB`;
  return `${mb} MB`;
}

function formatLimit(value: number): string {
  if (value >= 9999) return 'Bez limitu';
  return String(value);
}

export default function Plan() {
  const { t } = useTranslation();
  const { config } = useConfig();
  const tiers = config.plans.tiers;

  return (
    <>
      <Helmet>
        <title>Subskrypcja i plan | Majster.AI</title>
        <meta name="description" content="Twój aktualny plan oraz dostępne pakiety" />
      </Helmet>

      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
              <CreditCard className="h-5 w-5 text-primary-foreground" />
            </div>
            Subskrypcja i plan
          </h1>
          <p className="text-muted-foreground mt-1">
            Wybierz pakiet dopasowany do Twojego biznesu. Zacznij za darmo, rozwijaj się kiedy chcesz.
          </p>
        </div>

        {/* Current plan notice */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Aktualnie korzystasz z planu darmowego</p>
              <p className="text-xs text-muted-foreground">
                Przejdź na wyższy plan, by odblokować AI, zarządzanie zespołem i więcej.
              </p>
            </div>
            <Badge variant="secondary">Darmowy</Badge>
          </CardContent>
        </Card>

        {/* Plans grid */}
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {tiers.map((tier) => (
            <Card
              key={tier.id}
              className={`relative flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                tier.highlighted
                  ? 'border-primary shadow-md ring-2 ring-primary/20'
                  : 'border hover:border-primary/30'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="flex items-center gap-1 shadow-sm">
                    <Star className="h-3 w-3 fill-current" />
                    Najpopularniejszy
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">
                    {tier.pricePLN === 0 ? 'Gratis' : `${tier.pricePLN} zł`}
                  </span>
                  {tier.pricePLN > 0 && (
                    <span className="text-sm text-muted-foreground"> / miesiąc</span>
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col flex-1 gap-4">
                {/* Limits */}
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>
                      <span className="font-medium">{formatLimit(tier.maxProjects)}</span>
                      {' '}{tier.maxProjects < 9999 ? 'projektów' : ''}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>
                      <span className="font-medium">{formatLimit(tier.maxClients)}</span>
                      {' '}{tier.maxClients < 9999 ? 'klientów' : ''}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium">{formatStorage(tier.maxStorageMB)} pamięci</span>
                  </li>
                  {tier.maxTeamMembers > 0 && (
                    <li className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>
                        <span className="font-medium">{formatLimit(tier.maxTeamMembers)}</span>
                        {' '}{tier.maxTeamMembers < 9999 ? 'osób w zespole' : ''}
                      </span>
                    </li>
                  )}
                </ul>

                {/* Features */}
                {tier.features.length > 0 && (
                  <ul className="space-y-1.5 text-sm border-t pt-3">
                    {tier.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                        <span>{PLAN_FEATURE_LABELS[feat] ?? feat}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* CTA */}
                <div className="mt-auto pt-4">
                  {tier.pricePLN === 0 ? (
                    <Button variant="outline" className="w-full" disabled>
                      Aktualny plan
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={tier.highlighted ? 'default' : 'outline'}
                      asChild
                    >
                      <a href={`mailto:sales@majster.ai?subject=Upgrade%20do%20planu%20${encodeURIComponent(tier.name)}`}>
                        Wybierz {tier.name}
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ / info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pytania o płatności</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Jak zmienić plan?</span>{' '}
              Skontaktuj się z nami przez email{' '}
              <a href="mailto:sales@majster.ai" className="text-primary hover:underline">
                sales@majster.ai
              </a>{' '}
              lub przez formularz kontaktowy.
            </p>
            <p>
              <span className="font-medium text-foreground">Czy można anulować?</span>{' '}
              Tak — płatne plany można anulować w dowolnym momencie. Dostęp pozostaje aktywny do końca okresu rozliczeniowego.
            </p>
            <p>
              <span className="font-medium text-foreground">Faktury VAT?</span>{' '}
              Tak, wystawiamy faktury VAT. Podaj NIP firmy przy zakupie planu.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
