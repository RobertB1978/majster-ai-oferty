// ============================================
// SHARED SENTRY UTILITIES FOR EDGE FUNCTIONS
// Error tracking and performance monitoring
// ============================================

/**
 * Sentry DSN można ustawić jako Supabase Secret:
 * supabase secrets set SENTRY_DSN=your-dsn-here
 * supabase secrets set SENTRY_ENVIRONMENT=production
 */

interface SentryEvent {
  message?: string;
  exception?: {
    values: Array<{
      type: string;
      value: string;
      stacktrace?: {
        frames: Array<{
          filename: string;
          function: string;
          lineno?: number;
          colno?: number;
        }>;
      };
    }>;
  };
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal';
  timestamp: number;
  platform: string;
  environment: string;
  server_name?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  request?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
  };
}

interface SentryConfig {
  dsn: string;
  environment: string;
}

/**
 * Wyślij event do Sentry
 */
async function sendToSentry(event: SentryEvent, config: SentryConfig): Promise<void> {
  try {
    // Parse DSN to extract project info
    const dsnUrl = new URL(config.dsn);
    const projectId = dsnUrl.pathname.substring(1);
    const publicKey = dsnUrl.username;

    // Sentry envelope format
    const envelope = JSON.stringify({
      event_id: crypto.randomUUID(),
      timestamp: event.timestamp,
    }) + '\n' + JSON.stringify({
      type: 'event',
    }) + '\n' + JSON.stringify(event);

    // Send to Sentry
    const sentryUrl = `https://${dsnUrl.host}/api/${projectId}/envelope/`;

    await fetch(sentryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${publicKey}, sentry_client=majster-edge-functions/1.0.0`,
      },
      body: envelope,
    });
  } catch (error) {
    // Don't crash the function if Sentry fails
    console.error('Failed to send event to Sentry:', error);
  }
}

/**
 * Loguj błąd do Sentry
 */
export async function logErrorToSentry(
  error: Error,
  context?: {
    functionName?: string;
    userId?: string;
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    request?: Request;
  }
): Promise<void> {
  const dsn = Deno.env.get('SENTRY_DSN');
  const environment = Deno.env.get('SENTRY_ENVIRONMENT') || 'production';

  if (!dsn) {
    console.error('Error (Sentry not configured):', error.message, context);
    return;
  }

  const event: SentryEvent = {
    exception: {
      values: [{
        type: error.name,
        value: error.message,
        stacktrace: error.stack ? {
          frames: parseStackTrace(error.stack),
        } : undefined,
      }],
    },
    level: 'error',
    timestamp: Date.now() / 1000,
    platform: 'node',
    environment,
    server_name: context?.functionName || 'edge-function',
    tags: {
      function: context?.functionName || 'unknown',
      ...context?.tags,
    },
    extra: context?.extra,
  };

  // Add request context if available
  if (context?.request) {
    event.request = {
      url: context.request.url,
      method: context.request.method,
      headers: filterSensitiveHeaders(context.request.headers),
    };
  }

  await sendToSentry(event, { dsn, environment });
}

/**
 * Loguj message do Sentry
 */
export async function logMessageToSentry(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info',
  context?: {
    functionName?: string;
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
): Promise<void> {
  const dsn = Deno.env.get('SENTRY_DSN');
  const environment = Deno.env.get('SENTRY_ENVIRONMENT') || 'production';

  if (!dsn) {
    console.log(`[${level}] ${message}`, context);
    return;
  }

  const event: SentryEvent = {
    message,
    level,
    timestamp: Date.now() / 1000,
    platform: 'node',
    environment,
    server_name: context?.functionName || 'edge-function',
    tags: {
      function: context?.functionName || 'unknown',
      ...context?.tags,
    },
    extra: context?.extra,
  };

  await sendToSentry(event, { dsn, environment });
}

/**
 * Parse stack trace to Sentry format
 */
function parseStackTrace(stack: string): Array<{
  filename: string;
  function: string;
  lineno?: number;
  colno?: number;
}> {
  const frames: Array<{
    filename: string;
    function: string;
    lineno?: number;
    colno?: number;
  }> = [];

  const lines = stack.split('\n').slice(1); // Skip first line (error message)

  for (const line of lines) {
    const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
    if (match) {
      frames.push({
        function: match[1].trim(),
        filename: match[2],
        lineno: parseInt(match[3]),
        colno: parseInt(match[4]),
      });
    } else {
      const simpleMatch = line.match(/at\s+(.+?):(\d+):(\d+)/);
      if (simpleMatch) {
        frames.push({
          function: '<anonymous>',
          filename: simpleMatch[1],
          lineno: parseInt(simpleMatch[2]),
          colno: parseInt(simpleMatch[3]),
        });
      }
    }
  }

  return frames.reverse(); // Sentry expects frames in reverse order
}

/**
 * Filtruj wrażliwe headery
 */
function filterSensitiveHeaders(headers: Headers): Record<string, string> {
  const filtered: Record<string, string> = {};
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'apikey'];

  headers.forEach((value, key) => {
    if (!sensitiveHeaders.includes(key.toLowerCase())) {
      filtered[key] = value;
    }
  });

  return filtered;
}

/**
 * Wrapper dla Edge Function z automatycznym error tracking
 */
export function withSentryErrorTracking<_T>(
  functionName: string,
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (error) {
      // Log do Sentry
      await logErrorToSentry(
        error instanceof Error ? error : new Error(String(error)),
        {
          functionName,
          request: req,
        }
      );

      // Re-throw error
      throw error;
    }
  };
}
