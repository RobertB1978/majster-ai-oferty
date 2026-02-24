import { useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Scale, CreditCard, AlertTriangle, Ban, Gavel } from 'lucide-react';

export default function TermsOfService() {
  const navigate = useNavigate();
  const lastUpdated = new Date().toLocaleDateString('pl-PL');

  const sections = [
    {
      icon: FileText,
      title: '1. Postanowienia ogólne',
      content: `1.1. Niniejszy Regulamin określa zasady korzystania z serwisu Majster.AI.
      
1.2. Majster.AI to platforma SaaS umożliwiająca tworzenie wycen, ofert i kosztorysów 
dla fachowców z branży budowlanej i usługowej.

1.3. Korzystając z serwisu, akceptujesz niniejszy Regulamin oraz Politykę Prywatności.

1.4. Definicje:
• Serwis - aplikacja Majster.AI dostępna pod adresem majster-ai-oferty.vercel.app (TEMP)
• Użytkownik - osoba korzystająca z Serwisu
• Konto - indywidualne konto Użytkownika w Serwisie
• Subskrypcja - płatny plan dostępu do funkcji Serwisu`,
    },
    {
      icon: Scale,
      title: '2. Zakres usług',
      content: `2.1. Majster.AI oferuje następujące funkcje:
• Zarządzanie klientami i projektami
• Tworzenie wycen i kosztorysów
• Generowanie profesjonalnych PDF-ów
• Wysyłka ofert emailem
• Asystent AI (plany płatne)
• Kalendarz i harmonogram prac
• Analityka i raporty

2.2. Dostęp do niektórych funkcji jest uzależniony od wybranego planu subskrypcji.

2.3. Zastrzegamy sobie prawo do modyfikacji zakresu usług z 30-dniowym wyprzedzeniem.`,
    },
    {
      icon: CreditCard,
      title: '3. Plany i płatności',
      content: `3.1. Dostępne plany subskrypcji:
• FREE - bezpłatny, z ograniczeniami
• STARTER - podstawowe funkcje
• BUSINESS - pełny dostęp + AI
• ENTERPRISE - wszystkie funkcje + API + zespoły

3.2. Płatności są realizowane z góry za okres rozliczeniowy (miesiąc/rok).

3.3. Ceny są podane w złotych polskich (PLN) i zawierają podatek VAT 23%.

3.4. Zwroty są możliwe w ciągu 14 dni od zakupu (prawo konsumenta).

3.5. W przypadku braku płatności, konto zostanie zdegradowane do planu FREE.`,
    },
    {
      icon: Ban,
      title: '4. Ograniczenia i zakazy',
      content: `4.1. Zabrania się:
• Wykorzystywania Serwisu do celów niezgodnych z prawem
• Próby obejścia zabezpieczeń lub limitów
• Udostępniania konta osobom trzecim
• Automatycznego pobierania danych (scraping)
• Wysyłania spamu lub niechcianych wiadomości
• Publikowania treści obraźliwych lub nielegalnych

4.2. Naruszenie powyższych zasad może skutkować:
• Ostrzeżeniem
• Czasowym zablokowaniem konta
• Trwałym usunięciem konta bez zwrotu opłat`,
    },
    {
      icon: AlertTriangle,
      title: '5. Odpowiedzialność',
      content: `5.1. Majster.AI nie ponosi odpowiedzialności za:
• Treści wprowadzone przez Użytkowników
• Przerwy w działaniu spowodowane siłą wyższą
• Straty wynikające z błędów w wycenach
• Problemy techniczne po stronie Użytkownika

5.2. Całkowita odpowiedzialność Majster.AI jest ograniczona do kwoty 
wpłaconych opłat subskrypcyjnych w ostatnich 12 miesiącach.

5.3. Użytkownik jest odpowiedzialny za:
• Poprawność wprowadzanych danych
• Bezpieczeństwo swojego hasła
• Zgodność z prawem podatkowym (wystawianie faktur)`,
    },
    {
      icon: Gavel,
      title: '6. Postanowienia końcowe',
      content: `6.1. Prawem właściwym jest prawo polskie.

6.2. Spory będą rozstrzygane przez sąd właściwy dla siedziby Majster.AI.

6.3. Regulamin może być zmieniony z 30-dniowym wyprzedzeniem. 
O zmianach poinformujemy emailem.

6.4. Nieważność pojedynczego postanowienia nie wpływa na ważność całego Regulaminu.

6.5. Kontakt: kontakt.majster@gmail.com

6.6. Regulamin wchodzi w życie z dniem publikacji.`,
    },
  ];

  return (
    <>
      <SEOHead
        title="Regulamin Serwisu"
        description="Regulamin korzystania z serwisu Majster.AI - zasady, prawa i obowiązki użytkowników."
        keywords="regulamin, warunki użytkowania, terms of service, Majster.AI"
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
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Regulamin Serwisu</h1>
            <p className="text-muted-foreground">
              Majster.AI - zasady korzystania z platformy
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
              Korzystając z Majster.AI potwierdzasz, że zapoznałeś się z Regulaminem 
              i akceptujesz jego postanowienia.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
