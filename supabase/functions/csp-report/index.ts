// ============================================
// CSP REPORT ENDPOINT - Security Enhanced
// Security Pack Δ1 - Enhanced Validation
// Zbieranie raportów naruszeń Content Security Policy
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logMessageToSentry } from "../_shared/sentry.ts";
import {
  validateString,
  validateNumber,
  // validatePayloadSize,
  combineValidations
} from "../_shared/validation.ts";
import { checkRateLimit, createRateLimitResponse, getIdentifier } from "../_shared/rate-limiter.ts";
import { sanitizeString } from "../_shared/validation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
};

interface CSPReport {
  'csp-report': {
    'document-uri': string;
    referrer?: string;
    'violated-directive': string;
    'effective-directive': string;
    'original-policy': string;
    disposition: string;
    'blocked-uri': string;
    'line-number'?: number;
    'column-number'?: number;
    'source-file'?: string;
    'status-code'?: number;
    'script-sample'?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

  try {
    // Rate limiting (prevent spam attacks)
    if (supabase) {
      const rateLimitResult = await checkRateLimit(
        getIdentifier(req),
        'csp-report',
        supabase,
        { maxRequests: 100, windowMs: 60000 } // 100 reports per minute per IP
      );

      if (!rateLimitResult.allowed) {
        console.warn('CSP report rate limit exceeded');
        return createRateLimitResponse(rateLimitResult, corsHeaders);
      }
    }

    // Parse request body with size limit
    let rawBody: string;
    try {
      rawBody = await req.text();
    } catch {
      console.warn('CSP report: Failed to read body');
      return new Response(
        JSON.stringify({ error: 'Failed to read request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check payload size (10KB limit for CSP reports)
    if (rawBody.length > 10240) {
      console.warn(`CSP report: Payload too large (${rawBody.length} bytes)`);
      return new Response(
        JSON.stringify({ error: 'Payload too large' }),
        {
          status: 413,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse JSON
    let report: CSPReport;
    try {
      report = JSON.parse(rawBody);
    } catch {
      console.warn('CSP report: Invalid JSON');
      return new Response(
        JSON.stringify({ error: 'Invalid JSON format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate CSP report structure
    if (!report['csp-report']) {
      console.warn('CSP report: Missing csp-report field');
      return new Response(
        JSON.stringify({ error: 'Invalid CSP report format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const cspReport = report['csp-report'];

    // Validate required fields
    const validation = combineValidations(
      validateString(cspReport['document-uri'], 'document-uri', { maxLength: 2048 }),
      validateString(cspReport['violated-directive'], 'violated-directive', { maxLength: 500 }),
      validateString(cspReport['effective-directive'], 'effective-directive', { maxLength: 500 }),
      validateString(cspReport['blocked-uri'], 'blocked-uri', { maxLength: 2048 }),
      validateString(cspReport.disposition, 'disposition', { maxLength: 50 })
    );

    if (!validation.valid) {
      console.warn('CSP report: Validation failed', validation.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid CSP report fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate optional numeric fields
    if (cspReport['line-number'] !== undefined) {
      const lineValidation = validateNumber(cspReport['line-number'], 'line-number', {
        required: false,
        min: 0,
        max: 999999
      });
      if (!lineValidation.valid) {
        console.warn('CSP report: Invalid line-number');
      }
    }

    if (cspReport['column-number'] !== undefined) {
      const colValidation = validateNumber(cspReport['column-number'], 'column-number', {
        required: false,
        min: 0,
        max: 999999
      });
      if (!colValidation.valid) {
        console.warn('CSP report: Invalid column-number');
      }
    }

    // Sanitize and truncate string fields before logging
    const sanitizedReport = {
      directive: sanitizeString(cspReport['violated-directive']).substring(0, 200),
      blockedUri: sanitizeString(cspReport['blocked-uri']).substring(0, 500),
      documentUri: sanitizeString(cspReport['document-uri']).substring(0, 500),
      sourceFile: cspReport['source-file']
        ? sanitizeString(cspReport['source-file']).substring(0, 500)
        : undefined,
      lineNumber: cspReport['line-number'],
    };

    console.log('🚨 CSP Violation Report:', sanitizedReport);

    // Log do Sentry jeśli jest skonfigurowane (with sanitized data)
    await logMessageToSentry(
      `CSP Violation: ${sanitizedReport.directive} - ${sanitizedReport.blockedUri}`,
      'warning',
      {
        functionName: 'csp-report',
        tags: {
          violation: sanitizedReport.directive.substring(0, 50),
          disposition: cspReport.disposition,
        },
        extra: {
          documentUri: sanitizedReport.documentUri,
          blockedUri: sanitizedReport.blockedUri,
          sourceFile: sanitizedReport.sourceFile,
          lineNumber: sanitizedReport.lineNumber,
          columnNumber: cspReport['column-number'],
        },
      }
    );

    // Zwróć 204 No Content (standard dla CSP reporting)
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error processing CSP report:', error);

    // Nie loguj do Sentry - to może być spam lub atak
    // Zwróć 400 Bad Request bez szczegółów
    return new Response(
      JSON.stringify({ error: 'Invalid report format' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
