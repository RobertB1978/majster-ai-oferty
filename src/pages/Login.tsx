import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { CANONICAL_HOME } from '@/config/featureFlags';
import { loginSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock, Loader2, Fingerprint, ArrowRight, CheckCircle2, Star, Wrench, MailCheck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { useQueryClient } from '@tanstack/react-query';
import { AuthDiagnostics } from '@/components/auth/AuthDiagnostics';
import { TurnstileWidget, isCaptchaEnabled } from '@/components/auth/TurnstileWidget';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { BuilderHeroIllustration } from '@/components/auth/BuilderHeroIllustration';
import { motion, AnimatePresence, useReducedMotion, MotionConfig } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

const RESEND_COOLDOWN_SECONDS = 60;

const CAPTCHA_FAIL_THRESHOLD = 3;
/** Feature flag: biometric auth is not yet fully integrated with Supabase sessions.
 *  Set to true once WebAuthn creates proper Supabase auth sessions. */
const FF_BIOMETRIC_AUTH = false;

export default function Login() {
  const { t } = useTranslation();
  // Respect prefers-reduced-motion: when true, skip opacity/transform initial states
  // so axe-core sees fully-opaque elements and passes WCAG AA contrast checks.
  const shouldReduceMotion = useReducedMotion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { login, resendVerificationEmail, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isSupported, checkIfEnabled, authenticateWithBiometric, isAuthenticating } = useBiometricAuth();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  // Stan dla nieotwierdzonych emaili — wyświetla panel odzyskiwania zamiast ślepego komunikatu
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(CANONICAL_HOME);
    }
  }, [user, navigate]);

  useEffect(() => {
    const storedEmail = localStorage.getItem('majster_last_email');
    if (storedEmail) {
      setEmail(storedEmail);
      if (FF_BIOMETRIC_AUTH && isSupported) {
        const enabled = checkIfEnabled(storedEmail);
        setBiometricAvailable(enabled);
      }
    }
  }, [isSupported, checkIfEnabled]);

  useEffect(() => {
    if (FF_BIOMETRIC_AUTH && email && isSupported) {
      const enabled = checkIfEnabled(email);
      setBiometricAvailable(enabled);
    } else {
      setBiometricAvailable(false);
    }
  }, [email, isSupported, checkIfEnabled]);

  // Odliczanie cooldown dla ponownego wysyłania maila weryfikacyjnego
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const showCaptcha = isCaptchaEnabled && failedAttempts >= CAPTCHA_FAIL_THRESHOLD;

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
      toast.error(t('auth.captcha.required'));
      return;
    }

    setIsLoading(true);
    const { error, data } = await login(email, password);
    setIsLoading(false);

    if (error) {
      setFailedAttempts(prev => prev + 1);
      setCaptchaToken(null);
      if (error.includes('Invalid login') || error.includes('Nieprawidłowy email')) {
        toast.error(t('auth.errors.invalidCredentials'));
      } else if (error.includes('Email not confirmed') || error.includes('nie został potwierdzony')) {
        // Zamiast ślepego komunikatu, pokazujemy panel odzyskiwania z przyciskiem resend
        setUnconfirmedEmail(email);
      } else {
        toast.error(error);
      }
    } else {
      setUnconfirmedEmail(null);
      localStorage.setItem('majster_last_email', email);
      toast.success(t('auth.success.loggedIn'));

      if (data?.user?.id) {
        queryClient.prefetchQuery({ queryKey: ['dashboard-project-stats', data.user.id] });
        queryClient.prefetchQuery({ queryKey: ['dashboard-recent-projects', data.user.id] });
        queryClient.prefetchQuery({ queryKey: ['dashboard-clients-count', data.user.id] });
      }

      navigate(CANONICAL_HOME);
    }
  };

  const handleResendVerification = async () => {
    if (!unconfirmedEmail || resendCooldown > 0) return;
    setIsResending(true);
    const { error } = await resendVerificationEmail(unconfirmedEmail);
    setIsResending(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success(t('auth.verifyEmail.resentSuccess'));
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    }
  };

  const handleBiometricLogin = async () => {
    if (!email) {
      toast.error(t('auth.biometric.enterEmailFirst'));
      return;
    }
    const success = await authenticateWithBiometric(email);
    if (success) {
      toast.success(t('auth.biometric.verificationSuccess'));
    } else {
      toast.error(t('auth.biometric.verificationFailed'));
    }
  };

  // Social proof pills — values via t(), rendered as {pill.text} expression containers
  const heroPills = [
    { icon: <CheckCircle2 className="h-3.5 w-3.5" />, text: t('auth.hero.usersCount') },
    { icon: <Star className="h-3.5 w-3.5" />, text: t('auth.hero.rating') },
    { icon: <CheckCircle2 className="h-3.5 w-3.5" />, text: t('auth.hero.freeStart') },
  ];

  return (
    // MotionConfig reducedMotion="user" ensures ALL motion children respect
    // prefers-reduced-motion:reduce set by Playwright, so axe sees fully-opaque
    // elements and WCAG AA contrast checks pass.
    <MotionConfig reducedMotion="user">
      <>
      <Helmet>
        <title>{t('seo.login.title')}</title>
        <meta name="description" content={t('seo.login.description')} />
        <link rel="canonical" href="https://majsterai.com/login" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content={t('seo.login.title')} />
        <meta property="og:description" content={t('seo.login.ogDescription')} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://majsterai.com/login" />
        <meta property="og:image" content="https://majsterai.com/icon-512.png" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={t('seo.login.title')} />
        <meta name="twitter:description" content={t('seo.login.ogDescription')} />
      </Helmet>
      <div className="min-h-screen flex flex-col lg:flex-row bg-background overflow-x-hidden">

        {/* LEFT PANEL — Brand hero (hidden on mobile) */}
        <motion.div
          initial={{ opacity: shouldReduceMotion ? 1 : 0, x: shouldReduceMotion ? 0 : -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative flex-col items-center justify-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(222 47% 11%) 0%, hsl(217 33% 17%) 50%, hsl(30 90% 20%) 100%)',
          }}
        >
          {/* Background dot pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '32px 32px',
            }}
          />

          {/* Amber glow orb */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-20 blur-3xl"
            style={{ background: 'hsl(30 90% 32%)' }}
          />

          <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-lg">
            {/* Logo wordmark */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex items-center gap-3 mb-8"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-xl"
                style={{ background: 'hsl(30 90% 32%)' }}
              >
                <Wrench className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight" aria-hidden="true">{'Majster.AI'}</span>
            </motion.div>

            {/* Illustration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="w-full mb-8"
            >
              <BuilderHeroIllustration />
            </motion.div>

            {/* Tagline — translated */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="space-y-3"
            >
              <p className="text-2xl font-bold text-white leading-tight">
                {t('auth.hero.tagline')}
              </p>
              {/* opacity 0.85 ensures WCAG AA 4.5:1 on the dark gradient background */}
              <p className="text-sm leading-relaxed text-white/85">
                {t('auth.hero.subtitle')}
              </p>
            </motion.div>

            {/* Social proof pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-8 flex flex-wrap justify-center gap-3"
            >
              {heroPills.map((pill) => (
                <div
                  key={pill.text}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.85)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  <span style={{ color: 'hsl(38 92% 60%)' }} aria-hidden="true">{pill.icon}</span>
                  {pill.text}
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* RIGHT PANEL — Login form */}
        <motion.main
          initial={{ opacity: shouldReduceMotion ? 1 : 0, x: shouldReduceMotion ? 0 : 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-1 flex-col items-center justify-center min-h-screen lg:min-h-0 px-6 py-12 bg-background"
          aria-label={t('auth.loginTitle')}
        >
          {/* Mobile logo — visible only on small screens */}
          <div className="flex lg:hidden items-center gap-2 mb-8" aria-hidden="true">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-md">
              <Wrench className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold text-foreground">{'Majster.AI'}</span>
          </div>

          <div className="w-full max-w-sm">
            {/* Page heading — visible to screen readers and E2E tests.
                auth.loginTitle contains "Majster.AI" so Playwright
                getByRole('heading', name:/majster\.ai/i) finds this element. */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-1">
                {t('auth.loginTitle')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('auth.loginSubtitle')}
              </p>
            </div>

            {/* Panel odzyskiwania — email nie potwierdzony */}
            <AnimatePresence>
              {unconfirmedEmail && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30"
                  role="alert"
                  data-testid="unconfirmed-email-banner"
                >
                  <div className="flex items-start gap-3">
                    <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                        {t('auth.errors.emailNotConfirmedTitle')}
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        {t('auth.errors.emailNotConfirmedHint')}{' '}
                        <span className="font-medium break-all">{unconfirmedEmail}</span>
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-1 border-amber-300 bg-white text-amber-800 hover:bg-amber-50 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        onClick={handleResendVerification}
                        disabled={isResending || resendCooldown > 0}
                        data-testid="resend-from-login-btn"
                      >
                        {isResending ? (
                          <>
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                            {t('auth.verifyEmail.resending')}
                          </>
                        ) : resendCooldown > 0 ? (
                          <>
                            <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                            {t('auth.verifyEmail.resentCooldown', { seconds: resendCooldown })}
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                            {t('auth.errors.resendVerification')}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Social login */}
            <SocialLoginButtons disabled={isLoading} />

            {/* Divider */}
            <div className="relative my-6">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
                {t('auth.orWithEmail')}
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Email field */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t('auth.email')}
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" aria-hidden="true" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('auth.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className={`pl-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${errors.email ? 'border-destructive' : 'focus:border-primary'}`}
                  />
                </div>
                <AnimatePresence>
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-xs text-destructive"
                      role="alert"
                    >
                      {errors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    {t('auth.password')}
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary hover:underline font-medium transition-colors"
                  >
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" aria-hidden="true" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('auth.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className={`pl-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${errors.password ? 'border-destructive' : 'focus:border-primary'}`}
                  />
                </div>
                <AnimatePresence>
                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-xs text-destructive"
                      role="alert"
                    >
                      {errors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* CAPTCHA when threshold reached */}
              {showCaptcha && (
                <TurnstileWidget
                  onVerify={(token) => setCaptchaToken(token)}
                  onError={() => setCaptchaToken(null)}
                />
              )}

              {/* Submit */}
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  className="w-full h-11 font-semibold text-sm shadow-md transition-all duration-200 hover:shadow-lg"
                  size="lg"
                  disabled={isLoading || (showCaptcha && !captchaToken)}
                >
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        {t('auth.loggingIn')}
                      </motion.span>
                    ) : (
                      <motion.span
                        key="login"
                        initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        {t('auth.login')}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </form>

            {/* Biometric login */}
            {biometricAvailable && (
              <>
                <div className="relative my-5">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
                    {t('common.or')}
                  </span>
                </div>
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 hover:bg-primary/5 transition-colors"
                    onClick={handleBiometricLogin}
                    disabled={isAuthenticating}
                  >
                    {isAuthenticating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        {t('auth.biometric.verifying')}
                      </>
                    ) : (
                      <>
                        <Fingerprint className="mr-2 h-5 w-5" aria-hidden="true" />
                        {t('auth.biometric.loginWithFingerprint')}
                      </>
                    )}
                  </Button>
                </motion.div>
              </>
            )}

            {/* Register link */}
            <p className="mt-8 text-center text-sm text-muted-foreground">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="font-semibold text-primary hover:underline">
                {t('auth.tryForFree')}
              </Link>
            </p>
          </div>
        </motion.main>
      </div>

      <AuthDiagnostics />
      </>
    </MotionConfig>
  );
}
