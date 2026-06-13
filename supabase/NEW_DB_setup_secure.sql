-- =============================================================================
-- BNG Remodel Portal — NEW Supabase project: full secure setup (run once)
-- Paste the ENTIRE file into:  Supabase Dashboard -> SQL Editor -> Run
--
-- This builds the whole schema clean on a brand-new project, with
-- AUTHENTICATED-ONLY row-level security (NO anonymous/"bng_anon" policies).
-- That closes the critical hole from the old database, where the anon key
-- (shipped in every app build) could read/write everything incl. OAuth tokens.
--
-- The app logs users in via Supabase Auth, so requests carry an authenticated
-- JWT and these policies apply correctly. Empty DB to start (no seed records
-- except the lead_source picklist).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================ TABLES =========================================

-- Lead source picklist -------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leads ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  project_type TEXT,
  status TEXT DEFAULT 'new' CHECK (status IS NULL OR status IN ('new','contacted','quoted','converted')),
  lead_source_id UUID REFERENCES lead_sources(id) ON DELETE SET NULL,
  company_name TEXT, first_name TEXT, last_name TEXT, alternate_email TEXT,
  address_line_1 TEXT, address_line_2 TEXT, city TEXT, state TEXT, zip_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Customers ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT, email TEXT, address TEXT, project_type TEXT, notes TEXT,
  lead_source_id UUID REFERENCES lead_sources(id) ON DELETE SET NULL,
  converted_from_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed')),
  company_name TEXT, first_name TEXT, last_name TEXT, alternate_email TEXT,
  address_line_1 TEXT, address_line_2 TEXT, city TEXT, state TEXT, zip_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Projects -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  start_date DATE,
  walkthrough_date TIMESTAMPTZ,
  calendar_event_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IS NULL OR status IN ('active','completed','pending')),
  budget NUMERIC(12,2),
  phase TEXT,
  progress INTEGER DEFAULT 0,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Logs (visual timeline) -----------------------------------------------------
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  note TEXT,
  image_urls TEXT[],
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Estimates ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS estimates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC(10,2) DEFAULT 0.00,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Subcontractors -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subcontractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  trade TEXT NOT NULL DEFAULT 'general',
  phone TEXT, email TEXT, notes TEXT, company_name TEXT,
  rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Checklists -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Punch items ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS punch_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Proposals (incl. SignNow e-sign fields) ------------------------------------
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  client_name TEXT, client_address TEXT, scope_of_work TEXT,
  line_items JSONB, subtotal NUMERIC, tax NUMERIC, total_amount NUMERIC,
  payment_schedule JSONB, start_date TEXT, completion_date TEXT, special_conditions TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','declined')),
  pdf_url TEXT,
  signnow_document_id TEXT, signnow_invite_id TEXT, signing_link TEXT,
  signature_status TEXT DEFAULT 'none', signer_email TEXT,
  sent_for_signature_at TIMESTAMPTZ, signed_at TIMESTAMPTZ, signed_pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User integrations (Google Calendar tokens) — sensitive ---------------------
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

-- Calendar events ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TEXT, end_time TEXT,
  event_type TEXT NOT NULL DEFAULT 'other' CHECK (event_type IN ('walkthrough','meeting','review','inspection','other')),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  client_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Contact CRM: notes / media / todos / activity logs -------------------------
