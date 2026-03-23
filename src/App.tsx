import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigationType, useParams } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Suspense, lazy, useEffect } from "react";

// Lazy load React Query Devtools only in development
const ReactQueryDevtools = import.meta.env.MODE === 'development'
  ? lazy(() => import('@tanstack/react-query-devtools').then(module => ({ default: module.ReactQueryDevtools })))
  : null;
import { AuthProvider } from "@/contexts/AuthContext";
import { ConfigProvider } from "@/contexts/ConfigContext";
import { DraftProvider } from "@/contexts/DraftContext";
// useOfflineSync is lazy-loaded to reduce main chunk — it pulls in offline-queue (~12KB source)
// Lazy-load layout components — only one shell layout is used at runtime (gated by FF_NEW_SHELL)
const AppLayout = lazy(() => import("@/components/layout/AppLayout").then(m => ({ default: m.AppLayout })));
const AdminLayout = lazy(() => import("@/components/layout/AdminLayout").then(m => ({ default: m.AdminLayout })));
const NewShellLayout = lazy(() => import("@/components/layout/NewShellLayout").then(m => ({ default: m.NewShellLayout })));
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { FF_NEW_SHELL } from "@/config/featureFlags";
import { PageLoader } from "@/components/layout/PageLoader";
import { ErrorBoundary } from "@/components/ErrorBoundary";
// Lazy-load non-critical UI components to reduce initial bundle
const InstallPrompt = lazy(() => import("@/components/pwa/InstallPrompt").then(m => ({ default: m.InstallPrompt })));
const OfflineBanner = lazy(() => import("@/components/pwa/OfflineBanner").then(m => ({ default: m.OfflineBanner })));
const CookieConsent = lazy(() => import("@/components/legal/CookieConsent").then(m => ({ default: m.CookieConsent })));

// === ZONE 1: PUBLIC (loaded immediately - auth flow) ===
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const NotFound = lazy(() => import("./pages/NotFound"));
const EnvCheck = lazy(() => import("./pages/EnvCheck"));

// === ZONE 1: PUBLIC (lazy) ===
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Landing = lazy(() => import("./pages/Landing"));
const OfferApproval = lazy(() => import("./pages/OfferApproval"));
const OfferPublicPage = lazy(() => import("./pages/OfferPublicPage"));
// PR-12: New tokenized acceptance page
const OfferPublicAccept = lazy(() => import("./pages/OfferPublicAccept"));
const PlanyPage = lazy(() => import("./pages/Plany"));
const PlanyDetailPage = lazy(() => import("./pages/PlanyDetail"));

// Legal pages (lazy - rarely visited)
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService"));
const CookiesPolicy = lazy(() => import("./pages/legal/CookiesPolicy"));
const DPA = lazy(() => import("./pages/legal/DPA"));
const GDPRCenter = lazy(() => import("./pages/legal/GDPRCenter"));

