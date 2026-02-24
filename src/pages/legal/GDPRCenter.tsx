import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Shield, 
  Download, 
  Trash2, 
  Eye, 
  FileEdit,
  AlertTriangle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLogAuditEvent } from '@/hooks/useAuditLog';

export default function GDPRCenter() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const logAudit = useLogAuditEvent();
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportData = async () => {
    if (!user) return;
    
    setIsExporting(true);
    try {
      // Fetch all user data
      const [
        { data: profile },
        { data: clients },
        { data: projects },
        { data: quotes },
        { data: notifications },
        { data: consents },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('clients').select('*').eq('user_id', user.id),
        supabase.from('projects').select('*').eq('user_id', user.id),
        supabase.from('quotes').select('*').eq('user_id', user.id),
        supabase.from('notifications').select('*').eq('user_id', user.id),
        supabase.from('user_consents').select('*').eq('user_id', user.id),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at,
        },
        profile,
        clients,
        projects,
        quotes,
        notifications,
        consents,
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `majster-ai-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await logAudit.mutateAsync({
        action: 'user.data_export',
        entityType: 'user',
        entityId: user.id,
      });

      toast.success('Dane zostały wyeksportowane');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Błąd podczas eksportu danych');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteRequest = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
      // Log the deletion request
      await logAudit.mutateAsync({
        action: 'user.data_delete_request',
        entityType: 'user',
        entityId: user.id,
      });

      // Create a notification for admin
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Żądanie usunięcia konta',
        message: `Użytkownik ${user.email} złożył żądanie usunięcia konta zgodnie z art. 17 RODO.`,
        type: 'warning',
      });

      toast.success('Żądanie usunięcia zostało wysłane', {
        description: 'Skontaktujemy się z Tobą w ciągu 30 dni.',
      });
      
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Delete request error:', error);
      toast.error('Błąd podczas wysyłania żądania');
    } finally {
      setIsDeleting(false);
    }
  };

  const rights = [
    {
      icon: Eye,
      title: 'Prawo dostępu (art. 15)',
      description: 'Masz prawo wiedzieć, jakie dane o Tobie przetwarzamy.',
      action: 'Przeglądaj dane w swoim profilu i ustawieniach.',
      button: null,
    },
    {
      icon: FileEdit,
      title: 'Prawo do sprostowania (art. 16)',
      description: 'Możesz poprawić swoje dane, jeśli są nieprawidłowe.',
      action: 'Edytuj swoje dane w profilu firmy.',
      button: { label: 'Edytuj profil', onClick: () => navigate('/profile') },
    },
    {
      icon: Download,
      title: 'Prawo do przenoszenia (art. 20)',
      description: 'Możesz pobrać wszystkie swoje dane w formacie JSON.',
      action: 'Kliknij przycisk, aby pobrać kopię swoich danych.',
      button: { 
        label: isExporting ? 'Eksportowanie...' : 'Pobierz moje dane', 
        onClick: handleExportData,
        loading: isExporting,
      },
    },
    {
      icon: Trash2,
      title: 'Prawo do usunięcia (art. 17)',
      description: 'Możesz zażądać usunięcia swojego konta i wszystkich danych.',
      action: 'To działanie jest nieodwracalne. Rozpatrzymy żądanie w ciągu 30 dni.',
      button: { 
        label: 'Żądaj usunięcia', 
        onClick: () => setShowDeleteDialog(true),
        variant: 'destructive' as const,
      },
    },
  ];

  return (
    <>
      <SEOHead
        title="Centrum RODO"
        description="Zarządzaj swoimi danymi osobowymi zgodnie z RODO - eksportuj, edytuj lub usuń swoje dane."
        keywords="RODO, GDPR, prawa użytkownika, ochrona danych, eksport danych"
        noIndex={true}
      />
      
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl py-8 px-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót
          </Button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Centrum RODO</h1>
            <p className="text-muted-foreground">
              Zarządzaj swoimi danymi osobowymi
            </p>
          </div>

          {/* User info card */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="font-medium">Zalogowany jako</p>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {rights.map((right) => (
              <Card key={right.title}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <right.icon className="h-5 w-5 text-primary" />
                    </div>
                    {right.title}
                  </CardTitle>
                  <CardDescription>{right.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{right.action}</p>
                  {right.button && (
                    <Button
                      variant={right.button.variant || 'outline'}
                      onClick={right.button.onClick}
                      disabled={right.button.loading}
                    >
                      {right.button.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {right.button.label}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 p-6 rounded-xl bg-muted/50">
            <div className="flex gap-4">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-1">Ważne informacje</p>
                <p className="text-sm text-muted-foreground">
                  Zgodnie z RODO mamy 30 dni na realizację Twojego żądania. W przypadku 
                  skomplikowanych żądań termin może zostać przedłużony o kolejne 60 dni.
                  W razie pytań skontaktuj się: kontakt.majster@gmail.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Żądanie usunięcia danych
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Czy na pewno chcesz zażądać usunięcia swojego konta i wszystkich danych?
              </p>
              <div className="rounded-lg bg-destructive/10 p-4 text-sm">
                <p className="font-medium text-destructive mb-2">To działanie spowoduje:</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Usunięcie wszystkich Twoich projektów i wycen</li>
                  <li>Usunięcie danych klientów</li>
                  <li>Usunięcie profilu firmy i dokumentów</li>
                  <li>Trwałe usunięcie konta</li>
                </ul>
              </div>
              <p className="text-sm">
                Żądanie zostanie rozpatrzone w ciągu 30 dni. Przed usunięciem 
                zalecamy pobranie kopii swoich danych.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRequest}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Wyślij żądanie
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
