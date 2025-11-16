-- Adds paid_by_member_id and inserted_at metadata to expenses
ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS paid_by_member_id uuid REFERENCES list_members(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS inserted_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_expenses_paid_by_member ON expenses(paid_by_member_id);
