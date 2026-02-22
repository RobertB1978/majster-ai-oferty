/* eslint-disable i18next/no-literal-string -- DEV-ONLY: auth diagnostic panel, never rendered in production (MODE !== 'development' guard) */
import { toast } from 'sonner';
/**
 * Auth Diagnostics Panel - DEV ONLY
 *
 * Shows real-time auth state for debugging login issues.
 * Only renders in development mode.
 */

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { logger } from '@/lib/logger';

function AuthDiagnosticsContent() {
  const { user, session, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const diagnostics = {
    environment: {
      mode: import.meta.env.MODE,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      anonKeyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0,
    },
    auth: {
      isLoading,
      hasUser: !!user,
      hasSession: !!session,
      userId: user?.id || null,
      userEmail: user?.email || null,
      sessionExpiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
    },
    client: {
      initialized: !!supabase,
      storage: localStorage.getItem('sb-' + import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token') ? 'Has token' : 'No token',
    }
  };

  const handleCopy = () => {
    const text = JSON.stringify(diagnostics, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const testConnection = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      logger.log('🔍 Connection Test Result:', { data, error });
      toast(error ? `Connection error: ${error.message}` : 'Connection successful!');
    } catch (err) {
      logger.error('🔍 Connection Test Failed:', err);
      toast(`Connection failed: ${err}`);
    }
  };

  const getStatusIcon = (condition: boolean) => {
    return condition ? (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="shadow-lg border-2 border-primary/20">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full text-left bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <CardHeader className="hover:bg-accent/50 transition-colors pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-primary" />
                    <CardTitle className="text-sm">Auth Diagnostics</CardTitle>
                    <Badge variant="outline" className="text-xs">DEV</Badge>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
                <CardDescription className="text-xs mt-1">
                  {user ? '✅ Authenticated' : '⚠️ Not authenticated'}
                </CardDescription>
              </CardHeader>
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-3 text-xs pt-0">
              {/* Environment */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  Environment
                </h4>
                <div className="space-y-1 pl-4 border-l-2 border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Mode:</span>
                    <Badge variant="secondary">{diagnostics.environment.mode}</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Supabase URL:</span>
                    <span className="font-mono text-xs truncate max-w-[200px]" title={diagnostics.environment.supabaseUrl}>
                      {diagnostics.environment.supabaseUrl}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Anon Key:</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(diagnostics.environment.hasAnonKey)}
                      <span className="text-xs">
                        {diagnostics.environment.hasAnonKey ? `${diagnostics.environment.anonKeyLength} chars` : 'Missing'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Auth State */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Auth State</h4>
                <div className="space-y-1 pl-4 border-l-2 border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Loading:</span>
                    <Badge variant={isLoading ? "default" : "outline"}>
                      {isLoading ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">User:</span>
                    {getStatusIcon(diagnostics.auth.hasUser)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Session:</span>
                    {getStatusIcon(diagnostics.auth.hasSession)}
                  </div>
                  {diagnostics.auth.userEmail && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-mono">{diagnostics.auth.userEmail}</span>
                    </div>
                  )}
                  {diagnostics.auth.sessionExpiresAt && (
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground">Expires:</span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {new Date(diagnostics.auth.sessionExpiresAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Client */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Client</h4>
                <div className="space-y-1 pl-4 border-l-2 border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Initialized:</span>
                    {getStatusIcon(diagnostics.client.initialized)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">LocalStorage:</span>
                    <span className="text-xs">{diagnostics.client.storage}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={testConnection}
                  className="flex-1 text-xs h-8"
                >
                  Test Connection
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="text-xs h-8"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>

              <p className="text-[10px] text-muted-foreground italic text-center pt-1">
                This panel only appears in development mode
              </p>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}

export function AuthDiagnostics() {
  // Only render in development
  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  return <AuthDiagnosticsContent />;
}