CREATE TABLE IF NOT EXISTS contact_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  body TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT contact_notes_contact_fk CHECK (NOT (lead_id IS NOT NULL AND customer_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_contact_notes_lead ON contact_notes(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contact_notes_customer ON contact_notes(customer_id) WHERE customer_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS contact_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  mime_type TEXT, caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT contact_media_one_contact CHECK (
    (lead_id IS NOT NULL AND customer_id IS NULL) OR (lead_id IS NULL AND customer_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_contact_media_lead ON contact_media(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contact_media_customer ON contact_media(customer_id) WHERE customer_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS contact_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  details TEXT, due_at TIMESTAMPTZ, completed_at TIMESTAMPTZ, device_calendar_event_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT contact_todos_contact_fk CHECK (NOT (lead_id IS NOT NULL AND customer_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_contact_todos_lead ON contact_todos(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contact_todos_customer ON contact_todos(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contact_todos_due ON contact_todos(due_at) WHERE completed_at IS NULL;

CREATE TABLE IF NOT EXISTS contact_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_todo_id UUID REFERENCES contact_todos(id) ON DELETE SET NULL,
  source_note_id UUID REFERENCES contact_notes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT contact_activity_logs_one_contact CHECK (
    (lead_id IS NOT NULL AND customer_id IS NULL) OR (lead_id IS NULL AND customer_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_cal_lead ON contact_activity_logs(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cal_customer ON contact_activity_logs(customer_id) WHERE customer_id IS NOT NULL;

-- ============================ SEED (picklist only) ===========================
INSERT INTO lead_sources (name) VALUES
  ('Street Fair'),('Website Quote Submission'),('SEO'),('Instagram'),('Paid'),
  ('Purchased Leads'),('Advertising'),('Google Search'),('Google Ads'),
  ('Referral'),('Direct Mail'),('Word of Mouth')
ON CONFLICT (name) DO NOTHING;

-- ============================ ROW LEVEL SECURITY =============================
-- Enable RLS on everything
ALTER TABLE lead_sources           ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects               ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates              ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractors         ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists             ENABLE ROW LEVEL SECURITY;
ALTER TABLE punch_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals              ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_integrations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE events                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_notes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_media          ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_todos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_activity_logs  ENABLE ROW LEVEL SECURITY;

-- Authenticated-only full access (NO anon). The app signs users in, so the
-- session JWT satisfies these. user_integrations is locked to the owning user.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'lead_sources','leads','customers','projects','logs','estimates',
    'subcontractors','checklists','punch_items','proposals','events',
    'contact_notes','contact_media','contact_todos','contact_activity_logs'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t||'_authenticated_all', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t||'_authenticated_all', t);
  END LOOP;
END $$;

-- user_integrations: each user can only see/modify their own row (protects tokens)
DROP POLICY IF EXISTS "user_integrations_own" ON user_integrations;
CREATE POLICY "user_integrations_own" ON user_integrations
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================ STORAGE =======================================
INSERT INTO storage.buckets (id, name, public) VALUES ('log-images','log-images', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('contact-media','contact-media', false)
  ON CONFLICT (id) DO NOTHING;

-- log-images: authenticated write; public read (app uses public URLs).
-- NOTE: public read means anyone with the URL can view project photos. To fully
-- lock this down, set this bucket private and switch the app to signed URLs.
DROP POLICY IF EXISTS "log_images_insert" ON storage.objects;
CREATE POLICY "log_images_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'log-images');
DROP POLICY IF EXISTS "log_images_select_public" ON storage.objects;
CREATE POLICY "log_images_select_public" ON storage.objects FOR SELECT TO public USING (bucket_id = 'log-images');
DROP POLICY IF EXISTS "log_images_update" ON storage.objects;
CREATE POLICY "log_images_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'log-images');
DROP POLICY IF EXISTS "log_images_delete" ON storage.objects;
CREATE POLICY "log_images_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'log-images');

-- contact-media: private, authenticated only
DROP POLICY IF EXISTS "contact_media_insert" ON storage.objects;
CREATE POLICY "contact_media_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'contact-media');
DROP POLICY IF EXISTS "contact_media_select" ON storage.objects;
CREATE POLICY "contact_media_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'contact-media');
DROP POLICY IF EXISTS "contact_media_update" ON storage.objects;
CREATE POLICY "contact_media_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'contact-media');
DROP POLICY IF EXISTS "contact_media_delete" ON storage.objects;
CREATE POLICY "contact_media_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'contact-media');

-- =============================================================================
-- Done. Next steps for the new project (outside SQL):
--   1) Auth -> Providers: enable Google (and later Apple); set the app's
--      redirect URLs (scheme brittanybngremodelapp:// + the web origin).
--   2) Restrict sign-ups to your team (allowlist) so randoms can't register.
--   3) Deploy edge functions (esign-send, esign-webhook, calendar-connect)
--      with their secrets (service role, Google, SignNow).
--   4) Put the new Project URL + anon key into the app's EAS env vars.
-- =============================================================================
