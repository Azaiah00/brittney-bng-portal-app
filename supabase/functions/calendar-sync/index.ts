// Edge Function: calendar-sync
// POST — Push BNG events from Supabase to Google Calendar.
// Input JSON: { user_id }
// Reads events from Supabase, creates/updates them in Google Calendar.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabase-client.ts';

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') || '';
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Refresh Google access token if expired
async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  return await res.json();
}

// Get a valid access token, refreshing if needed
async function getValidToken(integration: any): Promise<string> {
  const expiresAt = new Date(integration.token_expires_at);
  const now = new Date();

  // Refresh if expired or expiring within 5 minutes
  if (expiresAt.getTime() - now.getTime() < 300_000 && integration.refresh_token) {
    const refreshed = await refreshAccessToken(integration.refresh_token);
    const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

    await supabaseAdmin
      .from('user_integrations')
      .update({
        access_token: refreshed.access_token,
        token_expires_at: newExpiry,
      })
      .eq('id', integration.id);

    return refreshed.access_token;
  }

  return integration.access_token;
}

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

    // Get user's Google Calendar integration
    const { data: integration, error: intErr } = await supabaseAdmin
      .from('user_integrations')
      .select('*')
      .eq('user_id', user_id)
      .eq('provider', 'google_calendar')
      .single();

    if (intErr || !integration) {
      return new Response(
        JSON.stringify({ error: 'Google Calendar not connected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = await getValidToken(integration);
    const calendarId = integration.calendar_id || 'primary';

    // Fetch upcoming events from Supabase (next 30 days)
    const today = new Date().toISOString().split('T')[0];
    const thirtyDays = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const { data: events, error: evtErr } = await supabaseAdmin
      .from('events')
      .select('*')
      .gte('event_date', today)
      .lte('event_date', thirtyDays)
      .order('event_date', { ascending: true });

    if (evtErr) throw evtErr;

    let synced = 0;

    for (const evt of (events || [])) {
      // Build Google Calendar event object
      const startDateTime = evt.start_time
        ? `${evt.event_date}T${evt.start_time}:00`
        : `${evt.event_date}T09:00:00`;
      const endDateTime = evt.end_time
        ? `${evt.event_date}T${evt.end_time}:00`
        : `${evt.event_date}T10:00:00`;

      const gcalEvent = {
        summary: evt.title,
        description: [
          evt.description || '',
          evt.client_name ? `Client: ${evt.client_name}` : '',
          `Type: ${evt.event_type}`,
        ].filter(Boolean).join('\n'),
        start: {
          dateTime: startDateTime,
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'America/New_York',
        },
      };

      // Insert event into Google Calendar
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(gcalEvent),
        }
      );

      if (res.ok) {
        synced++;
      } else {
        console.warn(`Failed to sync event ${evt.id}:`, await res.text());
      }
    }

    return new Response(
      JSON.stringify({ success: true, synced }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('calendar-sync error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
