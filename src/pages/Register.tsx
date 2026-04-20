import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { CANONICAL_HOME } from '@/config/featureFlags';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { validatePasswordStrength } from '@/lib/validations';
import { Wrench, Mail, Lock, Phone, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { TurnstileWidget, isCaptchaEnabled } from '@/components/auth/TurnstileWidget';
import { Helmet } from 'react-helmet-async';
import { getSiteUrl } from '@/lib/siteUrl';
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics';
import { fetchSignupRequiredDocs, storePendingAcceptances } from '@/lib/legal/acceptance';
import type { SignupLegalDoc } from '@/lib/legal/acceptance';

export default function Register() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [privacyError, setPrivacyError] = useState(false);
  const [legalDocs, setLegalDocs] = useState<SignupLegalDoc[]>([]);
  const [legalLoading, setLegalLoading] = useState(true);
  const [legalFetchError, setLegalFetchError] = useState(false);
  const { register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(CANONICAL_HOME);
    }
  }, [user, navigate]);

  const loadLegalDocs = () => {
    setLegalLoading(true);
    setLegalFetchError(false);
    let active = true;
    fetchSignupRequiredDocs()
      .then((docs) => {
        if (!active) return;
        // Both terms and privacy must be present; treat partial as a fetch error.
        const hasTerms = docs.some(d => d.slug === 'terms');
        const hasPrivacy = docs.some(d => d.slug === 'privacy');
        if (hasTerms && hasPrivacy) {
          setLegalDocs(docs);
        } else {
          setLegalFetchError(true);
        }
      })
      .catch(() => { if (active) setLegalFetchError(true); })
      .finally(() => { if (active) setLegalLoading(false); });
    return () => { active = false; };
  };

  useEffect(loadLegalDocs, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      toast.error(t('auth.errors.fillAllFields'));
      return;
    }

    if (isCaptchaEnabled && !captchaToken) {
      toast.error(t('auth.captcha.required'));
      return;
    }

    // Phone validation (optional field): only validate if provided
    let digitsOnly = '';
    if (phone.trim()) {
      digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.length < 9) {
        toast.error(t('auth.errors.invalidPhone'));
        return;
      }

      // Anti-abuse: check for duplicate phone in profiles
      const { data: existingPhone, error: phoneCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', digitsOnly)
        .maybeSingle();
      if (phoneCheckError) {
        toast.error(t('auth.errors.registrationFailed'));
        return;
      }
      if (existingPhone) {
        toast.error(t('auth.errors.phoneTaken'));
        return;
      }
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

    // Legal acceptance validation
    const missingTerms = !termsChecked;
    const missingPrivacy = !privacyChecked;
    if (missingTerms) setTermsError(true);
    if (missingPrivacy) setPrivacyError(true);
    if (missingTerms || missingPrivacy) return;

    trackEvent(ANALYTICS_EVENTS.SIGNUP_STARTED);
    setIsLoading(true);
    const { error } = await register(email, password);

    if (error) {
      setIsLoading(false);
      toast.error(error);
      return;
    }

    // Save normalised phone to profile if provided (profile row created by DB trigger on auth.users)
    if (digitsOnly) {
      const { data: { user: newUser } } = await supabase.auth.getUser();
      if (newUser) {
        await supabase.from('profiles').update({ phone: digitsOnly }).eq('id', newUser.id);
      }
    }

    trackEvent(ANALYTICS_EVENTS.SIGNUP_COMPLETED);
    // Store legal acceptances in localStorage; they will be written to legal_acceptances
    // when the user confirms their email and a real authenticated session is established
    // (AuthContext.onAuthStateChange 'SIGNED_IN' handler picks them up).
    if (legalDocs.length > 0) {
      storePendingAcceptances(legalDocs);
    }
    setIsLoading(false);
    // Supabase wymaga potwierdzenia emaila — kierujemy użytkownika na ekran oczekiwania,
    // NIE do aplikacji. Konto nie jest w pełni aktywne przed kliknięciem w link.
    navigate(`/verify-email?email=${encodeURIComponent(email)}`);
  };

  return (
    <>
    <Helmet>
      <title>{t('seo.register.title')}</title>
      <meta name="description" content={t('seo.register.description')} />
      <link rel="canonical" href={`${getSiteUrl()}/register`} />
      <meta name="robots" content="index, follow" />
      <meta property="og:title" content={t('seo.register.ogTitle')} />
      <meta property="og:description" content={t('seo.register.ogDescription')} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`${getSiteUrl()}/register`} />
      <meta property="og:image" content={`${getSiteUrl()}/icon-512.png`} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={t('seo.register.title')} />
      <meta name="twitter:description" content={t('seo.register.ogDescription')} />
    </Helmet>
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
              <Label htmlFor="phone">{t('auth.phone')} <span className="text-muted-foreground text-xs">({t('common.optional')})</span></Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder={t('auth.phonePlaceholder')}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                  autoComplete="tel"
                />
              </div>
              <p className="text-xs text-muted-foreground">{t('auth.phoneHint')}</p>
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
            {/* Legal acceptance — binding for signup */}
            <div className="space-y-3 rounded-md border border-border bg-muted/30 p-4">
              {legalFetchError && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {t('auth.legalConsent.fetchError')}{' '}
                    <button
                      type="button"
                      className="underline hover:no-underline"
                      onClick={loadLegalDocs}
                    >
                      {t('auth.legalConsent.retryFetch')}
                    </button>
                  </span>
                </div>
              )}

              {/* Terms of Service checkbox */}
              <div className="space-y-1">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="termsAccepted"
                    checked={termsChecked}
                    onCheckedChange={(checked) => {
                      setTermsChecked(checked === true);
                      if (checked) setTermsError(false);
                    }}
                    disabled={legalLoading || legalFetchError}
                    className="mt-0.5"
                    aria-required="true"
                  />
                  <label
                    htmlFor="termsAccepted"
                    className="cursor-pointer text-sm leading-relaxed"
                  >
                    {t('auth.legalConsent.termsPrefix')}{' '}
                    <Link
                      to="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:no-underline"
                    >
                      {t('auth.legalConsent.termsLinkText')}
                    </Link>
                    {' '}{t('auth.legalConsent.termsSuffix')}
                    {legalDocs.find(d => d.slug === 'terms') && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        (v{legalDocs.find(d => d.slug === 'terms')!.version})
                      </span>
                    )}
                    <span className="ml-1 text-destructive" aria-hidden="true">*</span>
                  </label>
                </div>
                {termsError && (
                  <p className="pl-7 text-xs text-destructive" role="alert">
                    {t('auth.legalConsent.termsRequired')}
                  </p>
                )}
              </div>

              {/* Privacy Policy checkbox */}
              <div className="space-y-1">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="privacyAccepted"
                    checked={privacyChecked}
                    onCheckedChange={(checked) => {
                      setPrivacyChecked(checked === true);
                      if (checked) setPrivacyError(false);
                    }}
                    disabled={legalLoading || legalFetchError}
                    className="mt-0.5"
                    aria-required="true"
                  />
                  <label
                    htmlFor="privacyAccepted"
                    className="cursor-pointer text-sm leading-relaxed"
                  >
                    {t('auth.legalConsent.privacyPrefix')}{' '}
                    <Link
                      to="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:no-underline"
                    >
                      {t('auth.legalConsent.privacyLinkText')}
                    </Link>
                    {' '}{t('auth.legalConsent.privacySuffix')}
                    {legalDocs.find(d => d.slug === 'privacy') && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        (v{legalDocs.find(d => d.slug === 'privacy')!.version})
                      </span>
                    )}
                    <span className="ml-1 text-destructive" aria-hidden="true">*</span>
                  </label>
                </div>
                {privacyError && (
                  <p className="pl-7 text-xs text-destructive" role="alert">
                    {t('auth.legalConsent.privacyRequired')}
                  </p>
                )}
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
    </>
  );
}
