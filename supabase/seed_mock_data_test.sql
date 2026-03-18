-- =============================================================================
-- BNG Remodel — Mock data (test) + RLS fix + full seed
-- Run ENTIRE file in Supabase SQL Editor.
--
-- WHY CREW / PUNCH WERE EMPTY:
-- Tables subcontractors, punch_items, checklists (and often leads/projects/logs)
-- only allowed role "authenticated". The app uses the anon key unless users
-- sign in. Part 1 adds policies so "anon" can read/write — data then shows up.
-- For production, tighten RLS and use Supabase Auth.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PART 1: RLS — allow anon (your Expo anon key) to use the app without login
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "bng_anon_subcontractors" ON subcontractors;
CREATE POLICY "bng_anon_subcontractors" ON subcontractors
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bng_anon_checklists" ON checklists;
CREATE POLICY "bng_anon_checklists" ON checklists
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bng_anon_punch_items" ON punch_items;
CREATE POLICY "bng_anon_punch_items" ON punch_items
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bng_anon_leads" ON leads;
CREATE POLICY "bng_anon_leads" ON leads
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bng_anon_projects" ON projects;
CREATE POLICY "bng_anon_projects" ON projects
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bng_anon_logs" ON logs;
CREATE POLICY "bng_anon_logs" ON logs
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bng_anon_estimates" ON estimates;
CREATE POLICY "bng_anon_estimates" ON estimates
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Events table (calendar) — only if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
    EXECUTE 'ALTER TABLE events ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS bng_anon_events ON events';
    EXECUTE 'CREATE POLICY bng_anon_events ON events FOR ALL TO anon USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- PART 2: Schema columns (safe if already applied)
