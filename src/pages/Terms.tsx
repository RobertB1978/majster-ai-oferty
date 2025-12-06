import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, AlertTriangle, CreditCard, Scale, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Regulamin | Majster.AI</title>
        <meta name="description" content="Regulamin korzystania z aplikacji Majster.AI - zasady i warunki użytkowania." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Powrót
          </Button>

          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 mb-4">
              <FileText className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Regulamin Usługi
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ostatnia aktualizacja: {new Date().toLocaleDateString('pl-PL')}
            </p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  1. Postanowienia ogólne
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Niniejszy regulamin określa zasady korzystania z aplikacji Majster.AI - 
                  narzędzia do zarządzania projektami budowlanymi i tworzenia wycen.
                </p>
                <p>
                  Korzystając z aplikacji, akceptujesz postanowienia niniejszego regulaminu.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  2. Zakres usług
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>Majster.AI oferuje następujące funkcjonalności:</p>
                <ul>
                  <li>Tworzenie i zarządzanie projektami budowlanymi</li>
                  <li>Generowanie wycen i ofert</li>
                  <li>Zarządzanie klientami i podwykonawcami</li>
                  <li>Analityka finansowa projektów</li>
                  <li>Asystent AI do tworzenia ofert</li>
                  <li>Eksport dokumentów do PDF</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  3. Plany i płatności
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>Dostępne plany subskrypcji:</p>
                <ul>
                  <li><strong>Free</strong> - darmowy z reklamami, ograniczone funkcje</li>
                  <li><strong>Starter</strong> - 49 PLN/mies. - podstawowe funkcje bez reklam</li>
                  <li><strong>Business</strong> - 99 PLN/mies. - pełne funkcje + AI</li>
                  <li><strong>Enterprise</strong> - 139 PLN/mies. - wszystkie funkcje + priorytetowe wsparcie</li>
                </ul>
                <p>
                  Płatności są przetwarzane przez bezpieczny system Stripe.
                  Subskrypcję można anulować w dowolnym momencie.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  4. Ograniczenia i zakazy
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>Zabrania się:</p>
                <ul>
                  <li>Udostępniania konta osobom trzecim</li>
                  <li>Próby obejścia zabezpieczeń systemu</li>
                  <li>Wykorzystywania aplikacji do celów niezgodnych z prawem</li>
                  <li>Wprowadzania fałszywych danych</li>
                  <li>Automatycznego pobierania danych (scraping)</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  5. Odpowiedzialność
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Majster.AI dokłada wszelkich starań, aby usługa działała poprawnie.
                  Nie ponosimy odpowiedzialności za:
                </p>
                <ul>
                  <li>Przerwy techniczne i awarie</li>
                  <li>Błędy w wycenach wynikające z nieprawidłowych danych</li>
                  <li>Szkody wynikające z niewłaściwego użycia aplikacji</li>
                  <li>Utratę danych z przyczyn niezależnych od nas</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  6. Postanowienia końcowe
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Zastrzegamy sobie prawo do zmiany regulaminu. O istotnych zmianach 
                  poinformujemy użytkowników drogą mailową z 14-dniowym wyprzedzeniem.
                </p>
                <p>
                  W sprawach nieuregulowanych zastosowanie mają przepisy prawa polskiego.
                </p>
                <p>
                  Kontakt: support@majster.ai
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
