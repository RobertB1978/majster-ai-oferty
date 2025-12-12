// ============================================
// CSP REPORT ENDPOINT
// Zbieranie raportów naruszeń Content Security Policy
// ============================================
// SERVICE ROLE KEY: Not used - This endpoint accepts public CSP reports
// SECURITY: Request size limited to 100KB to prevent DoS attacks
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { logMessageToSentry } from "../_shared/sentry.ts";
import { readAndValidateBody, validateString } from "../_shared/validation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
};

// CSP reports are typically small, limit to 100KB
const MAX_CSP_REPORT_SIZE = 100_000;

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

  try {
    // Validate request size and parse body
    const bodyResult = await readAndValidateBody<CSPReport>(req, corsHeaders, MAX_CSP_REPORT_SIZE);
    if (!bodyResult.success) {
      return bodyResult.response;
    }

    const report = bodyResult.data;
    const cspReport = report['csp-report'];

    // Validate required fields
    if (!cspReport || typeof cspReport !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid CSP report structure' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate critical fields
    const violatedDirectiveValidation = validateString(
      cspReport['violated-directive'],
      'violated-directive',
      { maxLength: 500 }
    );

    if (!violatedDirectiveValidation.valid) {
      return new Response(
        JSON.stringify({ error: 'Invalid CSP report data', details: violatedDirectiveValidation.errors }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('🚨 CSP Violation Report:', {
      directive: cspReport['violated-directive'],
      blockedUri: cspReport['blocked-uri'],
      documentUri: cspReport['document-uri'],
      sourceFile: cspReport['source-file'],
      lineNumber: cspReport['line-number'],
    });

    // Log do Sentry jeśli jest skonfigurowane
    await logMessageToSentry(
      `CSP Violation: ${cspReport['violated-directive']} - ${cspReport['blocked-uri']}`,
      'warning',
      {
        functionName: 'csp-report',
        tags: {
          violation: cspReport['effective-directive'],
          disposition: cspReport.disposition,
        },
        extra: {
          documentUri: cspReport['document-uri'],
          blockedUri: cspReport['blocked-uri'],
          sourceFile: cspReport['source-file'],
          lineNumber: cspReport['line-number'],
          columnNumber: cspReport['column-number'],
          violatedDirective: cspReport['violated-directive'],
          originalPolicy: cspReport['original-policy'],
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
    // Zwróć 400 Bad Request
    return new Response(
      JSON.stringify({ error: 'Invalid report format' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
