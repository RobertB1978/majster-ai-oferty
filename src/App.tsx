import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Suspense, lazy } from "react";

// Lazy load React Query Devtools only in development
const ReactQueryDevtools = import.meta.env.MODE === 'development'
  ? lazy(() => import('@tanstack/react-query-devtools').then(module => ({ default: module.ReactQueryDevtools })))
  : null;
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageLoader } from "@/components/layout/PageLoader";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { OfflineFallback } from "@/components/pwa/OfflineFallback";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CookieConsent } from "@/components/legal/CookieConsent";

// Critical pages (loaded immediately - auth flow only)
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import EnvCheck from "./pages/EnvCheck"; // Environment diagnostic page

// Lazy-loaded pages (code splitting for better initial load)
// All app pages are lazy-loaded to reduce initial bundle size
const Offers = lazy(() => import("./pages/Offers"));
const OfferWizard = lazy(() => import("./pages/OfferWizard"));
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
const Admin = lazy(() => import("./pages/Admin"));
const OfferApproval = lazy(() => import("./pages/OfferApproval"));

// Legal pages (lazy - rarely visited)
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService"));
const CookiesPolicy = lazy(() => import("./pages/legal/CookiesPolicy"));
const DPA = lazy(() => import("./pages/legal/DPA"));
const GDPRCenter = lazy(() => import("./pages/legal/GDPRCenter"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (renamed from cacheTime)
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
              <Toaster />
              <Sonner />
              <OfflineFallback />
              <InstallPrompt />
              <CookieConsent />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Environment diagnostic (public) */}
                  <Route path="/env-check" element={<EnvCheck />} />

                  {/* Public auth routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Public offer approval (lazy) */}
                  <Route path="/offer/:token" element={<OfferApproval />} />

                  {/* Legal pages (lazy) */}
                  <Route path="/legal/privacy" element={<PrivacyPolicy />} />
                  <Route path="/legal/terms" element={<TermsOfService />} />
                  <Route path="/legal/cookies" element={<CookiesPolicy />} />
                  <Route path="/legal/dpa" element={<DPA />} />
                  <Route path="/legal/gdpr" element={<GDPRCenter />} />

                  {/* Legacy redirects */}
                  <Route path="/privacy" element={<Navigate to="/legal/privacy" replace />} />
                  <Route path="/terms" element={<Navigate to="/legal/terms" replace />} />

                  {/* Protected app routes */}
                  <Route element={<AppLayout />}>
                    <Route path="/offers" element={<Offers />} />
                    <Route path="/offers/new" element={<OfferWizard />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/projects/new" element={<NewProject />} />
                    <Route path="/projects/:id" element={<ProjectDetail />} />
                    <Route path="/projects/:id/quote" element={<QuoteEditor />} />
                    <Route path="/projects/:id/pdf" element={<PdfGenerator />} />
                    <Route path="/profile" element={<CompanyProfile />} />
                    <Route path="/templates" element={<ItemTemplates />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/team" element={<Team />} />
                    <Route path="/finance" element={<Finance />} />
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/billing" element={<Billing />} />
                    <Route path="/admin" element={<Admin />} />
                  </Route>

                  {/* Default and 404 */}
                  <Route path="/" element={<Navigate to="/offers" replace />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
        {/* React Query Devtools - ONLY in development, not in production */}
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