-- Extended fields for leads and customers: first/last name, company, alternate email, structured address.
-- Run in Supabase SQL Editor.

-- Leads: add new columns
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS alternate_email TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS address_line_1 TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS address_line_2 TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Customers: add new columns
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS alternate_email TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address_line_1 TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address_line_2 TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS zip_code TEXT;
