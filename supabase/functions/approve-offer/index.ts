import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, action, signatureData, comment } = await req.json();
    
    if (!token) {
      return new Response(JSON.stringify({ error: "Token required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get offer approval by token
    const { data: approval, error: fetchError } = await supabase
      .from('offer_approvals')
      .select('*, projects(*)')
      .eq('public_token', token)
      .single();

    if (fetchError || !approval) {
      return new Response(JSON.stringify({ error: "Offer not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === 'GET') {
      // Return offer details for viewing
      const { data: quote } = await supabase
        .from('quotes')
        .select('*')
        .eq('project_id', approval.project_id)
        .single();

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', approval.user_id)
        .single();

      return new Response(JSON.stringify({ 
        approval,
        quote,
        company: profile
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === 'POST') {
      if (approval.status !== 'pending') {
        return new Response(JSON.stringify({ error: "Offer already processed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updateData: any = {
        status: action === 'approve' ? 'approved' : 'rejected',
        client_comment: comment || null,
      };

      if (action === 'approve') {
        updateData.signature_data = signatureData;
        updateData.approved_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('offer_approvals')
        .update(updateData)
        .eq('id', approval.id);

      if (updateError) throw updateError;

      // Update project status
      if (action === 'approve') {
        await supabase
          .from('projects')
          .update({ status: 'Zaakceptowany' })
          .eq('id', approval.project_id);
      }

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: approval.user_id,
          title: action === 'approve' ? 'Oferta zaakceptowana!' : 'Oferta odrzucona',
          message: `Klient ${action === 'approve' ? 'zaakceptował' : 'odrzucił'} ofertę dla projektu.`,
          type: action === 'approve' ? 'success' : 'warning',
          action_url: `/projects/${approval.project_id}`
        });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Approve offer error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
