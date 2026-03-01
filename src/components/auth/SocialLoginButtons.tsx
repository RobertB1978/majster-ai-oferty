import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 3.99zM13.4 7.17c-.06 2.37-2.15 4.16-4.4 3.97-.27-2.3 2.02-4.2 4.4-3.97z" />
    </svg>
  );
}

interface SocialLoginButtonsProps {
  disabled?: boolean;
}

export function SocialLoginButtons({ disabled = false }: SocialLoginButtonsProps) {
  const { t } = useTranslation();
  const { loginWithGoogle, loginWithApple } = useAuth();
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'apple' | null>(null);

  const handleGoogle = async () => {
    setLoadingProvider('google');
    const { error } = await loginWithGoogle();
    if (error) {
      toast.error(t('auth.social.oauthError'));
      setLoadingProvider(null);
    }
    // On success, browser redirects — no need to reset loading state
  };

  const handleApple = async () => {
    setLoadingProvider('apple');
    const { error } = await loginWithApple();
    if (error) {
      toast.error(t('auth.social.oauthError'));
      setLoadingProvider(null);
    }
  };

  const isLoading = loadingProvider !== null;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Separator className="bg-border/50" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
          {t('auth.social.orContinueWith')}
        </span>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        size="lg"
        onClick={handleGoogle}
        disabled={disabled || isLoading}
        aria-label={t('auth.social.continueWithGoogle')}
      >
        {loadingProvider === 'google' ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <GoogleIcon />
        )}
        {loadingProvider === 'google' ? t('auth.social.signingIn') : t('auth.social.continueWithGoogle')}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        size="lg"
        onClick={handleApple}
        disabled={disabled || isLoading}
        aria-label={t('auth.social.continueWithApple')}
      >
        {loadingProvider === 'apple' ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <AppleIcon />
        )}
        {loadingProvider === 'apple' ? t('auth.social.signingIn') : t('auth.social.continueWithApple')}
      </Button>
    </div>
  );
}
