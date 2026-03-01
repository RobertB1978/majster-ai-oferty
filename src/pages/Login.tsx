import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { loginSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Wrench, Mail, Lock, Loader2, Fingerprint, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { useQueryClient } from '@tanstack/react-query';
import { AuthDiagnostics } from '@/components/auth/AuthDiagnostics';
import { TurnstileWidget, isCaptchaEnabled } from '@/components/auth/TurnstileWidget';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { useTheme } from '@/hooks/useTheme';

const CAPTCHA_FAIL_THRESHOLD = 3;

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isSupported, checkIfEnabled, authenticateWithBiometric, isAuthenticating } = useBiometricAuth();
  const { isDark, toggleTheme } = useTheme();
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/app/dashboard');
    }
  }, [user, navigate]);

  // Check for stored email and biometric availability
  useEffect(() => {
    const storedEmail = localStorage.getItem('majster_last_email');
    if (storedEmail) {
      setEmail(storedEmail);
      if (isSupported) {
        const enabled = checkIfEnabled(storedEmail);
        setBiometricAvailable(enabled);
      }
    }
  }, [isSupported, checkIfEnabled]);

  // Update biometric availability when email changes
  useEffect(() => {
    if (email && isSupported) {
      const enabled = checkIfEnabled(email);
      setBiometricAvailable(enabled);
    } else {
      setBiometricAvailable(false);
    }
  }, [email, isSupported, checkIfEnabled]);

  const showCaptcha =
    isCaptchaEnabled && failedAttempts >= CAPTCHA_FAIL_THRESHOLD;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    if (showCaptcha && !captchaToken) {
      toast.error(t('auth.captcha.required', 'Wymagana weryfikacja CAPTCHA'));
      return;
    }

    setIsLoading(true);
    const { error, data } = await login(email, password);
    setIsLoading(false);

    if (error) {
      setFailedAttempts(prev => prev + 1);
      setCaptchaToken(null); // require fresh CAPTCHA on next attempt
      if (error.includes('Invalid login')) {
        toast.error(t('auth.errors.invalidCredentials'));
      } else if (error.includes('Email not confirmed')) {
        toast.error(t('auth.errors.emailNotConfirmed'));
      } else {
        toast.error(error);
      }
    } else {
      localStorage.setItem('majster_last_email', email);
      toast.success(t('auth.success.loggedIn'));

      // Prefetch Dashboard data while navigating for instant load
      if (data?.user?.id) {
        queryClient.prefetchQuery({
          queryKey: ['dashboard-project-stats', data.user.id],
        });
        queryClient.prefetchQuery({
          queryKey: ['dashboard-recent-projects', data.user.id],
        });
        queryClient.prefetchQuery({
          queryKey: ['dashboard-clients-count', data.user.id],
        });
      }

      navigate('/app/dashboard');
    }
  };

  const handleBiometricLogin = async () => {
    if (!email) {
      toast.error(t('auth.biometric.enterEmailFirst'));
      return;
    }

    const success = await authenticateWithBiometric(email);
    if (success) {
      // For biometric login, we need the password stored or use a different auth flow
      // Since we're using Supabase Auth, we'll just verify the biometric and show the password field
      toast.success(t('auth.biometric.verificationSuccess'));
    } else {
      toast.error(t('auth.biometric.verificationFailed'));
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background flex flex-col">
        <header className="w-full border-b border-border bg-card">
          <div className="container flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Wrench className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-sm">{'Majster.AI'}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={t('common.toggleTheme')}>
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md animate-fade-in relative shadow-md border">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-sm">
            <Wrench className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold gradient-text">{'Majster.AI'}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t('auth.loginSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SocialLoginButtons disabled={isLoading} />

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pl-10 ${errors.password ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>
            {showCaptcha && (
              <TurnstileWidget
                onVerify={(token) => setCaptchaToken(token)}
                onError={() => setCaptchaToken(null)}
              />
            )}
            <Button type="submit" className="w-full" size="lg" disabled={isLoading || (showCaptcha && !captchaToken)}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.loggingIn')}
                </>
              ) : (
                t('auth.login')
              )}
            </Button>
          </form>

          {biometricAvailable && (
            <>
              <div className="relative my-5">
                <Separator className="bg-border/50" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                  {t('common.or')}
                </span>
              </div>
              <Button type="button" variant="outline" className="w-full hover:bg-primary/5 transition-colors" onClick={handleBiometricLogin} disabled={isAuthenticating}>
                {isAuthenticating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('auth.biometric.verifying')}
                  </>
                ) : (
                  <>
                    <Fingerprint className="mr-2 h-4 w-4" />
                    {t('auth.biometric.loginWithFingerprint')}
                  </>
                )}
              </Button>
            </>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              {t('auth.register')}
            </Link>
          </p>
        </CardContent>
      </Card>
        </div>
      </div>

    {/* Dev-only diagnostics panel */}
    <AuthDiagnostics />
  </>
  );
}
