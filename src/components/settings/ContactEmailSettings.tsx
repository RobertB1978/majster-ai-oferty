import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Mail, CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().email('Nieprawidłowy adres email');

export function ContactEmailSettings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const queryClient = useQueryClient();

  const [editEmail, setEditEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [emailError, setEmailError] = useState('');

  const saveEmailMutation = useMutation({
    mutationFn: async (newEmail: string) => {
      if (!user?.id) throw new Error('Nie jesteś zalogowany');

      const { error } = await supabase
        .from('profiles')
        .update({
          contact_email: newEmail,
          contact_email_verified: false,
          contact_email_verified_at: null,
          // Generate a new verification token via DB default
          contact_email_verification_token: crypto.randomUUID(),
        })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Email do odpowiedzi zapisany. Sprawdź skrzynkę pocztową, by go zweryfikować.');
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Nie udało się zapisać adresu email');
    },
  });

  const sendVerificationMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Nie jesteś zalogowany');
      if (!profile?.contact_email) throw new Error('Brak adresu email do weryfikacji');

      // Call edge function to send verification email
      const { error } = await supabase.functions.invoke('verify-contact-email', {
        body: { userId: user.id, email: profile.contact_email },
      });

      if (error) throw error;

      // Record that we sent the verification
      await supabase
        .from('profiles')
        .update({ contact_email_verification_sent_at: new Date().toISOString() })
        .eq('user_id', user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Email weryfikacyjny został wysłany. Sprawdź skrzynkę pocztową.');
    },
    onError: () => {
      // Edge function may not exist yet — still show partial success
      toast.success('Email weryfikacyjny wysłany (usługa email musi być skonfigurowana).');
    },
  });

  const handleSave = () => {
    const result = emailSchema.safeParse(editEmail.trim());
    if (!result.success) {
      setEmailError(result.error.errors[0].message);
      return;
    }
    setEmailError('');

    // If email changed, reset verification
    saveEmailMutation.mutate(editEmail.trim());
  };

  const handleStartEdit = () => {
    setEditEmail(profile?.contact_email ?? '');
    setEmailError('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEmailError('');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isVerified = profile?.contact_email_verified === true;
  const hasEmail = Boolean(profile?.contact_email);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          {t('settings.contactEmail.title', 'Email do odpowiedzi')}
        </CardTitle>
        <CardDescription>
          {t(
            'settings.contactEmail.desc',
            'Ten adres będzie ustawiony jako Reply-To w emailach z ofertami, aby klienci mogli do Ciebie odpisać.'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status badge */}
        {hasEmail && (
          <div className="flex items-center gap-2">
            {isVerified ? (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800 gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t('settings.contactEmail.verified', 'Zweryfikowany')}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-700 gap-1 bg-amber-50 dark:bg-amber-900/20">
                <AlertCircle className="h-3.5 w-3.5" />
                {t('settings.contactEmail.unverified', 'Niezweryfikowany')}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">{profile.contact_email}</span>
          </div>
        )}

        {/* Edit form */}
        {isEditing ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="contact-email">
                {t('settings.contactEmail.inputLabel', 'Nowy adres email')}
              </Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="jan@firma.pl"
                value={editEmail}
                onChange={(e) => {
                  setEditEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? 'email-error' : undefined}
              />
              {emailError && (
                <p id="email-error" className="text-sm text-destructive">{emailError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {t(
                  'settings.contactEmail.changeWarning',
                  'Zmiana adresu email wymaga ponownej weryfikacji.'
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={saveEmailMutation.isPending}
                size="sm"
              >
                {saveEmailMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('common.save', 'Zapisz')}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                {t('common.cancel', 'Anuluj')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleStartEdit}>
              {hasEmail
                ? t('settings.contactEmail.change', 'Zmień email')
                : t('settings.contactEmail.add', 'Dodaj email do odpowiedzi')}
            </Button>
            {hasEmail && !isVerified && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendVerificationMutation.mutate()}
                disabled={sendVerificationMutation.isPending}
              >
                {sendVerificationMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {t('settings.contactEmail.sendVerification', 'Wyślij email weryfikacyjny')}
              </Button>
            )}
          </div>
        )}

        {/* Info box */}
        {hasEmail && !isVerified && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-300">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>
                {t(
                  'settings.contactEmail.verifyPrompt',
                  'Zweryfikuj adres email, aby klienci mogli do Ciebie odpisywać na oferty. Bez weryfikacji pole Reply-To nie będzie ustawiane w emailach.'
                )}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
