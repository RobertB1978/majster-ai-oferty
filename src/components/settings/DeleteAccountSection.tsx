/**
 * GDPR-compliant Account Deletion Component — PR-05
 *
 * Allows users to permanently delete their account and all data
 * per Art. 17 GDPR (Right to Erasure / Right to be Forgotten).
 * Required by Apple App Store review guidelines.
 *
 * Confirmation keyword: "USUŃ" (must be typed exactly, case-sensitive)
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

/** Confirmation keyword that the user must type exactly (case-sensitive) */
const CONFIRMATION_KEYWORD = 'USUŃ';

export function DeleteAccountSection() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;

    if (confirmText !== CONFIRMATION_KEYWORD) {
      toast.error(t('deleteAccount.wrongKeyword', { keyword: CONFIRMATION_KEYWORD }));
      return;
    }

    setIsDeleting(true);

    try {
      const { error } = await supabase.functions.invoke('delete-user-account', {
        body: { confirmationPhrase: CONFIRMATION_KEYWORD },
      });

      if (error) throw error;

      await supabase.auth.signOut();

      toast.success(t('deleteAccount.successTitle'), {
        description: t('deleteAccount.successDescription'),
      });

      navigate('/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(t('deleteAccount.errorTitle'), {
        description: t('deleteAccount.errorDescription'),
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
          {t('deleteAccount.dangerZoneDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('deleteAccount.warningText')}
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <h4 className="font-medium">{t('deleteAccount.whatWillBeDeleted')}</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>{t('deleteAccount.item.projects')}</li>
            <li>{t('deleteAccount.item.clients')}</li>
            <li>{t('deleteAccount.item.finance')}</li>
            <li>{t('deleteAccount.item.calendar')}</li>
            <li>{t('deleteAccount.item.templates')}</li>
            <li>{t('deleteAccount.item.profile')}</li>
            <li>{t('deleteAccount.item.account')}</li>
          </ul>
        </div>

        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Trash2 className="mr-2 h-4 w-4" />
              {t('deleteAccount.triggerButton')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('deleteAccount.dialogTitle')}</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  <p>
                    {t('deleteAccount.dialogWarning')}
                  </p>
                  <p>{t('deleteAccount.dialogConsider')}</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>{t('deleteAccount.consider.exportData')}</li>
                    <li>{t('deleteAccount.consider.downloadDocs')}</li>
                    <li>{t('deleteAccount.consider.cancelSubscription')}</li>
                  </ul>
                  <div className="space-y-2 pt-4">
                    <Label htmlFor="confirm-delete">
                      {t('deleteAccount.typeToConfirm', { keyword: CONFIRMATION_KEYWORD })}
                    </Label>
                    <Input
                      id="confirm-delete"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder={CONFIRMATION_KEYWORD}
                      disabled={isDeleting}
                      autoComplete="off"
                    />
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                {t('common.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={confirmText !== CONFIRMATION_KEYWORD || isDeleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isDeleting ? t('deleteAccount.deleting') : t('deleteAccount.confirmButton')}
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
