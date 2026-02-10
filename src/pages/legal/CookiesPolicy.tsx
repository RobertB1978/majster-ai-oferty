import { useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Cookie, Shield, BarChart, Megaphone, Settings } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function CookiesPolicy() {
  const navigate = useNavigate();
  const lastUpdated = new Date().toLocaleDateString('pl-PL');

  const cookies = [
    {
      name: 'sb-auth-token',
      type: 'Niezbędne',
      purpose: 'Autoryzacja użytkownika w systemie',
      duration: 'Sesja / 7 dni',
      provider: 'Supabase',
    },
    {
      name: 'cookie_consent',
      type: 'Niezbędne',
      purpose: 'Zapamiętanie preferencji cookies',
      duration: '1 rok',
      provider: 'Majster.AI',
    },
    {
      name: 'theme',
      type: 'Niezbędne',
      purpose: 'Preferencja motywu (jasny/ciemny)',
      duration: '1 rok',
      provider: 'Majster.AI',
    },
    {
      name: 'i18nextLng',
      type: 'Niezbędne',
      purpose: 'Preferencja języka interfejsu',
      duration: '1 rok',
      provider: 'Majster.AI',
    },
    {
      name: '_ga',
      type: 'Analityczne',
      purpose: 'Identyfikator Google Analytics',
      duration: '2 lata',
      provider: 'Google',
    },
    {
      name: '_gid',
      type: 'Analityczne',
      purpose: 'Rozróżnianie użytkowników',
      duration: '24 godziny',
      provider: 'Google',
    },
  ];

  return (
    <>
      <SEOHead
        title="Polityka Cookies"
        description="Polityka plików cookies Majster.AI - dowiedz się jakich cookies używamy i jak nimi zarządzać."
        keywords="cookies, ciasteczka, polityka cookies, RODO, Majster.AI"
      />
      
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl py-8 px-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót
          </Button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Cookie className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Polityka Cookies</h1>
            <p className="text-muted-foreground">
              Jak używamy plików cookies w Majster.AI
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Ostatnia aktualizacja: {lastUpdated}
            </p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Cookie className="h-5 w-5 text-primary" />
                  Czym są pliki cookies?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>
                  Pliki cookies (ciasteczka) to małe pliki tekstowe przechowywane na Twoim 
                  urządzeniu podczas korzystania z naszej strony. Służą do zapamiętywania 
                  Twoich preferencji i usprawnienia działania serwisu.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-success" />
                  Cookies niezbędne
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p className="mb-4">
                  Te cookies są niezbędne do prawidłowego działania serwisu. Nie można ich wyłączyć.
                  Są używane do autoryzacji, bezpieczeństwa i podstawowych funkcji.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <BarChart className="h-5 w-5 text-info" />
                  Cookies analityczne
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  Pomagają nam zrozumieć, jak korzystasz z serwisu. Zbierają anonimowe dane 
                  o odwiedzanych stronach, czasie spędzonym w serwisie i ewentualnych błędach.
                  Możesz je wyłączyć w ustawieniach.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Megaphone className="h-5 w-5 text-warning" />
                  Cookies marketingowe
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  Służą do personalizacji reklam i mierzenia skuteczności kampanii.
                  Możesz je wyłączyć w ustawieniach bez wpływu na działanie serwisu.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lista używanych cookies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nazwa</TableHead>
                        <TableHead>Typ</TableHead>
                        <TableHead>Cel</TableHead>
                        <TableHead>Czas życia</TableHead>
                        <TableHead>Dostawca</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cookies.map((cookie) => (
                        <TableRow key={cookie.name}>
                          <TableCell className="font-mono text-sm">{cookie.name}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              cookie.type === 'Niezbędne' 
                                ? 'bg-success/10 text-success' 
                                : 'bg-info/10 text-info'
                            }`}>
                              {cookie.type}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{cookie.purpose}</TableCell>
                          <TableCell className="text-muted-foreground">{cookie.duration}</TableCell>
                          <TableCell className="text-muted-foreground">{cookie.provider}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-primary" />
                  Jak zarządzać cookies?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>Masz kilka sposobów zarządzania cookies:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>W naszym serwisie:</strong> Kliknij przycisk poniżej, aby zmienić ustawienia cookies.
                  </li>
                  <li>
                    <strong>W przeglądarce:</strong> Możesz zablokować lub usunąć cookies w ustawieniach przeglądarki.
                  </li>
                  <li>
                    <strong>Tryb incognito:</strong> Cookies nie są zapisywane w trybie prywatnym.
                  </li>
                </ul>
                <Button 
                  className="mt-4"
                  onClick={() => {
                    localStorage.removeItem('cookie_consent');
                    window.location.reload();
                  }}
                >
                  Zmień ustawienia cookies
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 p-6 rounded-xl bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">
              Kontynuując korzystanie z serwisu bez zmiany ustawień przeglądarki, 
              wyrażasz zgodę na używanie plików cookies zgodnie z powyższą polityką.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
