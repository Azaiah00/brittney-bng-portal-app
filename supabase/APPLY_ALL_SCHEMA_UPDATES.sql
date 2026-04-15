-- =============================================================================
-- BNG Remodel Portal — apply ALL schema updates (idempotent)
-- Paste the ENTIRE file into: Supabase Dashboard → SQL Editor → Run
--
-- Prerequisite: public tables `leads`, `projects`, `logs`, `estimates` must already exist
-- (from your original Supabase setup / supabase/schema.sql). This file only adds or alters.
--
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS where possible.
-- Does NOT delete your data (no DELETE / TRUNCATE).
--
-- If "leads_status_check" or "projects_status_check" fails: some rows may have old status
-- values. Update them to allowed values, then run this file again.
--
-- After running: Table Editor should show columns matching types/database.ts
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Status checks (app expects quoted + pending; older DBs may lack these)
-- -----------------------------------------------------------------------------
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads
  ADD CONSTRAINT leads_status_check
  CHECK (status IS NULL OR status IN ('new', 'contacted', 'quoted', 'converted'));

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects
  ADD CONSTRAINT projects_status_check
  CHECK (status IS NULL OR status IN ('active', 'completed', 'pending'));

-- -----------------------------------------------------------------------------
-- Lead sources + customers (from migrations/lead_sources_and_customers.sql)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_source_id UUID REFERENCES lead_sources(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  project_type TEXT,
  notes TEXT,
  lead_source_id UUID REFERENCES lead_sources(id) ON DELETE SET NULL,
  converted_from_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO lead_sources (name) VALUES
  ('Street Fair'),
  ('Website Quote Submission'),
  ('SEO'),
  ('Instagram'),
  ('Paid'),
  ('Purchased Leads'),
  ('Advertising'),
  ('Google Search'),
  ('Google Ads'),
  ('Referral'),
  ('Direct Mail'),
  ('Word of Mouth')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on lead_sources" ON lead_sources;
CREATE POLICY "Allow all on lead_sources" ON lead_sources FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on customers" ON customers;
CREATE POLICY "Allow all on customers" ON customers FOR ALL USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- Extended lead/customer fields (migrations/leads_customers_extended_fields.sql)
-- -----------------------------------------------------------------------------
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS alternate_email TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS address_line_1 TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS address_line_2 TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS zip_code TEXT;

ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS alternate_email TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address_line_1 TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address_line_2 TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- -----------------------------------------------------------------------------
-- Projects: customer link + hub fields (projects_add_customer_id + app)
-- -----------------------------------------------------------------------------
ALTER TABLE projects ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget NUMERIC(12, 2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS phase TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS address TEXT;

-- -----------------------------------------------------------------------------
-- Logs: author on timeline (app)
-- -----------------------------------------------------------------------------
ALTER TABLE logs ADD COLUMN IF NOT EXISTS author TEXT;

-- -----------------------------------------------------------------------------
-- Crew / checklist / punch (migrations/add_crew_checklist_punch.sql)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subcontractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  trade TEXT NOT NULL DEFAULT 'general',
  phone TEXT,
  email TEXT,
  notes TEXT,
  rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS company_name TEXT;

ALTER TABLE subcontractors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated full access to subcontractors" ON subcontractors;
CREATE POLICY "Allow authenticated full access to subcontractors"
  ON subcontractors FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated full access to checklists" ON checklists;
CREATE POLICY "Allow authenticated full access to checklists"
  ON checklists FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS punch_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE punch_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated full access to punch_items" ON punch_items;
CREATE POLICY "Allow authenticated full access to punch_items"
  ON punch_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- Proposals (migrations/proposals_table.sql)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  client_name TEXT,
  client_address TEXT,
  scope_of_work TEXT,
  line_items JSONB,
  subtotal NUMERIC,
  tax NUMERIC,
  total_amount NUMERIC,
  payment_schedule JSONB,
  start_date TEXT,
  completion_date TEXT,
  special_conditions TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on proposals" ON proposals;
CREATE POLICY "Allow all on proposals" ON proposals FOR ALL USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- SignNow + Google Calendar integration (migration_signnow_calendar.sql)
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

DROP POLICY IF EXISTS "user_integrations_own" ON user_integrations;
CREATE POLICY "user_integrations_own" ON user_integrations
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bng_anon_user_integrations" ON user_integrations;
CREATE POLICY "bng_anon_user_integrations" ON user_integrations
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- Calendar events table (from seed_mock_data_test.sql — schema only, no seed data)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TEXT,
  end_time TEXT,
  event_type TEXT NOT NULL DEFAULT 'other' CHECK (event_type IN ('walkthrough', 'meeting', 'review', 'inspection', 'other')),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  client_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bng_anon_events" ON events;
CREATE POLICY "bng_anon_events" ON events FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated full access to events" ON events;
CREATE POLICY "Allow authenticated full access to events"
  ON events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- Contact CRM tables (migrations/contact_crm_notes_media_todos_logs.sql)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  body TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT contact_notes_one_contact CHECK (
    (lead_id IS NOT NULL AND customer_id IS NULL)
    OR (lead_id IS NULL AND customer_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_contact_notes_lead ON contact_notes(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contact_notes_customer ON contact_notes(customer_id) WHERE customer_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS contact_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT contact_media_one_contact CHECK (
    (lead_id IS NOT NULL AND customer_id IS NULL)
    OR (lead_id IS NULL AND customer_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_contact_media_lead ON contact_media(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contact_media_customer ON contact_media(customer_id) WHERE customer_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS contact_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  details TEXT,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  device_calendar_event_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT contact_todos_one_contact CHECK (
    (lead_id IS NOT NULL AND customer_id IS NULL)
    OR (lead_id IS NULL AND customer_id IS NOT NULL)
  )
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
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_todo_id UUID REFERENCES contact_todos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT contact_activity_logs_one_contact CHECK (
    (lead_id IS NOT NULL AND customer_id IS NULL)
    OR (lead_id IS NULL AND customer_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_contact_activity_logs_lead ON contact_activity_logs(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contact_activity_logs_customer ON contact_activity_logs(customer_id) WHERE customer_id IS NOT NULL;

ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated full access contact_notes" ON contact_notes;
CREATE POLICY "authenticated full access contact_notes" ON contact_notes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated full access contact_media" ON contact_media;
CREATE POLICY "authenticated full access contact_media" ON contact_media
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated full access contact_todos" ON contact_todos;
CREATE POLICY "authenticated full access contact_todos" ON contact_todos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated full access contact_activity_logs" ON contact_activity_logs;
CREATE POLICY "authenticated full access contact_activity_logs" ON contact_activity_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- General (unassigned) notes / to-dos: allow both IDs null; still forbid both set.
ALTER TABLE contact_notes DROP CONSTRAINT IF EXISTS contact_notes_one_contact;
ALTER TABLE contact_notes DROP CONSTRAINT IF EXISTS contact_notes_contact_fk;
ALTER TABLE contact_notes ADD CONSTRAINT contact_notes_contact_fk CHECK (
  (lead_id IS NULL AND customer_id IS NULL)
  OR (lead_id IS NOT NULL AND customer_id IS NULL)
  OR (lead_id IS NULL AND customer_id IS NOT NULL)
);

ALTER TABLE contact_todos DROP CONSTRAINT IF EXISTS contact_todos_one_contact;
ALTER TABLE contact_todos DROP CONSTRAINT IF EXISTS contact_todos_contact_fk;
ALTER TABLE contact_todos ADD CONSTRAINT contact_todos_contact_fk CHECK (
  (lead_id IS NULL AND customer_id IS NULL)
  OR (lead_id IS NOT NULL AND customer_id IS NULL)
  OR (lead_id IS NULL AND customer_id IS NOT NULL)
);

ALTER TABLE contact_activity_logs ADD COLUMN IF NOT EXISTS source_note_id UUID REFERENCES contact_notes(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- Storage buckets + policies
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES ('log-images', 'log-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('contact-media', 'contact-media', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'log-images');
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
CREATE POLICY "Allow public reads" ON storage.objects FOR SELECT TO public USING (bucket_id = 'log-images');
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
CREATE POLICY "Allow authenticated updates" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'log-images');
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
CREATE POLICY "Allow authenticated deletes" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'log-images');

DROP POLICY IF EXISTS "contact_media_storage_insert" ON storage.objects;
CREATE POLICY "contact_media_storage_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contact-media');
DROP POLICY IF EXISTS "contact_media_storage_select" ON storage.objects;
CREATE POLICY "contact_media_storage_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'contact-media');
DROP POLICY IF EXISTS "contact_media_storage_update" ON storage.objects;
CREATE POLICY "contact_media_storage_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'contact-media');
DROP POLICY IF EXISTS "contact_media_storage_delete" ON storage.objects;
CREATE POLICY "contact_media_storage_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'contact-media');

-- -----------------------------------------------------------------------------
-- Anon policies (Expo uses anon key — same pattern as seed_mock_data_test.sql Part 1)
-- Remove in hard production if you rely only on authenticated JWT.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "bng_anon_subcontractors" ON subcontractors;
CREATE POLICY "bng_anon_subcontractors" ON subcontractors FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bng_anon_checklists" ON checklists;
CREATE POLICY "bng_anon_checklists" ON checklists FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bng_anon_punch_items" ON punch_items;
CREATE POLICY "bng_anon_punch_items" ON punch_items FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bng_anon_leads" ON leads;
CREATE POLICY "bng_anon_leads" ON leads FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bng_anon_projects" ON projects;
CREATE POLICY "bng_anon_projects" ON projects FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bng_anon_logs" ON logs;
CREATE POLICY "bng_anon_logs" ON logs FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bng_anon_estimates" ON estimates;
CREATE POLICY "bng_anon_estimates" ON estimates FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bng_anon_proposals" ON proposals;
CREATE POLICY "bng_anon_proposals" ON proposals FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bng_anon_lead_sources" ON lead_sources;
CREATE POLICY "bng_anon_lead_sources" ON lead_sources FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bng_anon_customers" ON customers;
CREATE POLICY "bng_anon_customers" ON customers FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bng_anon_contact_notes" ON contact_notes;
CREATE POLICY "bng_anon_contact_notes" ON contact_notes FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bng_anon_contact_media" ON contact_media;
CREATE POLICY "bng_anon_contact_media" ON contact_media FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bng_anon_contact_todos" ON contact_todos;
CREATE POLICY "bng_anon_contact_todos" ON contact_todos FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bng_anon_contact_activity_logs" ON contact_activity_logs;
CREATE POLICY "bng_anon_contact_activity_logs" ON contact_activity_logs FOR ALL TO anon USING (true) WITH CHECK (true);

-- =============================================================================
-- Done. Refresh the app. If any statement failed, read the error — often a
-- duplicate constraint name means that part was already applied.
-- =============================================================================
