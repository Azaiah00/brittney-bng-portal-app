-- Lead Sources and Customers
-- Run this in Supabase SQL Editor

-- 1. Lead sources table (dropdown options)
CREATE TABLE IF NOT EXISTS lead_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add lead_source_id to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_source_id UUID REFERENCES lead_sources(id) ON DELETE SET NULL;

-- 3. Customers table
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

-- 4. Seed default lead sources
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

-- 5. RLS
ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on lead_sources" ON lead_sources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on customers" ON customers FOR ALL USING (true) WITH CHECK (true);
