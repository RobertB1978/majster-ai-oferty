import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { OfflineFallback } from "@/components/pwa/OfflineFallback";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CookieConsent } from "@/components/legal/CookieConsent";

// Auth pages - Keep eager (critical path for first load)
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Dashboard - Keep eager (first page after login)
import Dashboard from "./pages/Dashboard";

// Lazy load main app pages (loaded on demand)
const Admin = lazy(() => import("./pages/Admin"));
const Clients = lazy(() => import("./pages/Clients"));
const Projects = lazy(() => import("./pages/Projects"));
const NewProject = lazy(() => import("./pages/NewProject"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const QuoteEditor = lazy(() => import("./pages/QuoteEditor"));
const PdfGenerator = lazy(() => import("./pages/PdfGenerator"));
const CompanyProfile = lazy(() => import("./pages/CompanyProfile"));
const ItemTemplates = lazy(() => import("./pages/ItemTemplates"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Team = lazy(() => import("./pages/Team"));
const Finance = lazy(() => import("./pages/Finance"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Settings = lazy(() => import("./pages/Settings"));
const Billing = lazy(() => import("./pages/Billing"));
const OfferApproval = lazy(() => import("./pages/OfferApproval"));

// Legal pages - Lazy load (rarely accessed)
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService"));
const CookiesPolicy = lazy(() => import("./pages/legal/CookiesPolicy"));
const DPA = lazy(() => import("./pages/legal/DPA"));
const GDPRCenter = lazy(() => import("./pages/legal/GDPRCenter"));

// 404 page - Lazy load
const NotFound = lazy(() => import("./pages/NotFound"));

// Lazy load React Query Devtools only in development to avoid bundling in production
const ReactQueryDevtools = import.meta.env.MODE === 'development'
  ? lazy(() => import('@tanstack/react-query-devtools').then(module => ({ default: module.ReactQueryDevtools })))
  : null;

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

// Loading fallback component for lazy-loaded routes
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

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
                  {/* Public auth routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Public offer approval */}
                  <Route path="/offer/:token" element={<OfferApproval />} />

                  {/* Legal pages - new structure */}
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
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
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