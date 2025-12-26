import { useState, useEffect } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';

export default function Admin() {
  const navigate = useNavigate();
  const { user: _user } = useAuth();
  const { isAdmin, isModerator, isLoading } = useAdminRole();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Redirect non-admins
  useEffect(() => {
    if (!isLoading && !isAdmin && !isModerator) {
      navigate('/dashboard');
    }
  }, [isAdmin, isModerator, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdmin && !isModerator) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Brak dostępu</h1>
        <p className="text-muted-foreground mb-4">
          Nie masz uprawnień do wyświetlenia tej strony.
        </p>
        <Button onClick={() => navigate('/dashboard')}>
          Wróć do panelu
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Panel Administratora | Majster.AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Panel Administratora
            </h1>
            <p className="text-muted-foreground">
              Zarządzaj aplikacją, użytkownikami i ustawieniami
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              System aktywny
            </Badge>
            {isAdmin && (
              <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                Admin
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
              Użytkownicy
            </TabsTrigger>
            <TabsTrigger value="theme" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Motyw
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Treści
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Baza danych
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              System
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Logi
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
