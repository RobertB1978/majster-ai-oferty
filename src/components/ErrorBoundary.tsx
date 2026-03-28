import { logger } from '@/lib/logger';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { logError } from '@/lib/sentry';
import { buildDiagnostic, type ErrorDiagnostic } from '@/lib/errorDiagnostics';
import i18n from '@/i18n';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  diagnostic: ErrorDiagnostic | null;
}

/**
 * Lightweight error boundary for non-critical UI panels.
 * Renders null on error so the rest of the page remains usable.
 */
export class PanelErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null, diagnostic: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, diagnostic: buildDiagnostic(error) };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { diagnostic } = this.state;
    logger.error('PanelErrorBoundary caught an error:', error, errorInfo);
    logError(error, {
      componentStack: errorInfo.componentStack,
      boundary: 'PanelErrorBoundary',
      errorCode: diagnostic?.code,
      debugId: diagnostic?.debugId,
    });
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    diagnostic: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, diagnostic: buildDiagnostic(error) };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { diagnostic } = this.state;
    logger.error('ErrorBoundary caught an error:', error, errorInfo);

    // Report to Sentry with stable diagnostic metadata — no raw stack exposed
    logError(error, {
      componentStack: errorInfo.componentStack,
      boundary: 'RootErrorBoundary',
      errorCode: diagnostic?.code,
      debugId: diagnostic?.debugId,
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, diagnostic: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { diagnostic } = this.state;

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>{i18n.t('errors.somethingWentWrong')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-center text-sm">
                {i18n.t('errors.loadPartFailed')}
              </p>
              {diagnostic && (
                <div className="text-xs text-muted-foreground bg-muted px-3 py-2 rounded-md space-y-1 select-all">
                  <p>
                    <span className="font-medium">{i18n.t('errors.errorCode')}</span>{' '}
                    {diagnostic.code}
                  </p>
                  <p>
                    <span className="font-medium">{i18n.t('errors.debugId')}</span>{' '}
                    {diagnostic.debugId}
                  </p>
                </div>
              )}
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={this.handleRetry}>
                  {i18n.t('common.retry')}
                </Button>
                <Button onClick={this.handleReload}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {i18n.t('common.refreshPage')}
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
