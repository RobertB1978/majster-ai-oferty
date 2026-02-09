import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from 'lucide-react';

export default function AdminNavigationPage() {
  return (
    <>
      <Helmet>
        <title>Nawigacja | Owner Console | Majster.AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Navigation className="h-6 w-6 text-primary" />
            Edytor nawigacji
          </h1>
          <p className="text-muted-foreground mt-1">
            Zarządzaj kolejnością, widocznością i flagami modułów w nawigacji klienta.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Wkrótce</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Edytor nawigacji z drag-and-drop, przełącznikami widoczności modułów
              i flagami "Wkrótce" pojawi się w następnej fazie.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