-- -----------------------------------------------------------------------------

ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS alternate_email TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS address_line_1 TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS address_line_2 TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget NUMERIC(12, 2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS phase TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE logs ADD COLUMN IF NOT EXISTS author TEXT;

-- -----------------------------------------------------------------------------
-- PART 3: Clear data (FK order)
-- -----------------------------------------------------------------------------

DELETE FROM punch_items;
DELETE FROM checklists;
DELETE FROM logs;
DELETE FROM estimates;
DELETE FROM proposals;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
    DELETE FROM events;
  END IF;
END $$;
DELETE FROM projects;
DELETE FROM customers;
DELETE FROM leads;
DELETE FROM subcontractors;
DELETE FROM lead_sources;

-- -----------------------------------------------------------------------------
-- PART 4: Mock data — everything tagged (test)
-- -----------------------------------------------------------------------------

INSERT INTO lead_sources (id, name) VALUES
  ('a0000001-0001-4000-8000-000000000001', 'Referral (test)'),
  ('a0000001-0001-4000-8000-000000000002', 'Website (test)'),
  ('a0000001-0001-4000-8000-000000000003', 'Google (test)');

INSERT INTO leads (
  id, name, first_name, last_name, company_name, phone, email,
  address, address_line_1, city, state, zip_code, project_type, notes,
  lead_source_id, status
) VALUES
  (
    'b0000001-0001-4000-8000-000000000001',
    'Jane Smith (test)', 'Jane', 'Smith (test)', 'Smith Home Solutions (test)',
    '804-555-0101', 'jane.smith@example.com',
    '100 Main St, Richmond VA', '100 Main St', 'Richmond', 'VA', '23220',
    'Kitchen Remodel (test)', 'Interested in full kitchen renovation. (test)',
    'a0000001-0001-4000-8000-000000000001', 'contacted'
  ),
  (
    'b0000001-0001-4000-8000-000000000002',
    'Mike Jones (test)', 'Mike', 'Jones (test)', NULL,
    '804-555-0102', 'mike.jones@example.com',
    '200 Oak Ave, Richmond VA', '200 Oak Ave', 'Richmond', 'VA', '23221',
    'Bathroom (test)', 'New lead from website. (test)',
    'a0000001-0001-4000-8000-000000000002', 'new'
  ),
  (
    'b0000001-0001-4000-8000-000000000003',
    'Alex Rivera (test)', 'Alex', 'Rivera (test)', 'Rivera Design (test)',
    '804-555-0103', 'alex@rivera.example.com',
    '400 Pine Rd, Richmond VA', '400 Pine Rd', 'Richmond', 'VA', '23223',
    'Addition (test)', 'Wants second-story addition. (test)',
    'a0000001-0001-4000-8000-000000000003', 'contacted'
  );

INSERT INTO customers (
  id, name, first_name, last_name, company_name, phone, email,
  address, address_line_1, city, state, zip_code, project_type, notes,
  lead_source_id, converted_from_lead_id, status
) VALUES
  (
    'c0000001-0001-4000-8000-000000000001',
    'Sarah Williams (test)', 'Sarah', 'Williams (test)', 'Williams Properties (test)',
    '804-555-0201', 'sarah.w@example.com',
    '300 Elm St, Richmond VA', '300 Elm St', 'Richmond', 'VA', '23222',
    'Full Remodel (test)', 'Converted from lead. Ready to start. (test)',
    'a0000001-0001-4000-8000-000000000001',
    'b0000001-0001-4000-8000-000000000001', 'active'
  ),
  (
    'c0000001-0001-4000-8000-000000000002',
    'Pat Chen (test)', 'Pat', 'Chen (test)', NULL,
    '804-555-0202', 'pat.chen@example.com',
    '500 Birch Ln, Richmond VA', '500 Birch Ln', 'Richmond', 'VA', '23224',
    'Basement (test)', 'Finished basement scope. (test)',
    'a0000001-0001-4000-8000-000000000002', NULL, 'active'
  );

-- Crew (5 subs) — company_name on each where it matters
INSERT INTO subcontractors (
  id, company_name, name, trade, phone, email, notes, rating
) VALUES
  ('d0000001-0001-4000-8000-000000000001', 'Richmond Electric Co (test)', 'Tom Davis (test)', 'electrician',
    '804-555-0301', 'tom@richmondelectric.example.com', 'Licensed. Rough-in. (test)', 5),
  ('d0000001-0001-4000-8000-000000000002', 'VA Plumbing Pros (test)', 'Lisa Brown (test)', 'plumber',
    '804-555-0302', 'lisa@vaplumbing.example.com', 'Fast and reliable. (test)', 4),
  ('d0000001-0001-4000-8000-000000000003', 'TileCraft RVA (test)', 'Jake Tile (test)', 'tile',
    '804-555-0303', 'jake@tilecraft.example.com', 'Tile and flooring. (test)', 4),
  ('d0000001-0001-4000-8000-000000000004', 'BNG Painting LLC (test)', 'Marcus Green (test)', 'painter',
    '804-555-0304', 'marcus@bngpainting.example.com', 'Interior/exterior. (test)', 5),
  ('d0000001-0001-4000-8000-000000000005', 'Demo Masters (test)', 'Chris Wells (test)', 'demo',
    '804-555-0305', 'chris@demomasters.example.com', 'Demo and haul-away. (test)', 4);

-- Three projects
INSERT INTO projects (
  id, lead_id, customer_id, title, address, budget, phase, progress, start_date, status
) VALUES
  (
    'e0000001-0001-4000-8000-000000000001', NULL, 'c0000001-0001-4000-8000-000000000001',
    'Williams Kitchen Remodel (test)', '300 Elm St, Richmond VA', 45000, 'Demo', 25, '2025-03-01', 'active'
  ),
  (
    'e0000001-0001-4000-8000-000000000002', 'b0000001-0001-4000-8000-000000000001', NULL,
    'Smith Bathroom (test)', '100 Main St, Richmond VA', 18000, 'Planning', 0, NULL, 'pending'
  ),
  (
    'e0000001-0001-4000-8000-000000000003', NULL, 'c0000001-0001-4000-8000-000000000002',
    'Chen Basement Finish (test)', '500 Birch Ln, Richmond VA', 62000, 'Rough-in', 40, '2025-02-10', 'active'
  );

-- Timeline logs (all 3 projects)
INSERT INTO logs (project_id, note, author) VALUES
  ('e0000001-0001-4000-8000-000000000001', 'Site visit completed. Measurements taken. (test)', 'Brittney'),
  ('e0000001-0001-4000-8000-000000000001', 'Demo started. Old cabinets removed. (test)', 'Brittney'),
  ('e0000001-0001-4000-8000-000000000001', 'Electrical rough-in scheduled for next week. (test)', 'Brittney'),
  ('e0000001-0001-4000-8000-000000000002', 'Quote sent to Jane Smith. Awaiting response. (test)', 'Brittney'),
  ('e0000001-0001-4000-8000-000000000003', 'Framing inspection passed. (test)', 'Brittney'),
  ('e0000001-0001-4000-8000-000000000003', 'Drywall going up in rec room. (test)', 'Brittney');

-- Checklists (project 1 + 3 — full 12 steps, mix of done)
INSERT INTO checklists (project_id, items) VALUES
  (
    'e0000001-0001-4000-8000-000000000001',
    '[
      {"label":"Contract signed","done":true,"completed_date":"2025-02-15","note":""},
      {"label":"Deposit received (30%)","done":true,"completed_date":"2025-02-20","note":""},
      {"label":"Permits pulled","done":true,"completed_date":"2025-02-28","note":""},
      {"label":"Materials ordered / selections finalized","done":false,"completed_date":null,"note":""},
      {"label":"Demo complete","done":false,"completed_date":null,"note":""},
      {"label":"Rough-in complete (electrical, plumbing)","done":false,"completed_date":null,"note":""},
      {"label":"Inspection passed","done":false,"completed_date":null,"note":""},
      {"label":"Finish work complete","done":false,"completed_date":null,"note":""},
      {"label":"Progress payment received (40%)","done":false,"completed_date":null,"note":""},
      {"label":"Final walkthrough & punch list","done":false,"completed_date":null,"note":""},
      {"label":"Final payment received (30%)","done":false,"completed_date":null,"note":""},
      {"label":"Project closed / warranty start","done":false,"completed_date":null,"note":""}
    ]'::jsonb
  ),
  (
    'e0000001-0001-4000-8000-000000000003',
    '[
      {"label":"Contract signed","done":true,"completed_date":"2025-01-10","note":""},
      {"label":"Deposit received (30%)","done":true,"completed_date":"2025-01-12","note":""},
      {"label":"Permits pulled","done":true,"completed_date":"2025-01-20","note":""},
      {"label":"Materials ordered / selections finalized","done":true,"completed_date":"2025-02-01","note":""},
      {"label":"Demo complete","done":true,"completed_date":"2025-02-05","note":""},
      {"label":"Rough-in complete (electrical, plumbing)","done":true,"completed_date":"2025-02-28","note":""},
      {"label":"Inspection passed","done":false,"completed_date":null,"note":"Scheduled Monday (test)"},
      {"label":"Finish work complete","done":false,"completed_date":null,"note":""},
      {"label":"Progress payment received (40%)","done":false,"completed_date":null,"note":""},
      {"label":"Final walkthrough & punch list","done":false,"completed_date":null,"note":""},
      {"label":"Final payment received (30%)","done":false,"completed_date":null,"note":""},
      {"label":"Project closed / warranty start","done":false,"completed_date":null,"note":""}
    ]'::jsonb
  );

