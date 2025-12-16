/**
 * GDPR-compliant User Account Deletion
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const userId = user.id;

    console.log(`Starting account deletion for user: ${userId}`);

    // ========================================
    // KROK 1: Usuń wszystkie powiązane dane
    // ========================================

    // Quotes items (cascade delete przez FK, ale dla pewności)
    const { error: quoteItemsError } = await supabaseAdmin
      .from('quote_items')
      .delete()
      .eq('user_id', userId);

    if (quoteItemsError) {
      console.error('Error deleting quote items:', quoteItemsError);
    }

    // Quotes
    const { error: quotesError } = await supabaseAdmin
      .from('quotes')
      .delete()
      .eq('user_id', userId);

    if (quotesError) {
      console.error('Error deleting quotes:', quotesError);
    }

    // Projects
    const { error: projectsError } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('user_id', userId);

    if (projectsError) {
      console.error('Error deleting projects:', projectsError);
    }

    // Clients
    const { error: clientsError } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('user_id', userId);

    if (clientsError) {
      console.error('Error deleting clients:', clientsError);
    }

    // Calendar events
    const { error: eventsError } = await supabaseAdmin
      .from('calendar_events')
      .delete()
      .eq('user_id', userId);

    if (eventsError) {
      console.error('Error deleting calendar events:', eventsError);
    }

    // Item templates
    const { error: templatesError } = await supabaseAdmin
      .from('item_templates')
      .delete()
      .eq('user_id', userId);

    if (templatesError) {
      console.error('Error deleting item templates:', templatesError);
    }

    // Notifications
    const { error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (notificationsError) {
      console.error('Error deleting notifications:', notificationsError);
    }

    // Offer approvals
    const { error: offersError } = await supabaseAdmin
      .from('offer_approvals')
      .delete()
      .eq('user_id', userId);

    if (offersError) {
      console.error('Error deleting offer approvals:', offersError);
    }

    // User profile
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('user_id', userId);

    if (profileError) {
      console.error('Error deleting user profile:', profileError);
    }

    // Subscription
    const { error: subscriptionError } = await supabaseAdmin
      .from('user_subscriptions')
      .delete()
      .eq('user_id', userId);

    if (subscriptionError) {
      console.error('Error deleting subscription:', subscriptionError);
    }

    // ========================================
    // KROK 2: Usuń konto auth
    // ========================================

    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError);
      throw deleteAuthError;
    }

    console.log(`Account deletion completed successfully for user: ${userId}`);

    // ========================================
    // KROK 3: Log deletion for audit trail
    // ========================================

    console.log({
      event: 'account_deleted',
      userId,
      timestamp: new Date().toISOString(),
      gdpr_article: 'Art. 17 RODO',
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Konto i wszystkie dane zostały trwale usunięte',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error('Error in delete-user-account function:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error.message || 'Nie udało się usunąć konta',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
