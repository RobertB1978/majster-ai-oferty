import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MailCheck, RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmail() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { resendVerificationEmail, user } = useAuth();
  const navigate = useNavigate();

  const email = searchParams.get('email') ?? '';

  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Jeśli użytkownik potwierdził email i jest zalogowany — przekieruj do aplikacji
  useEffect(() => {
    if (user && user.email_confirmed_at) {
      navigate('/app/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Odliczanie cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email) {
      toast.error(t('auth.verifyEmail.noEmailError', 'Brak adresu email. Wróć do rejestracji.'));
      return;
    }
    if (cooldown > 0) return;

    setIsSending(true);
    const { error } = await resendVerificationEmail(email);
    setIsSending(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success(t('auth.verifyEmail.resentSuccess'));
      setCooldown(RESEND_COOLDOWN_SECONDS);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('auth.verifyEmail.pageTitle', 'Weryfikacja emaila')} | Majster.AI</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <MailCheck className="h-8 w-8 text-primary" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {t('auth.verifyEmail.title')}
            </CardTitle>
            <CardDescription className="mt-2 text-sm text-muted-foreground">
              {email ? (
                <>
                  {t('auth.verifyEmail.descriptionWithEmail')}{' '}
                  <span className="font-medium text-foreground break-all">{email}</span>
                </>
              ) : (
                t('auth.verifyEmail.description')
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Wskazówka o spamie */}
            <p className="text-center text-xs text-muted-foreground">
              {t('auth.verifyEmail.checkSpam')}
            </p>

            {/* Przycisk ponownego wysyłania */}
            <Button
              onClick={handleResend}
              disabled={isSending || cooldown > 0}
              variant="outline"
              className="w-full"
              data-testid="resend-verification-btn"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  {t('auth.verifyEmail.resending')}
                </>
              ) : cooldown > 0 ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                  {t('auth.verifyEmail.resentCooldown', { seconds: cooldown })}
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                  {t('auth.verifyEmail.resendButton')}
                </>
              )}
            </Button>

            {/* Powrót do logowania */}
            <Button asChild variant="ghost" className="w-full">
              <Link to="/login">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                {t('auth.verifyEmail.backToLogin')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