-- Punch list — many items across projects (open / in_progress / resolved)
INSERT INTO punch_items (project_id, description, status, assigned_to) VALUES
  ('e0000001-0001-4000-8000-000000000001', 'Patch drywall in corner near pantry (test)', 'open', 'Tom Davis (test)'),
  ('e0000001-0001-4000-8000-000000000001', 'Touch-up paint master bath ceiling (test)', 'in_progress', 'Marcus Green (test)'),
  ('e0000001-0001-4000-8000-000000000001', 'Caulk gap at window trim — kitchen (test)', 'open', 'Marcus Green (test)'),
  ('e0000001-0001-4000-8000-000000000001', 'Replace scratched outlet plate — island (test)', 'resolved', 'Tom Davis (test)'),
  ('e0000001-0001-4000-8000-000000000001', 'Adjust cabinet door alignment — lazy susan (test)', 'open', NULL),
  ('e0000001-0001-4000-8000-000000000002', 'Confirm vanity rough-in heights (test)', 'open', 'Lisa Brown (test)'),
  ('e0000001-0001-4000-8000-000000000002', 'Order shower niche trim (test)', 'in_progress', 'Jake Tile (test)'),
  ('e0000001-0001-4000-8000-000000000003', 'Soundproof ceiling — media room (test)', 'in_progress', 'Chris Wells (test)'),
  ('e0000001-0001-4000-8000-000000000003', 'Stair tread squeak — step 3 (test)', 'open', NULL),
  ('e0000001-0001-4000-8000-000000000003', 'Egress window well drain check (test)', 'resolved', 'Lisa Brown (test)'),
  ('e0000001-0001-4000-8000-000000000003', 'Label all basement breakers in panel (test)', 'open', 'Tom Davis (test)');