// === ZONE 2: CUSTOMER APP (lazy - auth required) ===
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Clients = lazy(() => import("./pages/Clients"));
const QuoteEditor = lazy(() => import("./pages/QuoteEditor"));
const CompanyProfile = lazy(() => import("./pages/CompanyProfile"));
const ItemTemplates = lazy(() => import("./pages/ItemTemplates"));
const Settings = lazy(() => import("./pages/Settings"));
const PdfGenerator = lazy(() => import("./pages/PdfGenerator"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Finance = lazy(() => import("./pages/Finance"));
const Analytics = lazy(() => import("./pages/Analytics"));
const QuickEstimateWorkspace = lazy(() => import("./pages/QuickEstimateWorkspace"));
const QuickMode = lazy(() => import("./pages/QuickMode"));
const Photos = lazy(() => import("./pages/Photos"));
const Plan = lazy(() => import("./pages/Plan"));

// === ZONE 2b: NEW SHELL screens (lazy - only when FF_NEW_SHELL=true) ===
// HomeLobby — lazy import zachowany na potrzeby przyszłej implementacji sekcji "Kontynuuj".
// Trasa /app/home tymczasowo przekierowuje na /app/dashboard (P9).
// const HomeLobby = lazy(() => import("./pages/HomeLobby"));
const MoreScreen = lazy(() => import("./pages/MoreScreen"));

// === ZONE 2g: ACTIVATED FEATURES (previously hidden behind redirects) ===
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Team = lazy(() => import("./pages/Team"));

// === ZONE 2c: OFFERS PR-09 ===
const OffersPage = lazy(() => import("./pages/Offers"));
const OfferDetail = lazy(() => import("./pages/OfferDetail"));

// === ZONE 2d: PROJECTS V2 PR-13 ===
const ProjectsList = lazy(() => import("./pages/ProjectsList"));
const NewProjectV2 = lazy(() => import("./pages/NewProjectV2"));
const ProjectHub = lazy(() => import("./pages/ProjectHub"));
const ProjectPublicStatus = lazy(() => import("./pages/ProjectPublicStatus"));
// === ZONE 2e: DOSSIER PR-16 ===
const DossierPublicPage = lazy(() => import("./pages/DossierPublicPage"));
// === ZONE 2f: DOCUMENT TEMPLATES PR-17 ===
const DocumentTemplates = lazy(() => import("./pages/DocumentTemplates"));

// === ZONE 3: OWNER CONSOLE (lazy - admin only, separate chunk) ===
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminThemePage = lazy(() => import("./pages/admin/AdminThemePage"));
const AdminContentPage = lazy(() => import("./pages/admin/AdminContentPage"));
const AdminDatabasePage = lazy(() => import("./pages/admin/AdminDatabasePage"));
const AdminSystemPage = lazy(() => import("./pages/admin/AdminSystemPage"));
const AdminApiPage = lazy(() => import("./pages/admin/AdminApiPage"));
const AdminAuditPage = lazy(() => import("./pages/admin/AdminAuditPage"));
const AdminAppConfigPage = lazy(() => import("./pages/admin/AdminAppConfigPage"));
const AdminPlansPage = lazy(() => import("./pages/admin/AdminPlansPage"));
const AdminNavigationPage = lazy(() => import("./pages/admin/AdminNavigationPage"));
const AdminDiagnosticsPage = lazy(() => import("./pages/admin/AdminDiagnosticsPage"));

/** Redirect old /projects/:id paths to /app/projects/:id, preserving the real param value. */
function ProjectRedirect({ suffix = '' }: { suffix?: string }) {
  const { id } = useParams();
  return <Navigate to={`/app/projects/${id}${suffix}`} replace />;
}

/** Redirect legacy /app/jobs/:id paths to /app/projects/:id, preserving the real param value. */
function JobsRedirect({ suffix = '' }: { suffix?: string }) {
  const { id } = useParams();
  return <Navigate to={`/app/projects/${id}${suffix}`} replace />;
}

/** Wires offline queue sync into the app lifecycle (§3.9, §18.1). Lazy-loaded to keep index chunk small. */
const OfflineSyncWatcher = lazy(() => import("@/hooks/useOfflineSync").then(m => {
  // Create a component wrapper for the hook
  const Watcher = () => { m.useOfflineSync(); return null; };
  return { default: Watcher };
}));

/** Initialize theme + lang from localStorage or system preference for all routes. */
function ThemeInitializer() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Sync html[lang] with stored i18next language on boot
    const storedLang = localStorage.getItem('i18nextLng');
    const supportedLangs = ['pl', 'en', 'uk'];
    const lang = storedLang && supportedLangs.includes(storedLang) ? storedLang : 'pl';
    document.documentElement.lang = lang;
  }, []);

  return null;
}

/** Visible banner when user is on a non-canonical host (e.g. www.majsterai.com).
 *  The Vercel redirect should catch most cases, but if it doesn't, this banner
 *  gives the user a clear way to reach the correct domain. */
const CANONICAL_HOST = 'majsterai.com';
function HostMismatchBanner() {
  const host = typeof window !== 'undefined' ? window.location.host : '';
  if (!host.includes(CANONICAL_HOST) || host === CANONICAL_HOST) return null;

  const canonicalUrl = `${window.location.protocol}//${CANONICAL_HOST}${window.location.pathname}${window.location.search}`;

  /* eslint-disable i18next/no-literal-string -- diagnostic banner, always Polish */
  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-center text-xs text-amber-800 dark:text-amber-300" role="alert" data-testid="host-mismatch-banner">
      {'Używasz adresu '}
      <span className="font-medium">{host}</span>
      {'. Dla najlepszego działania przejdź na '}
      <a href={canonicalUrl} className="font-semibold underline hover:no-underline">{CANONICAL_HOST}</a>
      {'.'}
    </div>
  );
  /* eslint-enable i18next/no-literal-string */
}

