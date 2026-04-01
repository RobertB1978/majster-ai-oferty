import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
  BarChart3
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
  const { t } = useTranslation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Table metadata (names/desc translated at render time, counts fetched from DB)
  const TABLE_DEFS = [
    { table: 'profiles', name: t('admin.db.tables.profiles'), icon: <Users className="h-4 w-4" />, desc: t('admin.db.tables.profilesDesc') },
    { table: 'clients', name: t('admin.db.tables.clients'), icon: <Users className="h-4 w-4" />, desc: t('admin.db.tables.clientsDesc') },
    { table: 'projects', name: t('admin.db.tables.projects'), icon: <FolderOpen className="h-4 w-4" />, desc: t('admin.db.tables.projectsDesc') },
    { table: 'quotes', name: t('admin.db.tables.quotes'), icon: <FileText className="h-4 w-4" />, desc: t('admin.db.tables.quotesDesc') },
    { table: 'item_templates', name: t('admin.db.tables.templates'), icon: <Table2 className="h-4 w-4" />, desc: t('admin.db.tables.templatesDesc') },
    { table: 'calendar_events', name: t('admin.db.tables.events'), icon: <Calendar className="h-4 w-4" />, desc: t('admin.db.tables.eventsDesc') },
    { table: 'notifications', name: t('admin.db.tables.notifications'), icon: <FileText className="h-4 w-4" />, desc: t('admin.db.tables.notificationsDesc') },
    { table: 'offer_sends', name: t('admin.db.tables.offerSends'), icon: <FileText className="h-4 w-4" />, desc: t('admin.db.tables.offerSendsDesc') },
  ];

  // Fetch table counts
  const { data: tableStats, refetch } = useQuery({
    queryKey: ['admin-db-stats'],
    queryFn: async () => {
      const tables = TABLE_DEFS;

      const stats: TableStats[] = [];

      for (const { table, name, icon, desc } of tables) {
        try {
          const { count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          stats.push({
            name,
            count: count || 0,
            icon,
            description: desc,
          });
        } catch (_e) {
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
    toast.success(t('admin.toast.statsRefreshed'));
  };

  const totalRecords = tableStats?.reduce((sum, t) => sum + t.count, 0) || 0;


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {t('admin.db.title')}
            </CardTitle>
            <CardDescription>
              {t('admin.db.description')}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refreshStats} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t('admin.db.refresh')}
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
                  <p className="text-sm text-muted-foreground">{t('admin.db.totalRecords')}</p>
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
                  <p className="text-sm text-muted-foreground">{t('admin.db.activeTables')}</p>
                  <p className="text-2xl font-bold">{tableStats?.length || 0}</p>
                </div>
                <Table2 className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="opacity-60">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Storage</p>
                  <span className="text-sm font-medium text-muted-foreground">{t('admin.db.storageUnavailable')}</span>
                </div>
                <Progress value={0} className="h-2" />
                <p className="text-xs text-muted-foreground">{t('admin.db.storageUnavailableDesc')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tables List */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.db.colTable')}</TableHead>
                <TableHead>{t('admin.db.colDesc')}</TableHead>
                <TableHead className="text-right">{t('admin.db.colRecords')}</TableHead>
                <TableHead className="text-right">{t('admin.db.colShare')}</TableHead>
                <TableHead className="w-[100px]">{t('admin.db.colActions')}</TableHead>
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
                        <Button variant="ghost" size="icon" aria-label={t('admin.db.export')} title={t('admin.db.export')}>
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
            {t('admin.db.exportAll')}
          </Button>
          <Button variant="outline" size="sm">
            <HardDrive className="h-4 w-4 mr-2" />
            {t('admin.db.backup')}
          </Button>
          <Button variant="outline" size="sm" className="text-orange-600 hover:text-orange-700">
            <Trash2 className="h-4 w-4 mr-2" />
            {t('admin.db.clearOld')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
