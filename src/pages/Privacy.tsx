import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Eye, Database, UserCheck, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Polityka Prywatności | Majster.AI</title>
        <meta name="description" content="Polityka prywatności aplikacji Majster.AI - dowiedz się jak chronimy Twoje dane." />
      </Helmet>

      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Powrót
          </Button>

          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-primary">
              Polityka Prywatności
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ostatnia aktualizacja: {new Date().toLocaleDateString('pl-PL')}
            </p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  1. Administrator danych
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Administratorem Twoich danych osobowych jest Majster.AI. 
                  Dokładamy wszelkich starań, aby Twoje dane były bezpieczne i przetwarzane zgodnie z RODO.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  2. Jakie dane zbieramy
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <ul>
                  <li><strong>Dane konta:</strong> imię, nazwisko, adres e-mail, numer telefonu</li>
                  <li><strong>Dane firmy:</strong> nazwa firmy, NIP, adres, dane kontaktowe</li>
                  <li><strong>Dane projektów:</strong> informacje o klientach, wycenach, ofertach</li>
                  <li><strong>Dane techniczne:</strong> adres IP, typ przeglądarki, urządzenie</li>
                  <li><strong>Dane analityczne:</strong> sposób korzystania z aplikacji (za zgodą)</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  3. Cel przetwarzania danych
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <ul>
                  <li>Świadczenie usług aplikacji Majster.AI</li>
                  <li>Generowanie ofert i wycen dla Twoich klientów</li>
                  <li>Komunikacja związana z usługą</li>
                  <li>Ulepszanie jakości usług</li>
                  <li>Wypełnianie obowiązków prawnych</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  4. Twoje prawa (RODO)
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>Zgodnie z RODO przysługują Ci następujące prawa:</p>
                <ul>
                  <li><strong>Prawo dostępu</strong> - możesz uzyskać informacje o przetwarzanych danych</li>
                  <li><strong>Prawo do sprostowania</strong> - możesz poprawić nieprawidłowe dane</li>
                  <li><strong>Prawo do usunięcia</strong> - możesz żądać usunięcia danych ("prawo do bycia zapomnianym")</li>
                  <li><strong>Prawo do przenoszenia</strong> - możesz pobrać swoje dane w formacie maszynowym</li>
                  <li><strong>Prawo do sprzeciwu</strong> - możesz sprzeciwić się przetwarzaniu danych</li>
                  <li><strong>Prawo do cofnięcia zgody</strong> - w każdej chwili możesz wycofać zgodę</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  5. Bezpieczeństwo danych
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>Stosujemy następujące środki bezpieczeństwa:</p>
                <ul>
                  <li>Szyfrowanie danych SSL/TLS</li>
                  <li>Bezpieczne przechowywanie haseł (hashowanie)</li>
                  <li>Regularne kopie zapasowe</li>
                  <li>Kontrola dostępu (Row Level Security)</li>
                  <li>Monitorowanie i audyt bezpieczeństwa</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  6. Kontakt
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  W sprawach związanych z ochroną danych osobowych możesz skontaktować się z nami:
                </p>
                <ul>
                  <li>E-mail: privacy@CHANGE-ME.example</li>
                  <li>Formularz kontaktowy w aplikacji</li>
                </ul>
                <p>
                  Masz również prawo złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych (PUODO).
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
