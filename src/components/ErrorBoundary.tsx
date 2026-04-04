import { logger } from '@/lib/logger';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Sentry loaded dynamically to keep it out of the main entry chunk.
// logError is only called on error, so lazy loading is safe here.
const logErrorLazy = (error: Error, context?: Record<string, unknown>) => {
  import('@/lib/sentry').then(m => m.logError(error, context)).catch(() => {
    console.error('Sentry unavailable, error:', error, context);
  });
};
import i18n from '@/i18n';
import { formatError, type FormattedError } from '@/lib/errors/formatError';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  formattedError: FormattedError | null;
}

/**
 * Lightweight error boundary for non-critical UI panels.
 * Renders null on error so the rest of the page remains usable.
 */
export class PanelErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null, formattedError: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, formattedError: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('PanelErrorBoundary caught an error:', error, errorInfo);
    logErrorLazy(error, {
      componentStack: errorInfo.componentStack,
      boundary: 'PanelErrorBoundary',
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
    formattedError: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      // MAJ-UNK-001 is the fallback for unidentified root-level failures.
      // Feature modules may throw with a specific domainCode context in future PRs.
      formattedError: formatError(error),
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught an error:', error, errorInfo);
    const { formattedError } = this.state;

    logErrorLazy(error, {
      componentStack: errorInfo.componentStack,
      boundary: 'RootErrorBoundary',
      domain_code: formattedError?.code,
      request_id: formattedError?.requestId,
      fingerprint: formattedError?.fingerprint,
      problem_type: formattedError?.problem.type,
      retryable: formattedError?.retryable,
      owner_action_required: formattedError?.ownerActionRequired,
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, formattedError: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { formattedError } = this.state;

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
                {formattedError?.userMessage ?? i18n.t('errors.unexpectedError')}
              </p>
              {formattedError && (
                <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md space-y-1 font-mono">
                  <p>{i18n.t('errors.standard.domainCode')}: {formattedError.code}</p>
                  <p>{i18n.t('errors.standard.requestId')}: {formattedError.requestId}</p>
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
