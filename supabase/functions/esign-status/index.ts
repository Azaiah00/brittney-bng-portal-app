// Edge Function: esign-status
// GET — Checks the e-signature status of a proposal via SignNow.
// Query param: ?proposal_id=<uuid>
// Returns current signature_status and updates Supabase row.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabase-client.ts';
import { getAccessToken, getDocumentStatus } from '../_shared/signnow.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Accept proposal_id from query string (GET) or JSON body (POST)
    const url = new URL(req.url);
    let proposalId = url.searchParams.get('proposal_id');
    if (!proposalId && req.method === 'POST') {
      const body = await req.json();
      proposalId = body.proposal_id;
    }

    if (!proposalId) {
      return new Response(
        JSON.stringify({ error: 'proposal_id query param is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch proposal
    const { data: proposal, error: fetchErr } = await supabaseAdmin
      .from('proposals')
      .select('signnow_document_id, signature_status')
      .eq('id', proposalId)
      .single();

    if (fetchErr || !proposal) {
      return new Response(
        JSON.stringify({ error: 'Proposal not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!proposal.signnow_document_id) {
      return new Response(
        JSON.stringify({ signature_status: proposal.signature_status || 'none' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check status with SignNow
    const token = await getAccessToken();
    const { status, signed } = await getDocumentStatus(token, proposal.signnow_document_id);

    // Update Supabase if status changed
    const updates: Record<string, any> = { signature_status: status };
    if (signed && proposal.signature_status !== 'signed') {
      updates.signed_at = new Date().toISOString();
      updates.status = 'accepted';
    }

    await supabaseAdmin
      .from('proposals')
      .update(updates)
      .eq('id', proposalId);

    return new Response(
      JSON.stringify({ signature_status: status, signed }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('esign-status error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
