// ============================================
// CLEANUP EXPIRED DATA - CRON JOB
// Czyszczenie wygasłych tokenów i danych
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logMessageToSentry, logErrorToSentry } from "../_shared/sentry.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CleanupResult {
  success: boolean;
  timestamp: string;
  cleaned: {
    apiKeys: number;
    offerApprovals: number;
    pushTokens: number;
    chatHistory: number;
  };
  errors?: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const result: CleanupResult = {
    success: true,
    timestamp: new Date().toISOString(),
    cleaned: {
      apiKeys: 0,
      offerApprovals: 0,
      pushTokens: 0,
      chatHistory: 0,
    },
    errors: [],
  };

  try {
    // Weryfikacja autoryzacji - tylko dla cron jobów lub autoryzowanych requestów
    const authHeader = req.headers.get('authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');

    // Pozwól na wywołanie przez cron job (z secretem) lub przez service role
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Unauthorized cleanup attempt');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🧹 Starting cleanup job...');

    // 1. Cleanup unused API keys (starsze niż 90 dni bez użycia)
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data: unusedKeys, error: keysError } = await supabase
        .from('api_keys')
        .delete()
        .or(`last_used_at.is.null,last_used_at.lt.${ninetyDaysAgo.toISOString()}`)
        .lt('created_at', ninetyDaysAgo.toISOString())
        .eq('is_active', false)
        .select('id');

      if (keysError) {
        console.error('Error cleaning API keys:', keysError);
        result.errors?.push(`API keys: ${keysError.message}`);
      } else {
        result.cleaned.apiKeys = unusedKeys?.length || 0;
        console.log(`✓ Cleaned ${result.cleaned.apiKeys} unused API keys`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      result.errors?.push(`API keys exception: ${message}`);
      console.error('Exception cleaning API keys:', error);
    }

    // 2. Cleanup old offer approvals (starsze niż 90 dni i już zatwierdzone/odrzucone)
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data: oldOffers, error: offersError } = await supabase
        .from('offer_approvals')
        .delete()
        .lt('created_at', ninetyDaysAgo.toISOString())
        .in('status', ['approved', 'rejected'])
        .select('id');

      if (offersError) {
        console.error('Error cleaning offer approvals:', offersError);
        result.errors?.push(`Offer approvals: ${offersError.message}`);
      } else {
        result.cleaned.offerApprovals = oldOffers?.length || 0;
        console.log(`✓ Cleaned ${result.cleaned.offerApprovals} old offer approvals`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      result.errors?.push(`Offer approvals exception: ${message}`);
      console.error('Exception cleaning offer approvals:', error);
    }

    // 3. Cleanup inactive push tokens (starsze niż 180 dni)
    try {
      const oneEightyDaysAgo = new Date();
      oneEightyDaysAgo.setDate(oneEightyDaysAgo.getDate() - 180);

      const { data: oldTokens, error: tokensError } = await supabase
        .from('push_tokens')
        .delete()
        .lt('created_at', oneEightyDaysAgo.toISOString())
        .eq('is_active', false)
        .select('id');

      if (tokensError) {
        console.error('Error cleaning push tokens:', tokensError);
        result.errors?.push(`Push tokens: ${tokensError.message}`);
      } else {
        result.cleaned.pushTokens = oldTokens?.length || 0;
        console.log(`✓ Cleaned ${result.cleaned.pushTokens} inactive push tokens`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      result.errors?.push(`Push tokens exception: ${message}`);
      console.error('Exception cleaning push tokens:', error);
    }

    // 4. Cleanup old AI chat history (starsza niż 180 dni)
    try {
      const oneEightyDaysAgo = new Date();
      oneEightyDaysAgo.setDate(oneEightyDaysAgo.getDate() - 180);

      const { data: oldChats, error: chatsError } = await supabase
        .from('ai_chat_history')
        .delete()
        .lt('created_at', oneEightyDaysAgo.toISOString())
        .select('id');

      if (chatsError) {
        console.error('Error cleaning chat history:', chatsError);
        result.errors?.push(`Chat history: ${chatsError.message}`);
      } else {
        result.cleaned.chatHistory = oldChats?.length || 0;
        console.log(`✓ Cleaned ${result.cleaned.chatHistory} old chat messages`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      result.errors?.push(`Chat history exception: ${message}`);
      console.error('Exception cleaning chat history:', error);
    }

    // Podsumowanie
    const totalCleaned = Object.values(result.cleaned).reduce((sum, count) => sum + count, 0);
    console.log(`🧹 Cleanup completed: ${totalCleaned} total items cleaned`);

    // Log do Sentry jeśli były błędy
    if (result.errors && result.errors.length > 0) {
      result.success = false;
      await logMessageToSentry(
        `Cleanup job completed with errors: ${result.errors.join(', ')}`,
        'warning',
        {
          functionName: 'cleanup-expired-data',
          extra: { cleaned: result.cleaned, errors: result.errors },
        }
      );
    } else {
      // Log sukcesu do Sentry (tylko jeśli coś wyczyszczono)
      if (totalCleaned > 0) {
        await logMessageToSentry(
          `Cleanup job completed successfully: ${totalCleaned} items cleaned`,
          'info',
          {
            functionName: 'cleanup-expired-data',
            extra: { cleaned: result.cleaned },
          }
        );
      }
    }

    return new Response(
      JSON.stringify(result, null, 2),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Fatal error in cleanup job:', error);

    await logErrorToSentry(
      error instanceof Error ? error : new Error(String(error)),
      {
        functionName: 'cleanup-expired-data',
      }
    );

    return new Response(
      JSON.stringify({
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      }, null, 2),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
