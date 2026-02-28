import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  LayoutDashboard, 
  Users, 
  Palette, 
  Settings, 
  Database,
  FileText,
  Activity,
  Key,
  AlertTriangle
} from 'lucide-react';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminUsersManager } from '@/components/admin/AdminUsersManager';
import { AdminThemeEditor } from '@/components/admin/AdminThemeEditor';
import { AdminSystemSettings } from '@/components/admin/AdminSystemSettings';
import { AdminDatabaseManager } from '@/components/admin/AdminDatabaseManager';
import { AdminContentEditor } from '@/components/admin/AdminContentEditor';
import { AuditLogPanel } from '@/components/admin/AuditLogPanel';
import { ApiKeysPanel } from '@/components/api/ApiKeysPanel';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useOrganizationAdmin } from '@/hooks/useOrganizationAdmin';
import { useAuth } from '@/contexts/AuthContext';

export default function Admin() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user: _user } = useAuth();

  // Check both app-wide admin (platform admin) and organization admin
  const { isAdmin: isAppAdmin, isModerator, isLoading: isLoadingAppRole } = useAdminRole();
  const { isOrgAdmin, isLoading: isLoadingOrgRole } = useOrganizationAdmin();
  const [activeTab, setActiveTab] = useState('dashboard');

  const isLoading = isLoadingAppRole || isLoadingOrgRole;
  const hasAdminAccess = isAppAdmin || isModerator || isOrgAdmin;

  // Redirect non-admins
  useEffect(() => {
    if (!isLoading && !hasAdminAccess) {
      navigate('/dashboard');
    }
  }, [hasAdminAccess, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">{t('admin.noAccess')}</h1>
        <p className="text-muted-foreground mb-4">
          {t('admin.noAccessDesc')}
        </p>
        <Button onClick={() => navigate('/dashboard')}>
          {t('admin.backToDashboard')}
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('admin.title')} | Majster.AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              {t('admin.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('admin.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              {t('admin.systemActive')}
            </Badge>
            {isAppAdmin && (
              <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                Platform Admin
              </Badge>
            )}
            {isOrgAdmin && !isAppAdmin && (
              <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                Organization Admin
              </Badge>
            )}
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('admin.users')}
            </TabsTrigger>
            <TabsTrigger value="theme" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              {t('admin.theme')}
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('admin.content')}
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              {t('admin.database')}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t('admin.system')}
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              {t('admin.api')}
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {t('admin.logs')}
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="dashboard">
              <AdminDashboard />
            </TabsContent>

            <TabsContent value="users">
              <AdminUsersManager />
            </TabsContent>

            <TabsContent value="theme">
              <AdminThemeEditor />
            </TabsContent>

            <TabsContent value="content">
              <AdminContentEditor />
            </TabsContent>

            <TabsContent value="database">
              <AdminDatabaseManager />
            </TabsContent>

            <TabsContent value="settings">
              <AdminSystemSettings />
            </TabsContent>

            <TabsContent value="api">
              <ApiKeysPanel />
            </TabsContent>

            <TabsContent value="logs">
              <AuditLogPanel />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
}
