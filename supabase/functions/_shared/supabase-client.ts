// Shared Supabase admin client for Edge Functions.
// Uses the service role key so it can bypass RLS.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
