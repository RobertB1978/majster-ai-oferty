import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MailCheck, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet-async';

type VerifyState = 'loading' | 'success' | 'error' | 'invalid';

export default function VerifyContactEmail() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<VerifyState>('loading');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setState('invalid');
      return;
    }

    supabase.functions
      .invoke('consume-contact-email-token', { body: { token } })
      .then(({ error }) => {
        setState(error ? 'error' : 'success');
      });
  }, [searchParams]);

  const isSuccess = state === 'success';
  const isLoading = state === 'loading';

  const title = isLoading
    ? t('verifyContactEmail.titleLoading')
    : isSuccess
    ? t('verifyContactEmail.titleSuccess')
    : t('verifyContactEmail.titleError');

  const desc = isLoading
    ? t('verifyContactEmail.descLoading')
    : isSuccess
    ? t('verifyContactEmail.descSuccess')
    : state === 'invalid'
    ? t('verifyContactEmail.descInvalid')
    : t('verifyContactEmail.descError');

  return (
    <>
      <Helmet>
        <title>{t('verifyContactEmail.pageTitle')} | Majster.AI</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              {isLoading ? (
                <Loader2 className="h-8 w-8 text-primary animate-spin" aria-hidden="true" />
              ) : isSuccess ? (
                <MailCheck className="h-8 w-8 text-primary" aria-hidden="true" />
              ) : (
                <XCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            <CardDescription className="mt-2 text-sm text-muted-foreground">
              {desc}
            </CardDescription>
          </CardHeader>
          {!isLoading && (
            <CardContent className="space-y-3">
              <Button asChild variant={isSuccess ? 'default' : 'outline'} className="w-full">
                <Link to="/app/settings">{t('verifyContactEmail.goToSettings')}</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to="/">{t('verifyContactEmail.goHome')}</Link>
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    </>
  );
}
