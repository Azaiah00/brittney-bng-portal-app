// Edge Function: calendar-connect
// POST — Exchange Google OAuth authorization code for tokens.
// Stores access_token + refresh_token in user_integrations table.
// Input JSON: { user_id, code, redirect_uri }

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabase-client.ts';

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') || '';
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id, code, redirect_uri } = await req.json();

    if (!user_id || !code || !redirect_uri) {
      return new Response(
        JSON.stringify({ error: 'user_id, code, and redirect_uri are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Exchange auth code for tokens with Google
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      throw new Error(`Google token exchange failed: ${text}`);
    }

    const tokens = await tokenRes.json();
    const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();

    // Upsert into user_integrations
    const { error: upsertErr } = await supabaseAdmin
      .from('user_integrations')
      .upsert(
        {
          user_id,
          provider: 'google_calendar',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          token_expires_at: expiresAt,
          calendar_id: 'primary',
          connected_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,provider' }
      );

    if (upsertErr) throw upsertErr;

    return new Response(
      JSON.stringify({ success: true, connected: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('calendar-connect error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
