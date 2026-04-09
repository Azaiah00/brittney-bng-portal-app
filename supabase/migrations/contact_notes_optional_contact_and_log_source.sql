-- General (unassigned) notes: both lead_id and customer_id may be NULL.
-- Still forbid both IDs set at once.

ALTER TABLE contact_notes DROP CONSTRAINT IF EXISTS contact_notes_one_contact;

ALTER TABLE contact_notes ADD CONSTRAINT contact_notes_contact_fk CHECK (
  (lead_id IS NULL AND customer_id IS NULL)
  OR (lead_id IS NOT NULL AND customer_id IS NULL)
  OR (lead_id IS NULL AND customer_id IS NOT NULL)
);

-- Link activity log rows back to the note that spawned them (parity with source_todo_id).

ALTER TABLE contact_activity_logs
  ADD COLUMN IF NOT EXISTS source_note_id UUID REFERENCES contact_notes(id) ON DELETE SET NULL;