/** Scroll to top on PUSH/REPLACE navigation; let browser handle POP (back/forward). */
function ScrollRestoration() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType !== 'POP') {
      window.scrollTo(0, 0);
    }
  }, [pathname, navigationType]);

  return null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ConfigProvider>
            <AuthProvider>
              <Suspense fallback={null}>
                <OfflineSyncWatcher />
              </Suspense>
              <ThemeInitializer />
              <ScrollRestoration />
              <HostMismatchBanner />
              <Sonner />
              {/* PR-19: maly baner zamiast pelnoekranowego blokera — uzytkownik widzi dane z cache */}
              <Suspense fallback={null}>
                <OfflineBanner />
                <InstallPrompt />
                <CookieConsent />
              </Suspense>
              <DraftProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* ============================================
                      ZONE 1: PUBLIC (no auth required)
                      ============================================ */}

                  {/* Marketing landing */}
                  <Route path="/" element={<Landing />} />

                  {/* Auth flow */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />

                  {/* Public offer approval (legacy English URL) */}
                  <Route path="/offer/:token" element={<OfferApproval />} />

                  {/* Public client portal (Polish URL) */}
                  <Route path="/oferta/:token" element={<OfferPublicPage />} />

                  {/* PR-12: Tokenized acceptance page (new offers system) */}
                  <Route path="/a/:token" element={<OfferPublicAccept />} />

                  {/* PR-13: Public project status page (no login, no prices) */}
                  <Route path="/p/:token" element={<ProjectPublicStatus />} />

                  {/* PR-16: Public dossier share page (token-scoped, no login, no prices) */}
                  <Route path="/d/:token" element={<DossierPublicPage />} />

                  {/* Environment diagnostic — DEV only */}
                  {import.meta.env.DEV && (
                    <Route path="/env-check" element={<EnvCheck />} />
                  )}

                  {/* Legal pages */}
                  <Route path="/legal" element={<Navigate to="/legal/privacy" replace />} />
                  <Route path="/legal/privacy" element={<PrivacyPolicy />} />
                  <Route path="/legal/terms" element={<TermsOfService />} />
                  <Route path="/legal/cookies" element={<CookiesPolicy />} />
                  <Route path="/legal/dpa" element={<DPA />} />
                  <Route path="/legal/rodo" element={<GDPRCenter />} />

                  {/* Public pricing / plan pages */}
                  <Route path="/plany" element={<PlanyPage />} />
                  <Route path="/plany/:slug" element={<PlanyDetailPage />} />

                  {/* Legacy legal redirects */}
                  <Route path="/privacy" element={<Navigate to="/legal/privacy" replace />} />
                  <Route path="/terms" element={<Navigate to="/legal/terms" replace />} />
                  <Route path="/cookies" element={<Navigate to="/legal/cookies" replace />} />
                  <Route path="/dpa" element={<Navigate to="/legal/dpa" replace />} />
                  <Route path="/rodo" element={<Navigate to="/legal/rodo" replace />} />

                  {/* ============================================
                      ZONE 2: CUSTOMER APP (auth required)
                      FF_NEW_SHELL=true  → NewShellLayout (Home / Offers / Projects / More)
                      FF_NEW_SHELL=false → AppLayout (stary shell — bez zmian)
                      ============================================ */}
                  <Route
                    path="/app"
                    element={
                      <ProtectedRoute>
                        {FF_NEW_SHELL ? <NewShellLayout /> : <AppLayout />}
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="/app/dashboard" replace />} />
                    {/* HomeLobby placeholder — redirect do dashboardu aż „Kontynuuj" będzie zaimplementowane */}
                    <Route path="home" element={<Navigate to="/app/dashboard" replace />} />
                    <Route path="offers" element={<OffersPage />} />
                    <Route path="offers/new" element={<OfferDetail />} />
                    <Route path="offers/:id" element={<OfferDetail />} />
                    {/* Canonical projects routes */}
                    <Route path="projects" element={<ProjectsList />} />
                    <Route path="projects/new" element={<NewProjectV2 />} />
                    <Route path="projects/:id" element={<ProjectHub />} />
                    <Route path="projects/:id/quote" element={<QuoteEditor />} />
                    <Route path="projects/:id/pdf" element={<PdfGenerator />} />
                    <Route path="more" element={<MoreScreen />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="customers" element={<Clients />} />
                    <Route path="customers/new" element={<Navigate to="/app/customers?new=1" replace />} />
                    {/* Legacy /app/jobs → /app/projects redirects */}
                    <Route path="jobs" element={<Navigate to="/app/projects" replace />} />
                    <Route path="jobs/new" element={<Navigate to="/app/projects/new" replace />} />
                    <Route path="jobs/:id" element={<JobsRedirect />} />
                    <Route path="jobs/:id/quote" element={<JobsRedirect suffix="/quote" />} />
                    <Route path="jobs/:id/pdf" element={<JobsRedirect suffix="/pdf" />} />
                    {/* Legacy quick-est redirect → canonical szybka-wycena */}
                    <Route path="quick-est" element={<Navigate to="/app/szybka-wycena" replace />} />
                    <Route path="szybka-wycena" element={<QuickEstimateWorkspace />} />
                    {/* Gate 1 Condition 1: Quick Mode — field data capture one-handed on mobile */}
                    <Route path="quick-mode" element={<QuickMode />} />
                    <Route path="quick" element={<QuickMode />} />
                    <Route path="photos" element={<Photos />} />
                    <Route path="calendar" element={<Calendar />} />
                    <Route path="team" element={<Team />} />
                    <Route path="finance" element={<Finance />} />
                    <Route path="marketplace" element={<Marketplace />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="templates" element={<ItemTemplates />} />
                    <Route path="plan" element={<Plan />} />
                    {/* PR-20: /app/billing alias for plan page (paywall redirect target) */}
                    <Route path="billing" element={<Plan />} />
                    <Route path="profile" element={<CompanyProfile />} />
                    <Route path="settings" element={<Settings />} />
                    {/* PR-17: Document Templates Library */}
                    <Route path="document-templates" element={<DocumentTemplates />} />

                    {/* Canonical redirects for legacy/wrong paths within /app */}
                    <Route path="clients" element={<Navigate to="/app/customers" replace />} />
                    <Route path="dash%20board" element={<Navigate to="/app/dashboard" replace />} />
                    <Route path="dash board" element={<Navigate to="/app/dashboard" replace />} />
                  </Route>

                  {/* ============================================
                      ZONE 3: OWNER CONSOLE (admin auth required)
                      Lazy-loaded: customers never download this bundle
                      ============================================ */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboardPage />} />
                    <Route path="users" element={<AdminUsersPage />} />
                    <Route path="theme" element={<AdminThemePage />} />
                    <Route path="content" element={<AdminContentPage />} />
                    <Route path="database" element={<AdminDatabasePage />} />
                    <Route path="system" element={<AdminSystemPage />} />
                    <Route path="api" element={<AdminApiPage />} />
                    <Route path="audit" element={<AdminAuditPage />} />
                    <Route path="app-config" element={<AdminAppConfigPage />} />
                    <Route path="plans" element={<AdminPlansPage />} />
                    <Route path="navigation" element={<AdminNavigationPage />} />
                    <Route path="diagnostics" element={<AdminDiagnosticsPage />} />
                  </Route>

                  {/* ============================================
                      REDIRECT LAYER: Old routes -> New /app/* routes
                      Preserves bookmarks and external links
                      ============================================ */}
                  <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
                  <Route path="/clients" element={<Navigate to="/app/customers" replace />} />
                  <Route path="/customers" element={<Navigate to="/app/customers" replace />} />
                  <Route path="/projects" element={<Navigate to="/app/projects" replace />} />
                  <Route path="/projects/new" element={<Navigate to="/app/projects/new" replace />} />
                  <Route path="/projects/:id" element={<ProjectRedirect />} />
                  <Route path="/projects/:id/quote" element={<ProjectRedirect suffix="/quote" />} />
                  <Route path="/projects/:id/pdf" element={<ProjectRedirect suffix="/pdf" />} />
                  <Route path="/calendar" element={<Navigate to="/app/calendar" replace />} />
                  <Route path="/team" element={<Navigate to="/app/team" replace />} />
                  <Route path="/finance" element={<Navigate to="/app/finance" replace />} />
                  <Route path="/marketplace" element={<Navigate to="/app/marketplace" replace />} />
                  <Route path="/analytics" element={<Navigate to="/app/analytics" replace />} />
                  <Route path="/templates" element={<Navigate to="/app/templates" replace />} />
                  <Route path="/billing" element={<Navigate to="/app/settings" replace />} />
                  <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
                  <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
                  <Route path="/quick-mode" element={<Navigate to="/app/quick-mode" replace />} />

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              </DraftProvider>
            </AuthProvider>
            </ConfigProvider>
          </BrowserRouter>
        </TooltipProvider>
        {/* React Query Devtools - ONLY in development */}
        {ReactQueryDevtools && (
          <Suspense fallback={null}>
            <ReactQueryDevtools initialIsOpen={false} />
          </Suspense>
        )}
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
