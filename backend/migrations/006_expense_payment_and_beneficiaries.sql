-- =============================================================================
-- MIGRATION 006 - Payment method + beneficiaries per expense
-- =============================================================================

ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'card'
        CHECK (payment_method IN ('cash', 'card', 'transfer', 'other'));

ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS beneficiary_member_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[];

UPDATE expenses
SET beneficiary_member_ids = ARRAY[]::uuid[]
WHERE beneficiary_member_ids IS NULL;
