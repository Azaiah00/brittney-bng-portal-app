-- =============================================================================
-- BNG Remodel — SignNow e-sign + Google Calendar integration migration
-- Run in Supabase SQL Editor after the seed data has been applied.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Add SignNow e-signature columns to proposals table
-- -----------------------------------------------------------------------------

ALTER TABLE proposals ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS signnow_document_id TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS signnow_invite_id TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS signing_link TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS signature_status TEXT DEFAULT 'none';
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS signer_email TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS sent_for_signature_at TIMESTAMPTZ;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS signed_pdf_url TEXT;

-- -----------------------------------------------------------------------------
-- 2. User integrations table (Google Calendar tokens, future providers)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  calendar_id TEXT DEFAULT 'primary',
  connected_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage their own integrations
DROP POLICY IF EXISTS "user_integrations_own" ON user_integrations;
CREATE POLICY "user_integrations_own" ON user_integrations
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Also allow anon for testing (remove in production)
DROP POLICY IF EXISTS "bng_anon_user_integrations" ON user_integrations;
CREATE POLICY "bng_anon_user_integrations" ON user_integrations
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- =============================================================================
-- Done. Refresh the app after running this migration.
-- =============================================================================
