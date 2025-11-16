-- =============================================================================
-- MIGRATION 005 - Align expense date column name with the API contract
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'expenses'
          AND column_name = 'date'
    ) THEN
        EXECUTE 'ALTER TABLE expenses RENAME COLUMN "date" TO expense_date';
    END IF;
END $$;
