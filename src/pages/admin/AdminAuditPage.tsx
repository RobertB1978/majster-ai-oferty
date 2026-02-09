import { Helmet } from 'react-helmet-async';
import { AuditLogPanel } from '@/components/admin/AuditLogPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, RotateCcw } from 'lucide-react';
import { useConfig } from '@/contexts/ConfigContext';

export default function AdminAuditPage() {
  const { versions, rollback } = useConfig();

  return (
    <>
      <Helmet>
        <title>Logi | Owner Console | Majster.AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="space-y-6">
        {/* Config version history */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historia konfiguracji
            </CardTitle>
            <CardDescription>
              Wersje konfiguracji z możliwością przywrócenia (max 10)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {versions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Brak historii zmian</p>
            ) : (
              <div className="space-y-2">
                {versions.map((v, i) => (
                  <div key={v.timestamp} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{v.summary}</span>
                        {i === 0 && <Badge variant="default" className="text-xs">Aktualna</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(v.timestamp).toLocaleString('pl-PL')} · v{v.config.version}
                      </p>
                    </div>
                    {i > 0 && (
                      <Button variant="outline" size="sm" onClick={() => rollback(i)}>
                        <RotateCcw className="mr-2 h-3 w-3" />
                        Przywróć
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Existing audit log from Supabase */}
        <AuditLogPanel />
      </div>
    </>
  );
}
