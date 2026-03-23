// Edge Function: calendar-disconnect
// POST — Revoke Google Calendar tokens and remove from user_integrations.
// Input JSON: { user_id }

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabase-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the integration to get the token for revocation
    const { data: integration } = await supabaseAdmin
      .from('user_integrations')
      .select('access_token')
      .eq('user_id', user_id)
      .eq('provider', 'google_calendar')
      .single();

    // Revoke the token with Google (best effort)
    if (integration?.access_token) {
      await fetch(
        `https://oauth2.googleapis.com/revoke?token=${integration.access_token}`,
        { method: 'POST' }
      ).catch(() => { /* ok if revoke fails */ });
    }

    // Delete from user_integrations
    await supabaseAdmin
      .from('user_integrations')
      .delete()
      .eq('user_id', user_id)
      .eq('provider', 'google_calendar');

    return new Response(
      JSON.stringify({ success: true, disconnected: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('calendar-disconnect error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
