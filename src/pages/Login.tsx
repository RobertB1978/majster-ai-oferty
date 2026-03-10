import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { loginSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock, Loader2, Fingerprint, ArrowRight, CheckCircle2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { useQueryClient } from '@tanstack/react-query';
import { AuthDiagnostics } from '@/components/auth/AuthDiagnostics';
import { TurnstileWidget, isCaptchaEnabled } from '@/components/auth/TurnstileWidget';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { motion, AnimatePresence } from 'framer-motion';

const CAPTCHA_FAIL_THRESHOLD = 3;

/** Inline SVG — Construction hero illustration */
function BuilderHeroIllustration() {
  return (
    <svg
      viewBox="0 0 480 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-sm mx-auto drop-shadow-2xl"
      aria-hidden="true"
    >
      {/* Ground */}
      <ellipse cx="240" cy="390" rx="180" ry="18" fill="rgba(255,255,255,0.08)" />

      {/* Building frame */}
      <rect x="60" y="160" width="360" height="220" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />

      {/* Blueprint grid lines */}
      {[0,1,2,3,4,5].map(i => (
        <line key={`h${i}`} x1="60" y1={180 + i * 33} x2="420" y2={180 + i * 33} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />
      ))}
      {[0,1,2,3,4,5,6,7].map(i => (
        <line key={`v${i}`} x1={80 + i * 48} y1="160" x2={80 + i * 48} y2="380" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />
      ))}

      {/* Roof */}
      <polygon points="40,165 240,60 440,165" fill="rgba(245,158,11,0.85)" />
      <polygon points="40,165 240,60 440,165" fill="none" stroke="rgba(245,158,11,1)" strokeWidth="2" />

      {/* Door */}
      <rect x="190" y="285" width="60" height="95" rx="30" fill="rgba(245,158,11,0.3)" stroke="rgba(245,158,11,0.8)" strokeWidth="2" />
      <circle cx="220" cy="335" r="5" fill="rgba(245,158,11,0.9)" />

      {/* Windows */}
      <rect x="90" y="200" width="80" height="60" rx="4" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
      <line x1="130" y1="200" x2="130" y2="260" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <line x1="90" y1="230" x2="170" y2="230" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

      <rect x="310" y="200" width="80" height="60" rx="4" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
      <line x1="350" y1="200" x2="350" y2="260" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <line x1="310" y1="230" x2="390" y2="230" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

      {/* Worker body */}
      <g transform="translate(195, 85)">
        {/* Head */}
        <circle cx="50" cy="30" r="22" fill="#FBBF24" />
        {/* Hard hat */}
        <ellipse cx="50" cy="12" rx="26" ry="8" fill="#F59E0B" />
        <rect x="24" y="10" width="52" height="8" rx="3" fill="#D97706" />
        {/* Eyes */}
        <circle cx="42" cy="30" r="3" fill="#92400E" />
        <circle cx="58" cy="30" r="3" fill="#92400E" />
        {/* Smile */}
        <path d="M 42 40 Q 50 47 58 40" stroke="#92400E" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* Body */}
        <rect x="25" y="55" width="50" height="65" rx="8" fill="#1E3A5F" />
        {/* Safety vest */}
        <polygon points="50,55 25,70 35,120 65,120 75,70" fill="rgba(245,158,11,0.35)" />
        <rect x="44" y="55" width="12" height="65" fill="rgba(245,158,11,0.35)" />
        {/* Arms */}
        <rect x="5" y="58" width="20" height="45" rx="8" fill="#1E3A5F" />
        <rect x="75" y="58" width="20" height="45" rx="8" fill="#1E3A5F" />
        {/* Tablet in hand */}
        <rect x="75" y="62" width="30" height="22" rx="3" fill="#0F172A" />
        <rect x="77" y="64" width="26" height="18" rx="2" fill="#3B82F6" />
        <line x1="80" y1="68" x2="100" y2="68" stroke="white" strokeWidth="1.5" />
        <line x1="80" y1="72" x2="96" y2="72" stroke="white" strokeWidth="1.5" />
        <line x1="80" y1="76" x2="98" y2="76" stroke="white" strokeWidth="1.5" />
        {/* Legs */}
        <rect x="30" y="118" width="20" height="45" rx="6" fill="#374151" />
        <rect x="55" y="118" width="20" height="45" rx="6" fill="#374151" />
        {/* Boots */}
        <rect x="26" y="158" width="26" height="12" rx="4" fill="#1F2937" />
        <rect x="51" y="158" width="26" height="12" rx="4" fill="#1F2937" />
      </g>

      {/* Floating stat cards */}
      <motion.g
        style={{ originX: '80px', originY: '90px' }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <rect x="20" y="90" width="130" height="52" rx="10" fill="rgba(255,255,255,0.95)" />
        <circle cx="42" cy="116" r="14" fill="rgba(245,158,11,0.15)" />
        <text x="42" y="120" textAnchor="middle" fontSize="14" fill="#D97706">✓</text>
        <text x="62" y="110" fontSize="10" fill="#374151" fontWeight="600">Oferty PDF</text>
        <text x="62" y="124" fontSize="9" fill="#6B7280">247 wygenerowanych</text>
      </motion.g>

      <motion.g
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        <rect x="330" y="95" width="130" height="52" rx="10" fill="rgba(255,255,255,0.95)" />
        <circle cx="352" cy="121" r="14" fill="rgba(34,197,94,0.15)" />
        <text x="352" y="125" textAnchor="middle" fontSize="12" fill="#16A34A">↑</text>
        <text x="372" y="115" fontSize="10" fill="#374151" fontWeight="600">Przychód</text>
        <text x="372" y="129" fontSize="9" fill="#16A34A">+32% ten miesiąc</text>
      </motion.g>

      <motion.g
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <rect x="330" y="280" width="130" height="52" rx="10" fill="rgba(255,255,255,0.95)" />
        <circle cx="352" cy="306" r="14" fill="rgba(59,130,246,0.15)" />
        <text x="352" y="310" textAnchor="middle" fontSize="12" fill="#2563EB">★</text>
        <text x="372" y="300" fontSize="10" fill="#374151" fontWeight="600">Ocena klientów</text>
        <text x="372" y="314" fontSize="9" fill="#2563EB">4.9 / 5.0</text>
      </motion.g>
    </svg>
  );
}

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
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/app/dashboard');
    }
  }, [user, navigate]);

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

  useEffect(() => {
    if (email && isSupported) {
      const enabled = checkIfEnabled(email);
      setBiometricAvailable(enabled);
    } else {
      setBiometricAvailable(false);
    }
  }, [email, isSupported, checkIfEnabled]);

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
      toast.error(t('auth.captcha.required', 'Wymagana weryfikacja CAPTCHA'));
      return;
    }

    setIsLoading(true);
    const { error, data } = await login(email, password);
    setIsLoading(false);

    if (error) {
      setFailedAttempts(prev => prev + 1);
      setCaptchaToken(null);
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

      if (data?.user?.id) {
        queryClient.prefetchQuery({ queryKey: ['dashboard-project-stats', data.user.id] });
        queryClient.prefetchQuery({ queryKey: ['dashboard-recent-projects', data.user.id] });
        queryClient.prefetchQuery({ queryKey: ['dashboard-clients-count', data.user.id] });
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
      toast.success(t('auth.biometric.verificationSuccess'));
    } else {
      toast.error(t('auth.biometric.verificationFailed'));
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col lg:flex-row bg-background overflow-hidden">

        {/* ═══ LEFT PANEL — Brand hero (hidden on mobile) ═══ */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative flex-col items-center justify-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(222 47% 11%) 0%, hsl(217 33% 17%) 50%, hsl(30 90% 20%) 100%)',
          }}
        >
          {/* Background pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '32px 32px',
            }}
          />

          {/* Amber glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-20 blur-3xl"
            style={{ background: 'hsl(30 90% 32%)' }} />

          <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-lg">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex items-center gap-3 mb-8"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-xl"
                style={{ background: 'hsl(30 90% 32%)' }}>
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-white" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">Majster.AI</span>
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

            {/* Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="space-y-3"
            >
              <h1 className="text-2xl font-bold text-white leading-tight">
                Zarządzaj swoim biznesem<br />
                <span style={{ color: 'hsl(38 92% 60%)' }}>jak prawdziwy profesjonalista</span>
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Wyceny PDF, projekty, klienci i asystent AI — wszystko w jednym miejscu dla fachowców w Polsce.
              </p>
            </motion.div>

            {/* Social proof pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-8 flex flex-wrap justify-center gap-3"
            >
              {[
                { icon: <CheckCircle2 className="h-3.5 w-3.5" />, text: '2 400+ fachowców' },
                { icon: <Star className="h-3.5 w-3.5" />, text: 'Ocena 4.9/5' },
                { icon: <CheckCircle2 className="h-3.5 w-3.5" />, text: 'Bezpłatny start' },
              ].map((pill) => (
                <div
                  key={pill.text}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.85)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  <span style={{ color: 'hsl(38 92% 60%)' }}>{pill.icon}</span>
                  {pill.text}
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* ═══ RIGHT PANEL — Login form ═══ */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-1 flex-col items-center justify-center min-h-screen lg:min-h-0 px-6 py-12 bg-background"
        >
          {/* Mobile logo — shown only on mobile */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-md">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-foreground">Majster.AI</span>
          </div>

          <div className="w-full max-w-sm">
            {/* Header text */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-1">Zaloguj się</h2>
              <p className="text-sm text-muted-foreground">
                {t('auth.loginSubtitle', 'Witaj z powrotem! Wpisz swoje dane.')}
              </p>
            </div>

            {/* Social login */}
            <SocialLoginButtons disabled={isLoading} />

            {/* Divider */}
            <div className="relative my-6">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
                lub zaloguj emailem
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t('auth.email', 'Email')}
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('auth.emailPlaceholder', 'twoj@email.pl')}
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
                    >
                      {errors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    {t('auth.password', 'Hasło')}
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary hover:underline font-medium transition-colors"
                  >
                    {t('auth.forgotPassword', 'Zapomniałeś hasła?')}
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('auth.passwordPlaceholder', '••••••••')}
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
                    >
                      {errors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* CAPTCHA */}
              {showCaptcha && (
                <TurnstileWidget
                  onVerify={(token) => setCaptchaToken(token)}
                  onError={() => setCaptchaToken(null)}
                />
              )}

              {/* Submit button */}
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
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('auth.loggingIn', 'Logowanie...')}
                      </motion.span>
                    ) : (
                      <motion.span
                        key="login"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        {t('auth.login', 'Zaloguj się')}
                        <ArrowRight className="h-4 w-4" />
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
                    {t('common.or', 'lub')}
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
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('auth.biometric.verifying', 'Weryfikacja...')}
                      </>
                    ) : (
                      <>
                        <Fingerprint className="mr-2 h-5 w-5" />
                        {t('auth.biometric.loginWithFingerprint', 'Zaloguj odciskiem palca')}
                      </>
                    )}
                  </Button>
                </motion.div>
              </>
            )}

            {/* Register link */}
            <p className="mt-8 text-center text-sm text-muted-foreground">
              {t('auth.noAccount', 'Nie masz konta?')}{' '}
              <Link to="/register" className="font-semibold text-primary hover:underline">
                {t('auth.register', 'Zarejestruj się za darmo')}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      <AuthDiagnostics />
    </>
  );
}
