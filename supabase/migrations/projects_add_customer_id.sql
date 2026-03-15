-- Link projects to contacts: allow projects to be linked to a customer (as well as lead).
-- Run after lead_sources_and_customers.sql

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

COMMENT ON COLUMN projects.customer_id IS 'When set, this project is linked to a customer. Either lead_id or customer_id can be set.';
