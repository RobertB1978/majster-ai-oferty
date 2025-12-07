import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Database, 
  Table2, 
  Users, 
  FolderOpen, 
  FileText, 
  Calendar,
  HardDrive,
  RefreshCw,
  Download,
  Trash2,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TableStats {
  name: string;
  count: number;
  icon: React.ReactNode;
  description: string;
}

export function AdminDatabaseManager() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch table counts
  const { data: tableStats, refetch } = useQuery({
    queryKey: ['admin-db-stats'],
    queryFn: async () => {
      const tables = [
        { table: 'profiles', name: 'Profile', icon: <Users className="h-4 w-4" />, desc: 'Profile użytkowników' },
        { table: 'clients', name: 'Klienci', icon: <Users className="h-4 w-4" />, desc: 'Dane klientów' },
        { table: 'projects', name: 'Projekty', icon: <FolderOpen className="h-4 w-4" />, desc: 'Projekty wycen' },
        { table: 'quotes', name: 'Wyceny', icon: <FileText className="h-4 w-4" />, desc: 'Kalkulacje kosztów' },
        { table: 'item_templates', name: 'Szablony', icon: <Table2 className="h-4 w-4" />, desc: 'Szablony pozycji' },
        { table: 'calendar_events', name: 'Wydarzenia', icon: <Calendar className="h-4 w-4" />, desc: 'Kalendarz' },
        { table: 'notifications', name: 'Powiadomienia', icon: <FileText className="h-4 w-4" />, desc: 'Notyfikacje' },
        { table: 'offer_sends', name: 'Wysyłki', icon: <FileText className="h-4 w-4" />, desc: 'Historia wysyłek' },
      ];

      const stats: TableStats[] = [];

      for (const { table, name, icon, desc } of tables) {
        try {
          const { count } = await supabase
            .from(table as any)
            .select('*', { count: 'exact', head: true });
          
          stats.push({
            name,
            count: count || 0,
            icon,
            description: desc,
          });
        } catch (e) {
          stats.push({
            name,
            count: 0,
            icon,
            description: desc,
          });
        }
      }

      return stats;
    },
  });

  const refreshStats = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast.success('Statystyki odświeżone');
  };

  const totalRecords = tableStats?.reduce((sum, t) => sum + t.count, 0) || 0;

  // Mock storage usage
  const storageUsed = 256; // MB
  const storageTotal = 1024; // MB
  const storagePercent = (storageUsed / storageTotal) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Zarządzanie bazą danych
            </CardTitle>
            <CardDescription>
              Przegląd i zarządzanie danymi aplikacji
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refreshStats} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Odśwież
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Łącznie rekordów</p>
                  <p className="text-2xl font-bold">{totalRecords.toLocaleString()}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tabel aktywnych</p>
                  <p className="text-2xl font-bold">{tableStats?.length || 0}</p>
                </div>
                <Table2 className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Storage</p>
                  <span className="text-sm font-medium">{storageUsed} / {storageTotal} MB</span>
                </div>
                <Progress value={storagePercent} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tables List */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tabela</TableHead>
                <TableHead>Opis</TableHead>
                <TableHead className="text-right">Rekordów</TableHead>
                <TableHead className="text-right">Udział</TableHead>
                <TableHead className="w-[100px]">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableStats?.map((table) => {
                const percent = totalRecords > 0 
                  ? ((table.count / totalRecords) * 100).toFixed(1) 
                  : '0';
                
                return (
                  <TableRow key={table.name}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {table.icon}
                        <span className="font-medium">{table.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {table.description}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {table.count.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Progress value={parseFloat(percent)} className="w-16 h-2" />
                        <span className="text-sm text-muted-foreground w-12">{percent}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" title="Eksportuj">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Database Actions */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Eksportuj wszystko (CSV)
          </Button>
          <Button variant="outline" size="sm">
            <HardDrive className="h-4 w-4 mr-2" />
            Backup bazy
          </Button>
          <Button variant="outline" size="sm" className="text-orange-600 hover:text-orange-700">
            <Trash2 className="h-4 w-4 mr-2" />
            Wyczyść stare dane
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
