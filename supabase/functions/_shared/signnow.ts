// Shared SignNow API helper for Edge Functions.
// Uses OAuth2 client credentials to get an access token, then provides
// upload, field-placement, and invite helpers.

const SIGNNOW_BASE = Deno.env.get('SIGNNOW_BASE_URL') || 'https://api-eval.signnow.com';
const CLIENT_ID = Deno.env.get('SIGNNOW_CLIENT_ID') || '';
const CLIENT_SECRET = Deno.env.get('SIGNNOW_CLIENT_SECRET') || '';
const SIGNNOW_USER = Deno.env.get('SIGNNOW_USER_EMAIL') || '';
const SIGNNOW_PASS = Deno.env.get('SIGNNOW_USER_PASSWORD') || '';

// Basic auth header for token endpoint
const basicAuth = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);

// Get an OAuth access token using password grant
export async function getAccessToken(): Promise<string> {
  const res = await fetch(`${SIGNNOW_BASE}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username: SIGNNOW_USER,
      password: SIGNNOW_PASS,
      scope: '*',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SignNow auth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

// Upload a PDF file (as binary) to SignNow, returns document_id
export async function uploadDocument(
  token: string,
  pdfBytes: Uint8Array,
  fileName: string
): Promise<string> {
  const form = new FormData();
  form.append('file', new Blob([pdfBytes], { type: 'application/pdf' }), fileName);

  const res = await fetch(`${SIGNNOW_BASE}/document`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SignNow upload failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.id;
}

// Add signature + date fields to a document for a single signer role
export async function addSignatureFields(
  token: string,
  documentId: string
): Promise<void> {
  const res = await fetch(`${SIGNNOW_BASE}/document/${documentId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: [
        {
          page_number: 0,
          type: 'signature',
          name: 'client_signature',
          role: 'Signer 1',
          required: true,
          height: 40,
          width: 180,
          x: 260,
          y: 700,
        },
        {
          page_number: 0,
          type: 'text',
          name: 'signed_date',
          role: 'Signer 1',
          required: true,
          height: 20,
          width: 120,
          x: 450,
          y: 720,
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SignNow add fields failed (${res.status}): ${text}`);
  }
}

// Get the role_id for "Signer 1" from the document
export async function getSignerRoleId(
  token: string,
  documentId: string
): Promise<string> {
  const res = await fetch(`${SIGNNOW_BASE}/document/${documentId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!res.ok) throw new Error(`SignNow get doc failed (${res.status})`);

  const doc = await res.json();
  const role = doc.roles?.find((r: any) => r.name === 'Signer 1');
  if (!role) throw new Error('Signer 1 role not found on document');
  return role.unique_id;
}

// Create an embedded signing invite and return the invite_id
export async function createInvite(
  token: string,
  documentId: string,
  roleId: string,
  signerEmail: string,
  signerName: string
): Promise<string> {
  const [firstName, ...rest] = signerName.split(' ');
  const lastName = rest.join(' ') || signerName;

  const res = await fetch(
    `${SIGNNOW_BASE}/v2/documents/${documentId}/embedded-invites`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invites: [
          {
            email: signerEmail,
            role_id: roleId,
            order: 1,
            first_name: firstName,
            last_name: lastName,
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SignNow invite failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  // The response contains data.data[0].id for the invite
  return data.data?.[0]?.id || data.id;
}

// Generate a signing link for an existing invite
export async function getSigningLink(
  token: string,
  documentId: string,
  inviteId: string
): Promise<string> {
  const res = await fetch(
    `${SIGNNOW_BASE}/v2/documents/${documentId}/embedded-invites/${inviteId}/link`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_method: 'none',
        link_expiration: 45,
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SignNow link failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.data?.link || data.link;
}

// Get document status from SignNow
export async function getDocumentStatus(
  token: string,
  documentId: string
): Promise<{ status: string; signed: boolean }> {
  const res = await fetch(`${SIGNNOW_BASE}/document/${documentId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!res.ok) throw new Error(`SignNow status check failed (${res.status})`);

  const doc = await res.json();
  // Check if all required fields have been filled
  const allSigned = doc.field_invites?.every(
    (inv: any) => inv.status === 'fulfilled'
  ) ?? false;

  return {
    status: allSigned ? 'signed' : (doc.field_invites?.length > 0 ? 'sent' : 'none'),
    signed: allSigned,
  };
}
