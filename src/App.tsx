import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { OfflineFallback } from "@/components/pwa/OfflineFallback";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Projects from "./pages/Projects";
import NewProject from "./pages/NewProject";
import ProjectDetail from "./pages/ProjectDetail";
import QuoteEditor from "./pages/QuoteEditor";
import PdfGenerator from "./pages/PdfGenerator";
import CompanyProfile from "./pages/CompanyProfile";
import ItemTemplates from "./pages/ItemTemplates";
import Calendar from "./pages/Calendar";
import Analytics from "./pages/Analytics";
import Team from "./pages/Team";
import Finance from "./pages/Finance";
import Marketplace from "./pages/Marketplace";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import OfferApproval from "./pages/OfferApproval";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/offer/:token" element={<OfferApproval />} />
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
                </Route>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
