-- Allow general (unassigned) to-dos: both lead_id and customer_id may be NULL.
-- Still forbid both IDs set at once.

ALTER TABLE contact_todos DROP CONSTRAINT IF EXISTS contact_todos_one_contact;

ALTER TABLE contact_todos ADD CONSTRAINT contact_todos_contact_fk CHECK (
  (lead_id IS NULL AND customer_id IS NULL)
  OR (lead_id IS NOT NULL AND customer_id IS NULL)
  OR (lead_id IS NULL AND customer_id IS NOT NULL)
);
