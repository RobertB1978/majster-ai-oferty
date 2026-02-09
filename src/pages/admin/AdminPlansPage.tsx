import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

export default function AdminPlansPage() {
  return (
    <>
      <Helmet>
        <title>Plany | Owner Console | Majster.AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Plany i uprawnienia
          </h1>
          <p className="text-muted-foreground mt-1">
            Definiuj plany taryfowe, limity i moduły dostępne w każdym planie.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Wkrótce</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Edytor planów taryfowych (Free/Pro/Business/Enterprise) z konfiguracją limitów,
              modułów i uprawnień pojawi się w następnej fazie.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
