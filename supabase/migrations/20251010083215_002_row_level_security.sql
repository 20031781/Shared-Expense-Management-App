/*
  # Row Level Security Policies

  ## Descrizione
  Abilita RLS su tutte le tabelle e crea policy restrittive per accesso sicuro ai dati.
  
  ## Principi di Sicurezza
  1. Gli utenti accedono solo ai propri dati personali
  2. I membri di una lista vedono solo i dati della lista
  3. Gli admin hanno controllo completo sulle proprie liste
  4. I validatori possono approvare/rifiutare spese
  5. Le operazioni offline sono isolate per utente
*/

-- ============================================================================
-- RLS: users
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (public.current_user_id() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (public.current_user_id() = id)
  WITH CHECK (public.current_user_id() = id);

-- ============================================================================
-- RLS: refresh_tokens
-- ============================================================================
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tokens"
  ON refresh_tokens FOR SELECT
  TO authenticated
  USING (user_id = public.current_user_id());

-- ============================================================================
-- RLS: device_tokens
-- ============================================================================
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own device tokens"
  ON device_tokens FOR ALL
  TO authenticated
  USING (user_id = public.current_user_id())
  WITH CHECK (user_id = public.current_user_id());

-- ============================================================================
-- RLS: lists
-- ============================================================================
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "List members can view lists"
  ON lists FOR SELECT
  TO authenticated
  USING (
    public.current_user_id() IN (
      SELECT user_id FROM list_members 
      WHERE list_id = lists.id AND status = 'active'
    )
  );

CREATE POLICY "Admins can update own lists"
  ON lists FOR UPDATE
  TO authenticated
  USING (admin_id = public.current_user_id())
  WITH CHECK (admin_id = public.current_user_id());

CREATE POLICY "Admins can delete own lists"
  ON lists FOR DELETE
  TO authenticated
  USING (admin_id = public.current_user_id());

CREATE POLICY "Authenticated users can create lists"
  ON lists FOR INSERT
  TO authenticated
  WITH CHECK (admin_id = public.current_user_id());

-- ============================================================================
-- RLS: list_members
-- ============================================================================
ALTER TABLE list_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "List members can view members"
  ON list_members FOR SELECT
  TO authenticated
  USING (
    list_id IN (
      SELECT list_id FROM list_members 
      WHERE user_id = public.current_user_id() AND status = 'active'
    )
  );

CREATE POLICY "List admins can manage members"
  ON list_members FOR ALL
  TO authenticated
  USING (
    list_id IN (
      SELECT id FROM lists WHERE admin_id = public.current_user_id()
    )
  )
  WITH CHECK (
    list_id IN (
      SELECT id FROM lists WHERE admin_id = public.current_user_id()
    )
  );

CREATE POLICY "Users can accept invites"
  ON list_members FOR UPDATE
  TO authenticated
  USING (email = (SELECT email FROM users WHERE id = public.current_user_id()) AND status = 'pending')
  WITH CHECK (user_id = public.current_user_id() AND status = 'active');

-- ============================================================================
-- RLS: expenses
-- ============================================================================
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "List members can view expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    list_id IN (
      SELECT list_id FROM list_members 
      WHERE user_id = public.current_user_id() AND status = 'active'
    )
  );

CREATE POLICY "List members can create expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = public.current_user_id() AND
    list_id IN (
      SELECT list_id FROM list_members 
      WHERE user_id = public.current_user_id() AND status = 'active'
    )
  );

CREATE POLICY "Authors can update own draft expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (author_id = public.current_user_id() AND status = 'draft')
  WITH CHECK (author_id = public.current_user_id());

CREATE POLICY "Authors can delete own draft expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (author_id = public.current_user_id() AND status = 'draft');

-- ============================================================================
-- RLS: expense_validations
-- ============================================================================
ALTER TABLE expense_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "List members can view validations"
  ON expense_validations FOR SELECT
  TO authenticated
  USING (
    expense_id IN (
      SELECT id FROM expenses WHERE list_id IN (
        SELECT list_id FROM list_members 
        WHERE user_id = public.current_user_id() AND status = 'active'
      )
    )
  );

CREATE POLICY "Validators can create validations"
  ON expense_validations FOR INSERT
  TO authenticated
  WITH CHECK (
    validator_id = public.current_user_id() AND
    expense_id IN (
      SELECT e.id FROM expenses e
      INNER JOIN list_members lm ON lm.list_id = e.list_id
      WHERE lm.user_id = public.current_user_id() AND lm.is_validator = true AND lm.status = 'active'
    )
  );

-- ============================================================================
-- RLS: expense_splits
-- ============================================================================
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "List members can view expense splits"
  ON expense_splits FOR SELECT
  TO authenticated
  USING (
    expense_id IN (
      SELECT id FROM expenses WHERE list_id IN (
        SELECT list_id FROM list_members 
        WHERE user_id = public.current_user_id() AND status = 'active'
      )
    )
  );

-- ============================================================================
-- RLS: reimbursements
-- ============================================================================
ALTER TABLE reimbursements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "List members can view reimbursements"
  ON reimbursements FOR SELECT
  TO authenticated
  USING (
    list_id IN (
      SELECT list_id FROM list_members 
      WHERE user_id = public.current_user_id() AND status = 'active'
    )
  );

CREATE POLICY "Users involved can update reimbursement status"
  ON reimbursements FOR UPDATE
  TO authenticated
  USING (from_user_id = public.current_user_id() OR to_user_id = public.current_user_id())
  WITH CHECK (from_user_id = public.current_user_id() OR to_user_id = public.current_user_id());

-- ============================================================================
-- RLS: sync_queue
-- ============================================================================
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sync queue"
  ON sync_queue FOR ALL
  TO authenticated
  USING (user_id = public.current_user_id())
  WITH CHECK (user_id = public.current_user_id());

-- ============================================================================
-- RLS: notifications
-- ============================================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = public.current_user_id());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = public.current_user_id())
  WITH CHECK (user_id = public.current_user_id());
