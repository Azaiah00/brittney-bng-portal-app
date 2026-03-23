// Edge Function: esign-webhook
// POST — Receives webhook events from SignNow when a document is signed/declined.
// SignNow sends JSON with event_type and meta.document_id.
// Updates the proposal row in Supabase accordingly.

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
    const body = await req.json();

    // SignNow webhook payload shape varies by event.
    // Common fields: event_type, meta.document_id
    const eventType = body.event || body.event_type;
    const documentId = body.meta?.document_id || body.document_id;

    if (!documentId) {
      return new Response(
        JSON.stringify({ error: 'No document_id in webhook payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the proposal by signnow_document_id
    const { data: proposal, error: fetchErr } = await supabaseAdmin
      .from('proposals')
      .select('id, signature_status')
      .eq('signnow_document_id', documentId)
      .single();

    if (fetchErr || !proposal) {
      console.warn('Webhook: no matching proposal for document', documentId);
      return new Response(
        JSON.stringify({ ok: true, message: 'No matching proposal found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map SignNow events to our status
    const updates: Record<string, any> = {};

    if (eventType === 'document.complete' || eventType === 'document_complete') {
      updates.signature_status = 'signed';
      updates.signed_at = new Date().toISOString();
      updates.status = 'accepted';
    } else if (eventType === 'document.decline' || eventType === 'document_decline') {
      updates.signature_status = 'declined';
      updates.status = 'declined';
    } else if (eventType === 'document.viewed' || eventType === 'document_viewed') {
      // Only update if not already signed
      if (proposal.signature_status !== 'signed') {
        updates.signature_status = 'viewed';
      }
    }

    if (Object.keys(updates).length > 0) {
      await supabaseAdmin
        .from('proposals')
        .update(updates)
        .eq('id', proposal.id);
    }

    return new Response(
      JSON.stringify({ ok: true, processed: eventType }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('esign-webhook error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
