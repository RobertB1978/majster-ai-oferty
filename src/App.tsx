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
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageLoader } from "@/components/layout/PageLoader";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { OfflineFallback } from "@/components/pwa/OfflineFallback";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CookieConsent } from "@/components/legal/CookieConsent";

// === ZONE 1: PUBLIC (loaded immediately - auth flow) ===
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import EnvCheck from "./pages/EnvCheck";

// === ZONE 1: PUBLIC (lazy) ===
const Landing = lazy(() => import("./pages/Landing"));
const OfferApproval = lazy(() => import("./pages/OfferApproval"));

// Legal pages (lazy - rarely visited)
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService"));
const CookiesPolicy = lazy(() => import("./pages/legal/CookiesPolicy"));
const DPA = lazy(() => import("./pages/legal/DPA"));
const GDPRCenter = lazy(() => import("./pages/legal/GDPRCenter"));

// === ZONE 2: CUSTOMER APP (lazy - auth required) ===
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Clients = lazy(() => import("./pages/Clients"));
const Projects = lazy(() => import("./pages/Projects"));
const NewProject = lazy(() => import("./pages/NewProject"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const QuoteEditor = lazy(() => import("./pages/QuoteEditor"));
const CompanyProfile = lazy(() => import("./pages/CompanyProfile"));
const ItemTemplates = lazy(() => import("./pages/ItemTemplates"));
const Settings = lazy(() => import("./pages/Settings"));
const PdfGenerator = lazy(() => import("./pages/PdfGenerator"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Team = lazy(() => import("./pages/Team"));
const Finance = lazy(() => import("./pages/Finance"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Billing = lazy(() => import("./pages/Billing"));

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

/** Redirect old /projects/:id paths to /app/jobs/:id, preserving the real param value. */
function ProjectRedirect({ suffix = '' }: { suffix?: string }) {
  const { id } = useParams();
  return <Navigate to={`/app/jobs/${id}${suffix}`} replace />;
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
          <BrowserRouter>
            <AuthProvider>
              <ScrollRestoration />
              <Sonner />
              <OfflineFallback />
              <InstallPrompt />
              <CookieConsent />
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
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Public offer approval */}
                  <Route path="/offer/:token" element={<OfferApproval />} />

                  {/* Environment diagnostic */}
                  <Route path="/env-check" element={<EnvCheck />} />

                  {/* Legal pages */}
                  <Route path="/legal/privacy" element={<PrivacyPolicy />} />
                  <Route path="/legal/terms" element={<TermsOfService />} />
                  <Route path="/legal/cookies" element={<CookiesPolicy />} />
                  <Route path="/legal/dpa" element={<DPA />} />
                  <Route path="/legal/gdpr" element={<GDPRCenter />} />

                  {/* Legacy legal redirects */}
                  <Route path="/privacy" element={<Navigate to="/legal/privacy" replace />} />
                  <Route path="/terms" element={<Navigate to="/legal/terms" replace />} />

                  {/* ============================================
                      ZONE 2: CUSTOMER APP (auth required)
                      ============================================ */}
                  <Route path="/app" element={<AppLayout />}>
                    <Route index element={<Navigate to="/app/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="clients" element={<Clients />} />
                    <Route path="jobs" element={<Projects />} />
                    <Route path="jobs/new" element={<NewProject />} />
                    <Route path="jobs/:id" element={<ProjectDetail />} />
                    <Route path="jobs/:id/quote" element={<QuoteEditor />} />
                    <Route path="jobs/:id/pdf" element={<PdfGenerator />} />
                    <Route path="calendar" element={<Calendar />} />
                    <Route path="team" element={<Team />} />
                    <Route path="finance" element={<Finance />} />
                    <Route path="marketplace" element={<Marketplace />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="templates" element={<ItemTemplates />} />
                    <Route path="plan" element={<Billing />} />
                    <Route path="profile" element={<CompanyProfile />} />
                    <Route path="settings" element={<Settings />} />
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
                  <Route path="/clients" element={<Navigate to="/app/clients" replace />} />
                  <Route path="/projects" element={<Navigate to="/app/jobs" replace />} />
                  <Route path="/projects/new" element={<Navigate to="/app/jobs/new" replace />} />
                  <Route path="/projects/:id" element={<ProjectRedirect />} />
                  <Route path="/projects/:id/quote" element={<ProjectRedirect suffix="/quote" />} />
                  <Route path="/projects/:id/pdf" element={<ProjectRedirect suffix="/pdf" />} />
                  <Route path="/calendar" element={<Navigate to="/app/calendar" replace />} />
                  <Route path="/team" element={<Navigate to="/app/team" replace />} />
                  <Route path="/finance" element={<Navigate to="/app/finance" replace />} />
                  <Route path="/marketplace" element={<Navigate to="/app/marketplace" replace />} />
                  <Route path="/analytics" element={<Navigate to="/app/analytics" replace />} />
                  <Route path="/templates" element={<Navigate to="/app/templates" replace />} />
                  <Route path="/billing" element={<Navigate to="/app/plan" replace />} />
                  <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
                  <Route path="/settings" element={<Navigate to="/app/settings" replace />} />

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AuthProvider>
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
