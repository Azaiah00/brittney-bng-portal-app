-- Proposals table: stores generated or manually-created proposals/contracts.
-- Each proposal is linked to a project.

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
CREATE POLICY "Allow all on proposals" ON proposals FOR ALL USING (true) WITH CHECK (true);