-- Estimates (sample line items JSON)
INSERT INTO estimates (project_id, line_items, total_amount) VALUES
  (
    'e0000001-0001-4000-8000-000000000001',
    '[{"desc":"Cabinets & install (test)","qty":1,"unit":28000},{"desc":"Countertops quartz (test)","qty":1,"unit":8500},{"desc":"Appliance package (test)","qty":1,"unit":6500}]'::jsonb,
    43000
  ),
  (
    'e0000001-0001-4000-8000-000000000002',
    '[{"desc":"Vanity & fixtures (test)","qty":1,"unit":4200},{"desc":"Tile shower (test)","qty":1,"unit":6800},{"desc":"Labor (test)","qty":1,"unit":5200}]'::jsonb,
    16200
  );

-- Proposals (draft) — if table exists
INSERT INTO proposals (
  project_id, client_name, client_address, scope_of_work, line_items,
  subtotal, tax, total_amount, payment_schedule, status
) VALUES
  (
    'e0000001-0001-4000-8000-000000000001',
    'Sarah Williams (test)', '300 Elm St, Richmond VA',
    'Full kitchen remodel including cabinets, counters, lighting, and flooring. (test)',
    '[{"item":"Design & demo (test)","amount":8000},{"item":"Cabinets (test)","amount":22000},{"item":"Counters & backsplash (test)","amount":12000}]'::jsonb,
    42000, 2520, 44520,
    '[{"label":"Deposit (test)","pct":30},{"label":"Mid-project (test)","pct":40},{"label":"Final (test)","pct":30}]'::jsonb,
    'draft'
  );

-- Calendar events (only if events table exists — wrapped)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
    INSERT INTO events (title, description, event_date, start_time, end_time, event_type, project_id, client_name) VALUES
      ('Walkthrough – Williams (test)', 'Initial walkthrough and scope. (test)', '2025-03-15', '09:00', '10:30', 'walkthrough', 'e0000001-0001-4000-8000-000000000001', 'Sarah Williams (test)'),
      ('Inspection – Smith (test)', 'Permit inspection. (test)', '2025-03-20', '14:00', '15:00', 'inspection', 'e0000001-0001-4000-8000-000000000002', 'Jane Smith (test)'),
      ('Sub walkthrough – Chen basement (test)', 'Electrical and plumbing review. (test)', '2025-03-22', '08:00', '11:00', 'review', 'e0000001-0001-4000-8000-000000000003', 'Pat Chen (test)'),
      ('Client meeting – Rivera (test)', 'Addition scope review. (test)', '2025-03-25', '13:00', '14:00', 'meeting', NULL, 'Alex Rivera (test)');
  END IF;
END $$;

-- =============================================================================
-- After run: refresh Crew, Contacts, Projects, Calendar, open each project for
-- Timeline, Checklist, Punch List, Estimate/Proposal screens.
-- =============================================================================
