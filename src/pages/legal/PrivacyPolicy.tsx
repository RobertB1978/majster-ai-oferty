import { useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Shield, Database, Eye, Lock, UserCheck, Globe, Mail } from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const lastUpdated = new Date().toLocaleDateString('pl-PL');

  const sections = [
    {
      icon: Shield,
      title: '1. Administrator danych',
      content: `Administratorem Twoich danych osobowych jest Majster.AI. Dokładamy wszelkich starań, 
      aby Twoje dane były bezpieczne i przetwarzane zgodnie z RODO (Rozporządzenie UE 2016/679).`,
    },
    {
      icon: Database,
      title: '2. Jakie dane zbieramy',
      content: `Zbieramy następujące dane:
      • Dane konta: adres email, hasło (zaszyfrowane), nazwa firmy
      • Dane firmowe: NIP, adres, telefon, logo
      • Dane klientów: imię/nazwisko, kontakt, adres (wprowadzane przez Ciebie)
      • Dane projektów: wyceny, pozycje, PDF-y, historia wysyłek
      • Dane techniczne: adres IP, User Agent, cookies
      • Dane analityczne: sposób korzystania z aplikacji`,
    },
    {
      icon: Eye,
      title: '3. Cele przetwarzania',
      content: `Twoje dane przetwarzamy w celu:
      • Świadczenia usług Majster.AI (podstawa: umowa)
      • Obsługi konta użytkownika
      • Generowania i wysyłania wycen
      • Analityki i ulepszania usług
      • Marketingu własnych produktów (zgoda)
      • Wypełnienia obowiązków prawnych`,
    },
    {
      icon: Lock,
      title: '4. Bezpieczeństwo danych',
      content: `Stosujemy następujące środki bezpieczeństwa:
      • Szyfrowanie SSL/TLS dla wszystkich połączeń
      • Szyfrowanie haseł algorytmem bcrypt
      • Row Level Security (RLS) w bazie danych
      • Regularne kopie zapasowe
      • Monitoring bezpieczeństwa 24/7
      • Ograniczony dostęp do infrastruktury`,
    },
    {
      icon: UserCheck,
      title: '5. Twoje prawa (RODO)',
      content: `Masz prawo do:
      • Dostępu do swoich danych (art. 15 RODO)
      • Sprostowania danych (art. 16 RODO)
      • Usunięcia danych "prawo do bycia zapomnianym" (art. 17 RODO)
      • Ograniczenia przetwarzania (art. 18 RODO)
      • Przenoszenia danych (art. 20 RODO)
      • Sprzeciwu wobec przetwarzania (art. 21 RODO)
      • Wycofania zgody w dowolnym momencie`,
    },
    {
      icon: Globe,
      title: '6. Przekazywanie danych',
      content: `Twoje dane mogą być przekazywane:
      • Dostawcom usług hostingowych (Supabase - UE/USA)
      • Dostawcom usług email (Resend)
      • Organom państwowym (na żądanie prawne)
      
      Wszystkie podmioty przetwarzające dane są zobowiązane umową powierzenia (DPA).`,
    },
    {
      icon: Mail,
      title: '7. Kontakt',
      content: `W sprawach ochrony danych osobowych możesz się z nami skontaktować:
      • Email: kontakt.majsterai@gmail.com
      • Formularz w aplikacji: Ustawienia → Centrum RODO
      
      Masz prawo wnieść skargę do Prezesa UODO.`,
    },
  ];

  return (
    <>
      <SEOHead
        title="Polityka Prywatności"
        description="Polityka prywatności Majster.AI - dowiedz się jak chronimy Twoje dane osobowe zgodnie z RODO."
        keywords="polityka prywatności, RODO, GDPR, ochrona danych, Majster.AI"
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
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Polityka Prywatności</h1>
            <p className="text-muted-foreground">
              Majster.AI - ochrona Twoich danych osobowych
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Ostatnia aktualizacja: {lastUpdated}
            </p>
          </div>

          <div className="space-y-6">
            {sections.map((section) => (
              <Card key={section.title} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <section.icon className="h-5 w-5 text-primary" />
                    </div>
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                    {section.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 p-6 rounded-xl bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">
              Ta polityka prywatności jest zgodna z Rozporządzeniem Parlamentu Europejskiego 
              i Rady (UE) 2016/679 (RODO) oraz polską ustawą o ochronie danych osobowych.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
