import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sliders } from 'lucide-react';

export default function AdminAppConfigPage() {
  return (
    <>
      <Helmet>
        <title>Konfiguracja | Owner Console | Majster.AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sliders className="h-6 w-6 text-primary" />
            Konfiguracja aplikacji
          </h1>
          <p className="text-muted-foreground mt-1">
            Globalne ustawienia platformy, walidacja Zod, wersjonowanie konfiguracji.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Wkrótce</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Edytor konfiguracji z walidacją, podglądem zmian, historią wersji i przywracaniem
              poprzednich ustawień pojawi się w następnej fazie.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
