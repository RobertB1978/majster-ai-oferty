/**
 * PR-05: GDPR + Apple App Store compliant Account Deletion Component
 *
 * Umożliwia użytkownikowi całkowite usunięcie konta i wszystkich danych
 * zgodnie z Art. 17 RODO (Right to Erasure / Right to be Forgotten)
 * oraz wymogami Apple App Store (App Review Guideline 5.1.1).
 *
 * Słowo potwierdzające: "USUŃ" (wymagane przez spec PR-05)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function DeleteAccountSection() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const CONFIRM_KEYWORD = t('deleteAccount.confirmKeyword');

  const handleDeleteAccount = async () => {
    if (!user) return;

    if (confirmText !== CONFIRM_KEYWORD) {
      toast.error(t('deleteAccount.invalidKeyword'));
      return;
    }

    setIsDeleting(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Brak sesji');

      const { error } = await supabase.functions.invoke('delete-user-account', {
        body: { confirmationPhrase: CONFIRM_KEYWORD },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (error) throw error;

      await supabase.auth.signOut();

      toast.success(t('deleteAccount.successTitle'), {
        description: t('deleteAccount.successMessage'),
      });

      navigate('/login');
    } catch (error) {
      console.error('Error deleting account:', error instanceof Error ? error.message : 'unknown');
      toast.error(t('deleteAccount.errorTitle'), {
        description: error instanceof Error ? error.message : t('deleteAccount.errorFallback'),
      });
    } finally {
      setIsDeleting(false);
      setIsDialogOpen(false);
      setConfirmText('');
    }
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          {t('deleteAccount.dangerZoneTitle')}
        </CardTitle>
        <CardDescription>
          {t('deleteAccount.dangerZoneSubtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('deleteAccount.warning')}
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <h4 className="font-medium">{t('deleteAccount.willBeDeleted')}</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>{t('deleteAccount.deletedItems.projects')}</li>
            <li>{t('deleteAccount.deletedItems.clients')}</li>
            <li>{t('deleteAccount.deletedItems.finance')}</li>
            <li>{t('deleteAccount.deletedItems.calendar')}</li>
            <li>{t('deleteAccount.deletedItems.templates')}</li>
            <li>{t('deleteAccount.deletedItems.profile')}</li>
            <li>{t('deleteAccount.deletedItems.account')}</li>
          </ul>
        </div>

        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Trash2 className="mr-2 h-4 w-4" />
              {t('deleteAccount.buttonLabel')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('deleteAccount.dialogTitle')}</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  <p>{t('deleteAccount.dialogDescriptionMain')}</p>
                  <p>{t('deleteAccount.dialogBeforeDeleting')}</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>{t('deleteAccount.dialogConsider.export')}</li>
                    <li>{t('deleteAccount.dialogConsider.download')}</li>
                    <li>{t('deleteAccount.dialogConsider.cancel')}</li>
                  </ul>
                  <div className="space-y-2 pt-4">
                    <Label htmlFor="confirm-delete">
                      {t('deleteAccount.confirmLabel')}{' '}
                      <code className="font-mono font-bold">{CONFIRM_KEYWORD}</code>
                    </Label>
                    <Input
                      id="confirm-delete"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder={t('deleteAccount.confirmPlaceholder')}
                      disabled={isDeleting}
                      autoComplete="off"
                    />
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                {t('deleteAccount.cancelButton')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={confirmText !== CONFIRM_KEYWORD || isDeleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isDeleting ? t('deleteAccount.deletingButton') : t('deleteAccount.confirmButton')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <p className="text-xs text-muted-foreground">
          {t('deleteAccount.gdprNote')}
        </p>
      </CardContent>
    </Card>
  );
}
