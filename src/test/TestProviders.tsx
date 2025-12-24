import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";

interface TestProvidersProps {
  children: React.ReactNode;
  queryClient: QueryClient;
}

export function TestProviders({ children, queryClient }: TestProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <BrowserRouter>
          {children}
          <Toaster />
        </BrowserRouter>
      </HelmetProvider>
    </QueryClientProvider>
  );
}
