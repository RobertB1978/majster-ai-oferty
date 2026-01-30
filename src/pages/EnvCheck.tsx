/**
 * Environment Variables Diagnostic Page
 *
 * This page helps diagnose white screen issues by showing
 * which environment variables are missing or misconfigured,
 * and testing Supabase connectivity.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Loader } from 'lucide-react';
import { checkSupabaseHealth } from '@/integrations/supabase/client';

interface SupabaseHealthStatus {
  isConnected: boolean;
  configurationValid: boolean;
  tablesAccessible: { [key: string]: boolean };
  errors: string[];
  loading: boolean;
}

export default function EnvCheck() {
  const [supabaseHealth, setSupabaseHealth] = useState<SupabaseHealthStatus>({
    isConnected: false,
    configurationValid: false,
    tablesAccessible: {},
    errors: [],
    loading: true,
  });

  useEffect(() => {
    checkSupabaseHealth().then(health => {
      setSupabaseHealth({ ...health, loading: false });
    }).catch(err => {
      setSupabaseHealth({
        isConnected: false,
        configurationValid: false,
        tablesAccessible: {},
        errors: [err instanceof Error ? err.message : 'Unknown error checking Supabase'],
        loading: false,
      });
    });
  }, []);
  const checks = [
    {
      name: 'VITE_SUPABASE_URL',
      value: import.meta.env.VITE_SUPABASE_URL,
      required: true,
      expected: 'https://[project-id].supabase.co'
    },
    {
      name: 'VITE_SUPABASE_ANON_KEY',
      value: import.meta.env.VITE_SUPABASE_ANON_KEY,
      required: true,
      expected: 'eyJhbGci... (JWT token)'
    },
    {
      name: 'MODE',
      value: import.meta.env.MODE,
      required: true,
      expected: 'production or development'
    },
    {
      name: 'DEV',
      value: String(import.meta.env.DEV),
      required: false,
      expected: 'true or false'
    },
    {
      name: 'PROD',
      value: String(import.meta.env.PROD),
      required: false,
      expected: 'true or false'
    }
  ];

  const missingRequired = checks.filter(c => c.required && !c.value);
  const hasAllRequired = missingRequired.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-2xl">
          <CardHeader>
            <div className="flex items-center gap-4">
              {hasAllRequired ? (
                <CheckCircle className="h-12 w-12 text-green-500" />
              ) : (
                <XCircle className="h-12 w-12 text-red-500" />
              )}
              <div>
                <CardTitle className="text-3xl">
                  Environment Variables Check
                </CardTitle>
                <CardDescription className="text-lg mt-2">
                  {hasAllRequired
                    ? '✅ All required variables are configured!'
                    : '❌ Missing required environment variables'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Status Summary */}
            <div className="p-4 rounded-lg bg-muted">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Status:</span>
                {hasAllRequired ? (
                  <Badge className="bg-green-500">All Required Variables Set</Badge>
                ) : (
                  <Badge variant="destructive">
                    {missingRequired.length} Missing Variables
                  </Badge>
                )}
              </div>
            </div>

            {/* Missing Variables Alert */}
            {!hasAllRequired && (
              <div className="p-4 border-2 border-red-500 rounded-lg bg-red-50 dark:bg-red-950">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-red-500 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold text-red-700 dark:text-red-400 mb-2">
                      WHITE SCREEN FIX REQUIRED
                    </h3>
                    <p className="text-sm text-red-600 dark:text-red-300 mb-3">
                      Your application shows a white screen because these environment variables are missing:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-600 dark:text-red-300">
                      {missingRequired.map(check => (
                        <li key={check.name}>
                          <code className="bg-red-100 dark:bg-red-900 px-2 py-1 rounded">
                            {check.name}
                          </code>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Variables List */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg">Environment Variables:</h3>
              {checks.map((check) => {
                const isSet = Boolean(check.value);
                const isMissing = check.required && !isSet;

                return (
                  <div
                    key={check.name}
                    className={`p-4 rounded-lg border-2 ${
                      isMissing
                        ? 'border-red-500 bg-red-50 dark:bg-red-950'
                        : isSet
                        ? 'border-green-500 bg-green-50 dark:bg-green-950'
                        : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {isMissing ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : isSet ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          )}
                          <code className="font-mono font-bold">{check.name}</code>
                          {check.required && (
                            <Badge variant="outline" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Expected: {check.expected}
                        </p>
                        {isSet ? (
                          <div className="font-mono text-xs bg-white dark:bg-gray-800 p-2 rounded border overflow-x-auto">
                            {check.value.length > 100
                              ? `${check.value.substring(0, 100)}... (${check.value.length} chars)`
                              : check.value}
                          </div>
                        ) : (
                          <div className="font-mono text-xs text-red-600 dark:text-red-400">
                            ❌ NOT SET
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Supabase Health Check */}
            {hasAllRequired && (
              <div className="space-y-3">
                <h3 className="font-bold text-lg">Supabase Health Check:</h3>
                <div className={`p-4 rounded-lg border-2 ${
                  supabaseHealth.loading
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
                    : supabaseHealth.isConnected
                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                    : 'border-red-500 bg-red-50 dark:bg-red-950'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {supabaseHealth.loading ? (
                          <Loader className="h-5 w-5 text-yellow-500 animate-spin" />
                        ) : supabaseHealth.isConnected ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className="font-bold">
                          {supabaseHealth.loading
                            ? 'Testing Supabase Connection...'
                            : supabaseHealth.isConnected
                            ? 'Supabase Connected'
                            : 'Supabase Connection Failed'}
                        </span>
                      </div>
                      {!supabaseHealth.loading && (
                        <div className="space-y-2 mt-3">
                          <div className="text-sm">
                            <strong>Configuration Valid:</strong> {supabaseHealth.configurationValid ? '✅' : '❌'}
                          </div>
                          {Object.keys(supabaseHealth.tablesAccessible).length > 0 && (
                            <div>
                              <strong className="text-sm">Table Access:</strong>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {Object.entries(supabaseHealth.tablesAccessible).map(([table, accessible]) => (
                                  <div key={table} className="text-sm flex items-center gap-2">
                                    {accessible ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-red-500" />
                                    )}
                                    <code className="text-xs">{table}</code>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {supabaseHealth.errors.length > 0 && (
                            <div>
                              <strong className="text-sm text-red-600 dark:text-red-400">Errors:</strong>
                              <ul className="list-disc list-inside space-y-1 text-xs text-red-600 dark:text-red-400 mt-1">
                                {supabaseHealth.errors.map((err, idx) => (
                                  <li key={idx}>{err}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Fix Instructions */}
            {!hasAllRequired && (
              <div className="p-6 rounded-lg bg-blue-50 dark:bg-blue-950 border-2 border-blue-500">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-blue-600" />
                  How to Fix in Vercel:
                </h3>
                <ol className="list-decimal list-inside space-y-3 text-sm">
                  <li>
                    Go to Vercel Dashboard → Your Project → <strong>Settings</strong>
                  </li>
                  <li>
                    Click <strong>Environment Variables</strong> in the left menu
                  </li>
                  <li>
                    Add these variables:
                    <div className="mt-2 space-y-2 ml-4">
                      <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                        <code className="text-xs">VITE_SUPABASE_URL</code>
                        <p className="text-xs text-muted-foreground mt-1">
                          Value: Your Supabase project URL (https://[id].supabase.co)
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                        <code className="text-xs">VITE_SUPABASE_ANON_KEY</code>
                        <p className="text-xs text-muted-foreground mt-1">
                          Value: Your Supabase anon/public key
                        </p>
                      </div>
                    </div>
                  </li>
                  <li>
                    Click <strong>Save</strong>
                  </li>
                  <li>
                    Go to <strong>Deployments</strong> and click <strong>Redeploy</strong>
                  </li>
                </ol>
              </div>
            )}

            {/* Success Message */}
            {hasAllRequired && (
              <div className="p-6 rounded-lg bg-green-50 dark:bg-green-950 border-2 border-green-500">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <h3 className="font-bold text-lg text-green-700 dark:text-green-400">
                      All Environment Variables Configured! 🎉
                    </h3>
                    <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                      Your application should work correctly now. You can navigate to the home page.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Debug Info */}
            <details className="p-4 rounded-lg bg-muted border">
              <summary className="cursor-pointer font-semibold">
                🔍 Debug Information
              </summary>
              <div className="mt-4 space-y-2 text-xs font-mono">
                <div>
                  <strong>Timestamp:</strong> {new Date().toISOString()}
                </div>
                <div>
                  <strong>User Agent:</strong> {navigator.userAgent}
                </div>
                <div>
                  <strong>Location:</strong> {window.location.href}
                </div>
              </div>
            </details>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
