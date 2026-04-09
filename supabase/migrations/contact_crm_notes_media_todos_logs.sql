-- Per-contact CRM: Apple-style notes, media, to-dos, and activity logs (separate from project `logs` table).

CREATE TABLE contact_notes (
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

CREATE INDEX idx_contact_notes_lead ON contact_notes(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_contact_notes_customer ON contact_notes(customer_id) WHERE customer_id IS NOT NULL;

CREATE TABLE contact_media (
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

CREATE INDEX idx_contact_media_lead ON contact_media(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_contact_media_customer ON contact_media(customer_id) WHERE customer_id IS NOT NULL;

CREATE TABLE contact_todos (
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

CREATE INDEX idx_contact_todos_lead ON contact_todos(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_contact_todos_customer ON contact_todos(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_contact_todos_due ON contact_todos(due_at) WHERE completed_at IS NULL;

CREATE TABLE contact_activity_logs (
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

CREATE INDEX idx_contact_activity_logs_lead ON contact_activity_logs(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_contact_activity_logs_customer ON contact_activity_logs(customer_id) WHERE customer_id IS NOT NULL;

ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated full access contact_notes" ON contact_notes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated full access contact_media" ON contact_media
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated full access contact_todos" ON contact_todos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated full access contact_activity_logs" ON contact_activity_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('contact-media', 'contact-media', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "contact_media_storage_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contact-media');
CREATE POLICY "contact_media_storage_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'contact-media');
CREATE POLICY "contact_media_storage_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'contact-media');
CREATE POLICY "contact_media_storage_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'contact-media');
