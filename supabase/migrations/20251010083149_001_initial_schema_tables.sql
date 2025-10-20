/*
  # Schema Iniziale - Tabelle Base

  ## Descrizione
  Crea tutte le tabelle del database senza le policy RLS.
  Le policy verranno aggiunte in un secondo migration per evitare dipendenze circolari.

  ## Tabelle
  - users: Utenti registrati via Google OAuth
  - refresh_tokens: Token per mantenere sessioni attive
  - device_tokens: Token FCM per notifiche push
  - lists: Liste di spese condivise
  - list_members: Membri delle liste con ruoli e percentuali
  - expenses: Spese inserite nelle liste
  - expense_validations: Validazioni spese da validatori
  - expense_splits: Divisione importi spese tra membri
  - reimbursements: Rimborsi tra membri
  - sync_queue: Coda operazioni offline
  - notifications: Notifiche utente
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABELLA: users
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  picture_url text,
  google_id text UNIQUE NOT NULL,
  default_currency text DEFAULT 'EUR',
  notification_preferences jsonb DEFAULT '{"new_expense": true, "validation_request": true, "validation_result": true, "new_reimbursement": true}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- ============================================================================
-- TABELLA: refresh_tokens
-- ============================================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- ============================================================================
-- TABELLA: device_tokens
-- ============================================================================
CREATE TABLE IF NOT EXISTS device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);

-- ============================================================================
-- TABELLA: lists
-- ============================================================================
CREATE TABLE IF NOT EXISTS lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  admin_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_code text UNIQUE NOT NULL DEFAULT substring(md5(random()::text) from 1 for 8),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lists_admin_id ON lists(admin_id);
CREATE INDEX IF NOT EXISTS idx_lists_invite_code ON lists(invite_code);

-- ============================================================================
-- TABELLA: list_members
-- ============================================================================
CREATE TABLE IF NOT EXISTS list_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  email text NOT NULL,
  split_percentage decimal(5,2) NOT NULL CHECK (split_percentage >= 0 AND split_percentage <= 100),
  is_validator boolean DEFAULT false,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active')),
  joined_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_list_members_list_id ON list_members(list_id);
CREATE INDEX IF NOT EXISTS idx_list_members_user_id ON list_members(user_id);
CREATE INDEX IF NOT EXISTS idx_list_members_email ON list_members(email);
CREATE INDEX IF NOT EXISTS idx_list_members_status ON list_members(status);

-- ============================================================================
-- TABELLA: expenses
-- ============================================================================
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'EUR',
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  receipt_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'validated', 'rejected')),
  server_timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_list_id ON expenses(list_id);
CREATE INDEX IF NOT EXISTS idx_expenses_author_id ON expenses(author_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_server_timestamp ON expenses(server_timestamp);

-- ============================================================================
-- TABELLA: expense_validations
-- ============================================================================
CREATE TABLE IF NOT EXISTS expense_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  validator_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('validated', 'rejected')),
  notes text,
  validated_at timestamptz DEFAULT now(),
  UNIQUE(expense_id, validator_id)
);

CREATE INDEX IF NOT EXISTS idx_expense_validations_expense_id ON expense_validations(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_validations_validator_id ON expense_validations(validator_id);

-- ============================================================================
-- TABELLA: expense_splits
-- ============================================================================
CREATE TABLE IF NOT EXISTS expense_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES list_members(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  percentage decimal(5,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_member_id ON expense_splits(member_id);

-- ============================================================================
-- TABELLA: reimbursements
-- ============================================================================
CREATE TABLE IF NOT EXISTS reimbursements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  completed_at timestamptz,
  server_timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CHECK (from_user_id != to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_reimbursements_list_id ON reimbursements(list_id);
CREATE INDEX IF NOT EXISTS idx_reimbursements_from_user_id ON reimbursements(from_user_id);
CREATE INDEX IF NOT EXISTS idx_reimbursements_to_user_id ON reimbursements(to_user_id);
CREATE INDEX IF NOT EXISTS idx_reimbursements_status ON reimbursements(status);
CREATE INDEX IF NOT EXISTS idx_reimbursements_server_timestamp ON reimbursements(server_timestamp);

-- ============================================================================
-- TABELLA: sync_queue
-- ============================================================================
CREATE TABLE IF NOT EXISTS sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operation_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'synced', 'error')),
  error_message text,
  retry_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_user_id ON sync_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);

-- ============================================================================
-- TABELLA: notifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lists_updated_at BEFORE UPDATE ON lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
