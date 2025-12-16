/**
 * GDPR-compliant User Account Deletion
 * Security Pack Δ1 - Enhanced Validation
 *
 * Edge Function do całkowitego usunięcia konta użytkownika i wszystkich powiązanych danych
 * zgodnie z Art. 17 RODO (Right to Erasure).
 *
 * Usuwa:
 * - Wszystkie projekty użytkownika
 * - Wszystkich klientów
 * - Wszystkie wyceny i pozycje wycen
 * - Wydarzenia kalendarza
 * - Szablony pozycji
 * - Powiadomienia
 * - Profil użytkownika
 * - Konto auth
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  validateString,
  createValidationErrorResponse,
  combineValidations
} from '../_shared/validation.ts';
import { checkRateLimit, createRateLimitResponse, getIdentifier } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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
    // Create Supabase client with service_role key (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get user from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.warn('Delete account: Invalid auth token');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const userId = user.id;

    // Rate limiting (strict for delete operations)
    const rateLimitResult = await checkRateLimit(
      getIdentifier(req, userId),
      'delete-user-account',
      supabaseAdmin,
      { maxRequests: 3, windowMs: 3600000 } // 3 requests per hour
    );

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    // Parse and validate request body
    let body: { confirmationPhrase?: unknown };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { confirmationPhrase } = body;

    // Validate confirmation phrase
    const validation = combineValidations(
      validateString(confirmationPhrase, 'confirmationPhrase', {
        minLength: 1,
        maxLength: 100
      })
    );

    if (!validation.valid) {
      return createValidationErrorResponse(validation.errors, corsHeaders);
    }

    // Check exact confirmation phrase (case-sensitive)
    const expectedPhrase = 'DELETE MY ACCOUNT';
    if (confirmationPhrase !== expectedPhrase) {
      return new Response(
        JSON.stringify({
          error: 'Invalid confirmation phrase',
          details: [`Confirmation phrase must be exactly: "${expectedPhrase}"`]
        }),
        {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Starting account deletion for user: ${userId}`);

    // ========================================
    // KROK 1: Usuń wszystkie powiązane dane
    // ========================================

    const deletionResults: Record<string, { success: boolean; count?: number; error?: string }> = {};

    // Quotes items (cascade delete przez FK, ale dla pewności)
    try {
      const { data, error } = await supabaseAdmin
        .from('quote_items')
        .delete()
        .eq('user_id', userId)
        .select('id');

      deletionResults.quoteItems = {
        success: !error,
        count: data?.length || 0,
        error: error?.message
      };
      if (error) console.error('Error deleting quote items:', error);
    } catch (error) {
      deletionResults.quoteItems = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Quotes
    try {
      const { data, error } = await supabaseAdmin
        .from('quotes')
        .delete()
        .eq('user_id', userId)
        .select('id');

      deletionResults.quotes = {
        success: !error,
        count: data?.length || 0,
        error: error?.message
      };
      if (error) console.error('Error deleting quotes:', error);
    } catch (error) {
      deletionResults.quotes = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Projects
    try {
      const { data, error } = await supabaseAdmin
        .from('projects')
        .delete()
        .eq('user_id', userId)
        .select('id');

      deletionResults.projects = {
        success: !error,
        count: data?.length || 0,
        error: error?.message
      };
      if (error) console.error('Error deleting projects:', error);
    } catch (error) {
      deletionResults.projects = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Clients
    try {
      const { data, error } = await supabaseAdmin
        .from('clients')
        .delete()
        .eq('user_id', userId)
        .select('id');

      deletionResults.clients = {
        success: !error,
        count: data?.length || 0,
        error: error?.message
      };
      if (error) console.error('Error deleting clients:', error);
    } catch (error) {
      deletionResults.clients = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Calendar events
    try {
      const { data, error } = await supabaseAdmin
        .from('calendar_events')
        .delete()
        .eq('user_id', userId)
        .select('id');

      deletionResults.calendarEvents = {
        success: !error,
        count: data?.length || 0,
        error: error?.message
      };
      if (error) console.error('Error deleting calendar events:', error);
    } catch (error) {
      deletionResults.calendarEvents = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Item templates
    try {
      const { data, error } = await supabaseAdmin
        .from('item_templates')
        .delete()
        .eq('user_id', userId)
        .select('id');

      deletionResults.itemTemplates = {
        success: !error,
        count: data?.length || 0,
        error: error?.message
      };
      if (error) console.error('Error deleting item templates:', error);
    } catch (error) {
      deletionResults.itemTemplates = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Notifications
    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .select('id');

      deletionResults.notifications = {
        success: !error,
        count: data?.length || 0,
        error: error?.message
      };
      if (error) console.error('Error deleting notifications:', error);
    } catch (error) {
      deletionResults.notifications = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Offer approvals
    try {
      const { data, error } = await supabaseAdmin
        .from('offer_approvals')
        .delete()
        .eq('user_id', userId)
        .select('id');

      deletionResults.offerApprovals = {
        success: !error,
        count: data?.length || 0,
        error: error?.message
      };
      if (error) console.error('Error deleting offer approvals:', error);
    } catch (error) {
      deletionResults.offerApprovals = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // User profile
    try {
      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .delete()
        .eq('user_id', userId)
        .select('id');

      deletionResults.userProfiles = {
        success: !error,
        count: data?.length || 0,
        error: error?.message
      };
      if (error) console.error('Error deleting user profile:', error);
    } catch (error) {
      deletionResults.userProfiles = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Subscription
    try {
      const { data, error } = await supabaseAdmin
        .from('user_subscriptions')
        .delete()
        .eq('user_id', userId)
        .select('id');

      deletionResults.userSubscriptions = {
        success: !error,
        count: data?.length || 0,
        error: error?.message
      };
      if (error) console.error('Error deleting subscription:', error);
    } catch (error) {
      deletionResults.userSubscriptions = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // ========================================
    // KROK 2: Usuń konto auth
    // ========================================

    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError);
      // Don't throw - log the partial success
      deletionResults.authAccount = {
        success: false,
        error: deleteAuthError.message
      };
    } else {
      deletionResults.authAccount = { success: true };
    }

    console.log(`Account deletion completed for user: ${userId}`);

    // ========================================
    // KROK 3: Audit log (without sensitive data)
    // ========================================

    const totalDeleted = Object.values(deletionResults)
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.count || 0), 0);

    const hasErrors = Object.values(deletionResults).some(r => !r.success);

    console.log({
      event: 'account_deleted',
      userId: userId.substring(0, 8) + '***', // Obfuscate in logs
      timestamp: new Date().toISOString(),
      gdpr_article: 'Art. 17 RODO',
      totalRecordsDeleted: totalDeleted,
      hadErrors: hasErrors,
      deletionSummary: Object.entries(deletionResults).map(([table, result]) => ({
        table,
        success: result.success,
        count: result.count
      }))
    });

    return new Response(
      JSON.stringify({
        success: !hasErrors,
        message: 'Konto i wszystkie dane zostały trwale usunięte',
        details: {
          totalRecordsDeleted: totalDeleted,
          deletionResults: hasErrors ? deletionResults : undefined
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error('Error in delete-user-account function:', error);

    // Don't leak internal error details to client
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Nie udało się usunąć konta. Skontaktuj się z pomocą techniczną.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
