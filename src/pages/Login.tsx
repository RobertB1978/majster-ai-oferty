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
import { Wrench, Mail, Lock, Loader2, Fingerprint } from 'lucide-react';
import { toast } from 'sonner';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { useQueryClient } from '@tanstack/react-query';
import { AuthDiagnostics } from '@/components/auth/AuthDiagnostics';

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isSupported, checkIfEnabled, authenticateWithBiometric, isAuthenticating } = useBiometricAuth();
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
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

    setIsLoading(true);
    const { error, data } = await login(email, password);
    setIsLoading(false);

    if (error) {
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

      navigate('/dashboard');
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
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md animate-fade-in relative shadow-md border">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-sm">
            <Wrench className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold gradient-text">Majster.AI</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t('auth.loginSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="jan@example.pl"
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
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pl-10 ${errors.password ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
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
              <Button
                type="button"
                variant="outline"
                className="w-full hover:bg-primary/5 transition-colors"
                onClick={handleBiometricLogin}
                disabled={isAuthenticating}
              >
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

    {/* Dev-only diagnostics panel */}
    <AuthDiagnostics />
  </>
  );
}
