-- BNG Remodel — New tables for Crew, Checklists, and Punch Lists
-- Migration adds three tables used by the expanded hub features.

-- ─────────────────────────────────────────────────────────────
-- 1. Subcontractors (Crew roster)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subcontractors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    trade TEXT NOT NULL DEFAULT 'general',
    phone TEXT,
    email TEXT,
    notes TEXT,
    rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE subcontractors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated full access to subcontractors"
    ON subcontractors FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 2. Checklists (per-project job checklist)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated full access to checklists"
    ON checklists FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 3. Punch Items (per-project punch list)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS punch_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    photo_url TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    assigned_to TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE punch_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated full access to punch_items"
    ON punch_items FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
