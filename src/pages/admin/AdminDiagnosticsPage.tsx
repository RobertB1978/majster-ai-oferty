import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeartPulse } from 'lucide-react';

export default function AdminDiagnosticsPage() {
  return (
    <>
      <Helmet>
        <title>Diagnostyka | Owner Console | Majster.AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-primary" />
            Diagnostyka systemu
          </h1>
          <p className="text-muted-foreground mt-1">
            Status zdrowia systemu, metryki wydajności, logi błędów.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Wkrótce</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Panel diagnostyczny z monitoringiem zdrowia API, statusem Edge Functions
              i metrykami wydajności pojawi się w następnej fazie.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
