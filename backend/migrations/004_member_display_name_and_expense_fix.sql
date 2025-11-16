-- =============================================================================
-- MIGRATION 004 - Member display name + expense schema alignment
-- =============================================================================

-- Allow administrators to store a friendly label for each member
ALTER TABLE list_members
    ADD COLUMN IF NOT EXISTS display_name text;

-- Align expenses table with the API expectations
ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS paid_by_member_id uuid REFERENCES list_members(id);

ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS server_timestamp timestamptz NOT NULL DEFAULT now();

ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS inserted_at timestamptz NOT NULL DEFAULT now();

-- Relax legacy NOT NULL constraint on category because the mobile app does not send it yet
ALTER TABLE expenses
    ALTER COLUMN category DROP NOT NULL,
    ALTER COLUMN category SET DEFAULT 'general';

-- Normalize legacy status values and constraints
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'expenses_status_check'
          AND conrelid = 'expenses'::regclass
    ) THEN
        ALTER TABLE expenses DROP CONSTRAINT expenses_status_check;
    END IF;
END $$;

-- Map legacy statuses to the new taxonomy used by the API
UPDATE expenses SET status = 'submitted' WHERE status = 'pending_validation';
UPDATE expenses SET status = 'validated' WHERE status = 'approved';

ALTER TABLE expenses
    ADD CONSTRAINT expenses_status_check CHECK (status IN ('draft', 'submitted', 'validated', 'rejected'));
