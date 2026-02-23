import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { validatePasswordStrength } from '@/lib/validations';
import { Wrench, Mail, Lock, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { TurnstileWidget, isCaptchaEnabled } from '@/components/auth/TurnstileWidget';

export default function Register() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !phone || !password || !confirmPassword) {
      toast.error(t('auth.errors.fillAllFields'));
      return;
    }

    if (isCaptchaEnabled && !captchaToken) {
      toast.error(t('auth.captcha.required', 'Wymagana weryfikacja CAPTCHA'));
      return;
    }

    // Phone validation: strip non-digits, must be ≥9 digits (Polish standard)
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 9) {
      toast.error(t('auth.errors.invalidPhone', 'Podaj prawidłowy numer telefonu (min. 9 cyfr).'));
      return;
    }

    // Anti-abuse: check for duplicate phone in profiles
    const { data: existingPhone, error: phoneCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', digitsOnly)
      .maybeSingle();
    if (phoneCheckError) {
      toast.error(t('auth.errors.registrationFailed', 'Błąd rejestracji. Spróbuj ponownie.'));
      return;
    }
    if (existingPhone) {
      toast.error(t('auth.errors.phoneTaken', 'Ten numer telefonu jest już zarejestrowany.'));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t('auth.errors.passwordsDoNotMatch'));
      return;
    }

    // Strong password validation
    const passwordAnalysis = validatePasswordStrength(password);
    if (!passwordAnalysis.isValid) {
      toast.error(passwordAnalysis.errors[0] || t('auth.errors.passwordRequirements'));
      return;
    }

    setIsLoading(true);
    const { error } = await register(email, password);

    if (error) {
      setIsLoading(false);
      toast.error(error);
      return;
    }

    // Save normalised phone to profile (profile row created by DB trigger on auth.users)
    const { data: { user: newUser } } = await supabase.auth.getUser();
    if (newUser) {
      await supabase.from('profiles').update({ phone: digitsOnly }).eq('id', newUser.id);
    }

    setIsLoading(false);
    toast.success(t('auth.success.accountCreated'));
    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Wrench className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Majster.AI</CardTitle>
          <CardDescription>{t('auth.registerSubtitleFree')}</CardDescription>
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
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('auth.phone', 'Numer telefonu')}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder={t('auth.phonePlaceholder', '+48 500 000 000')}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                  autoComplete="tel"
                />
              </div>
              <p className="text-xs text-muted-foreground">{t('auth.phoneHint', 'Wymagany do weryfikacji konta. Nie udostępniamy go innym.')}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
              <PasswordStrengthIndicator password={password} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <TurnstileWidget
              onVerify={(token) => setCaptchaToken(token)}
              onError={() => setCaptchaToken(null)}
            />
            <Button type="submit" className="w-full" size="lg" disabled={isLoading || (isCaptchaEnabled && !captchaToken)}>
              {isLoading ? t('auth.creatingAccount') : t('auth.createAccount')}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              {t('auth.login')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
