import { useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Shield, Server, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function DPA() {
  const navigate = useNavigate();
  const lastUpdated = new Date().toLocaleDateString('pl-PL');

  const sections = [
    {
      icon: FileText,
      title: '1. Przedmiot umowy',
      content: `Niniejsza Umowa Powierzenia Przetwarzania Danych (DPA) reguluje zasady 
przetwarzania danych osobowych przez Majster.AI (Procesor) w imieniu Użytkownika (Administrator).

Umowa stanowi integralną część Regulaminu i Polityki Prywatności Majster.AI.`,
    },
    {
      icon: Shield,
      title: '2. Zakres przetwarzania',
      content: `Procesor przetwarza następujące kategorie danych:
• Dane klientów Administratora (imię, nazwisko, email, telefon, adres)
• Dane projektów i wycen
• Dokumenty firmowe

Cel przetwarzania: świadczenie usług platformy Majster.AI zgodnie z umową.

Czas przetwarzania: przez okres korzystania z usług + 30 dni po zakończeniu.`,
    },
    {
      icon: Lock,
      title: '3. Środki bezpieczeństwa',
      content: `Procesor stosuje następujące środki techniczne i organizacyjne:
• Szyfrowanie danych w tranzycie (TLS 1.3) i w spoczynku (AES-256)
• Kontrola dostępu oparta na rolach (RBAC)
• Row Level Security (RLS) w bazie danych
• Regularne audyty bezpieczeństwa
• Szkolenia personelu z zakresu ochrony danych
• Procedury reagowania na incydenty
• Backup danych z retencją 30 dni`,
    },
    {
      icon: Server,
      title: '4. Podprzetwarzcy',
      content: `Procesor korzysta z następujących podprzetwarzców:

1. Supabase Inc. (USA)
   - Hosting bazy danych i autentykacji
   - Standard Contractual Clauses (SCC) dla transferu UE-USA
   
2. Resend (USA)
   - Wysyłka emaili transakcyjnych
   - SCC dla transferu UE-USA

Administrator wyraża zgodę na korzystanie z wymienionych podprzetwarzców.
O każdym nowym podprzetwarzcy Administrator zostanie poinformowany z 14-dniowym wyprzedzeniem.`,
    },
    {
      icon: AlertTriangle,
      title: '5. Obowiązki stron',
      content: `Obowiązki Procesora:
• Przetwarzanie danych wyłącznie na udokumentowane polecenie Administratora
• Zapewnienie poufności przez personel
• Pomoc Administratorowi w realizacji praw osób, których dane dotyczą
• Powiadomienie o naruszeniu ochrony danych w ciągu 72 godzin
• Usunięcie danych po zakończeniu umowy

Obowiązki Administratora:
• Zapewnienie podstawy prawnej przetwarzania
• Informowanie osób, których dane dotyczą
• Realizacja praw osób (dostęp, sprostowanie, usunięcie)`,
    },
    {
      icon: CheckCircle2,
      title: '6. Audyty i kontrole',
      content: `Administrator ma prawo do:
• Żądania informacji o przetwarzaniu danych
• Przeprowadzania audytów (raz w roku, z 30-dniowym wyprzedzeniem)
• Inspekcji dokumentacji bezpieczeństwa

Procesor zobowiązuje się do współpracy przy audytach organów nadzorczych.

Koszty audytu ponosi strona inicjująca, chyba że audyt wykaże naruszenia.`,
    },
  ];

  return (
    <>
      <SEOHead
        title="Umowa Powierzenia Danych (DPA)"
        description="Umowa powierzenia przetwarzania danych osobowych Majster.AI zgodna z RODO art. 28."
        keywords="DPA, umowa powierzenia, RODO, art 28, przetwarzanie danych"
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
            <h1 className="text-3xl font-bold mb-2">Umowa Powierzenia Danych</h1>
            <p className="text-muted-foreground">
              Data Processing Agreement (DPA) zgodnie z art. 28 RODO
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

          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Akceptacja umowy</p>
                  <p className="text-sm text-muted-foreground">
                    Korzystając z Majster.AI, akceptujesz niniejszą Umowę Powierzenia 
                    Przetwarzania Danych. W przypadku pytań skontaktuj się: kontakt.majster@gmail.com
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
