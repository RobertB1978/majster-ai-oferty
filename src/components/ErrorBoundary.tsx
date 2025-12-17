import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { logError } from '@/lib/sentry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorId: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Generate unique error ID for tracking
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return { hasError: true, error, errorId };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const isDev = import.meta.env.MODE === 'development';

    // Log to console (full details only in DEV)
    if (isDev) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    } else {
      console.error(`ErrorBoundary caught error [${this.state.errorId}]`);
    }

    // Report to Sentry with errorId for tracking
    logError(error, {
      errorId: this.state.errorId,
      componentStack: errorInfo.componentStack,
      boundary: 'RootErrorBoundary'
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorId: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Coś poszło nie tak</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-center text-sm">
                Wystąpił nieoczekiwany błąd. Spróbuj odświeżyć stronę lub wrócić do poprzedniej strony.
              </p>

              {/* DEV: Show full error details */}
              {import.meta.env.MODE === 'development' && this.state.error && (
                <details className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                  <summary className="cursor-pointer font-medium">Szczegóły błędu (DEV only)</summary>
                  <pre className="mt-2 whitespace-pre-wrap break-words">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}

              {/* PROD: Show only error ID */}
              {import.meta.env.MODE !== 'development' && this.state.errorId && (
                <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md text-center">
                  <p className="font-mono">ID błędu: {this.state.errorId}</p>
                  <p className="mt-1 text-[10px]">Podaj ten ID kontaktując się z wsparciem technicznym</p>
                </div>
              )}

              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={this.handleRetry}>
                  Spróbuj ponownie
                </Button>
                <Button onClick={this.handleReload}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Odśwież stronę
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
