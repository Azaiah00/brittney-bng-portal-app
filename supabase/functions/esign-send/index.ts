// Edge Function: esign-send
// POST — Sends a proposal for e-signature via SignNow.
// Input JSON: { proposal_id, signer_email, signer_name, pdf_html }
// 1. Generates PDF from html (or uses stored pdf_url)
// 2. Uploads to SignNow
// 3. Adds signature fields
// 4. Creates embedded invite + signing link
// 5. Updates proposal row in Supabase

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabase-client.ts';
import {
  getAccessToken,
  uploadDocument,
  addSignatureFields,
  getSignerRoleId,
  createInvite,
  getSigningLink,
} from '../_shared/signnow.ts';

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
    const { proposal_id, signer_email, signer_name, pdf_html } = await req.json();

    if (!proposal_id || !signer_email || !signer_name) {
      return new Response(
        JSON.stringify({ error: 'proposal_id, signer_email, and signer_name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch proposal to verify it exists
    const { data: proposal, error: fetchErr } = await supabaseAdmin
      .from('proposals')
      .select('*')
      .eq('id', proposal_id)
      .single();

    if (fetchErr || !proposal) {
      return new Response(
        JSON.stringify({ error: 'Proposal not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get SignNow access token
    const token = await getAccessToken();

    // For now, we upload the PDF HTML as a simple PDF placeholder.
    // In production, use a PDF rendering service or pass pre-rendered PDF bytes.
    const pdfContent = new TextEncoder().encode(pdf_html || 'Proposal PDF placeholder');

    // Upload to SignNow
    const documentId = await uploadDocument(
      token,
      pdfContent,
      `BNG-Proposal-${proposal_id}.pdf`
    );

    // Add signature + date fields
    await addSignatureFields(token, documentId);

    // Get the signer role ID
    const roleId = await getSignerRoleId(token, documentId);

    // Create invite
    const inviteId = await createInvite(token, documentId, roleId, signer_email, signer_name);

    // Generate signing link
    const signingLink = await getSigningLink(token, documentId, inviteId);

    // Update proposal row in Supabase
    const now = new Date().toISOString();
    await supabaseAdmin
      .from('proposals')
      .update({
        signnow_document_id: documentId,
        signnow_invite_id: inviteId,
        signing_link: signingLink,
        signature_status: 'sent',
        signer_email: signer_email,
        sent_for_signature_at: now,
        status: 'sent',
      })
      .eq('id', proposal_id);

    return new Response(
      JSON.stringify({
        success: true,
        signing_link: signingLink,
        document_id: documentId,
        invite_id: inviteId,
        signature_status: 'sent',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('esign-send error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
