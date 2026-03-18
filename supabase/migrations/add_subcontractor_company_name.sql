-- Add Company Name to subcontractors (most important field for subs)
ALTER TABLE subcontractors
ADD COLUMN IF NOT EXISTS company_name TEXT;
