import { useState } from 'react';
import { SEOHead } from '@/components/seo/SEOHead';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Shield,
  Search,
  Download,
  Filter,
  User,
  FileText,
  Settings,
  Mail,
  Key,
  Loader2,
  type LucideIcon
} from 'lucide-react';
import { useAuditLogs } from '@/hooks/useAuditLog';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

const actionLabels: Record<string, string> = {
  'user.login': 'Logowanie',
  'user.logout': 'Wylogowanie',
  'user.register': 'Rejestracja',
  'user.password_change': 'Zmiana hasła',
  'user.profile_update': 'Aktualizacja profilu',
  'user.consent_update': 'Aktualizacja zgód',
  'user.data_export': 'Eksport danych',
  'user.data_delete_request': 'Żądanie usunięcia',
  'client.create': 'Utworzenie klienta',
  'client.update': 'Aktualizacja klienta',
  'client.delete': 'Usunięcie klienta',
  'project.create': 'Utworzenie projektu',
  'project.update': 'Aktualizacja projektu',
  'project.delete': 'Usunięcie projektu',
  'quote.create': 'Utworzenie wyceny',
  'quote.update': 'Aktualizacja wyceny',
  'quote.version_create': 'Nowa wersja wyceny',
  'pdf.generate': 'Generowanie PDF',
  'pdf.download': 'Pobranie PDF',
  'offer.send': 'Wysłanie oferty',
  'offer.approve': 'Akceptacja oferty',
  'offer.reject': 'Odrzucenie oferty',
  'team.member_add': 'Dodanie do zespołu',
  'team.member_remove': 'Usunięcie z zespołu',
  'team.role_change': 'Zmiana roli',
  'api.key_create': 'Utworzenie klucza API',
  'api.key_revoke': 'Unieważnienie klucza API',
  'subscription.change': 'Zmiana subskrypcji',
  'settings.update': 'Aktualizacja ustawień',
  'document.upload': 'Wgranie dokumentu',
  'document.delete': 'Usunięcie dokumentu',
};

const actionIcons: Record<string, LucideIcon> = {
  'user': User,
  'client': User,
  'project': FileText,
  'quote': FileText,
  'pdf': FileText,
  'offer': Mail,
  'team': User,
  'api': Key,
  'subscription': Settings,
  'settings': Settings,
  'document': FileText,
};

const actionColors: Record<string, string> = {
  'create': 'bg-success/10 text-success',
  'update': 'bg-info/10 text-info',
  'delete': 'bg-destructive/10 text-destructive',
  'login': 'bg-primary/10 text-primary',
  'logout': 'bg-muted text-muted-foreground',
  'send': 'bg-info/10 text-info',
  'approve': 'bg-success/10 text-success',
  'reject': 'bg-destructive/10 text-destructive',
  'export': 'bg-warning/10 text-warning',
};

export function AuditLogPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const { data: logs = [], isLoading } = useAuditLogs({ limit: 200 });

  const filteredLogs = logs.filter(log => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!log.action.toLowerCase().includes(query) && 
          !log.entity_type.toLowerCase().includes(query)) {
        return false;
      }
    }
    if (actionFilter !== 'all') {
      if (!log.action.startsWith(actionFilter)) return false;
    }
    return true;
  });

  const getActionBadgeColor = (action: string) => {
    const parts = action.split('.');
    const actionType = parts[1];
    return actionColors[actionType] || 'bg-muted text-muted-foreground';
  };

  const getActionIcon = (action: string) => {
    const entityType = action.split('.')[0];
    return actionIcons[entityType] || FileText;
  };

  const handleExport = () => {
    const csv = [
      ['Data', 'Akcja', 'Typ', 'ID obiektu', 'User Agent'].join(','),
      ...filteredLogs.map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        actionLabels[log.action] || log.action,
        log.entity_type,
        log.entity_id || '-',
        `"${log.user_agent || '-'}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <SEOHead
        title="Dziennik Audytu"
        description="Przegląd wszystkich akcji wykonanych w systemie"
        noIndex={true}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Dziennik Audytu</CardTitle>
                <CardDescription>Historia wszystkich akcji w systemie</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Eksport CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj akcji..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtruj typ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie</SelectItem>
                <SelectItem value="user">Użytkownik</SelectItem>
                <SelectItem value="client">Klienci</SelectItem>
                <SelectItem value="project">Projekty</SelectItem>
                <SelectItem value="quote">Wyceny</SelectItem>
                <SelectItem value="offer">Oferty</SelectItem>
                <SelectItem value="team">Zespół</SelectItem>
                <SelectItem value="api">API</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Brak wpisów w dzienniku audytu</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Data</TableHead>
                    <TableHead>Akcja</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead className="hidden md:table-cell">ID</TableHead>
                    <TableHead className="hidden lg:table-cell">Urządzenie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const Icon = getActionIcon(log.action);
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">
                          {format(new Date(log.created_at), 'dd.MM.yyyy HH:mm', { locale: pl })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <Badge className={getActionBadgeColor(log.action)}>
                              {actionLabels[log.action] || log.action}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {log.entity_type}
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">
                          {log.entity_id ? log.entity_id.slice(0, 8) + '...' : '-'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground max-w-[200px] truncate">
                          {log.user_agent ? (
                            log.user_agent.includes('Mobile') ? '📱 Mobile' : '💻 Desktop'
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 text-xs text-muted-foreground">
            Pokazano {filteredLogs.length} z {logs.length} wpisów
          </div>
        </CardContent>
      </Card>
    </>
  );
}
