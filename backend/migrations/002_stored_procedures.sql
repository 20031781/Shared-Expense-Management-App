/*
  # Stored Procedures - Split Expenses

  Funzioni per calcolo rimborsi ottimizzati.
*/

-- ============================================================================
-- FUNZIONE: Calcolo rimborsi ottimizzati
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_optimized_reimbursements(p_list_id uuid)
RETURNS TABLE (
  from_user_id uuid,
  to_user_id uuid,
  amount numeric
) AS $$
DECLARE
  v_user record;
  v_balance numeric;
BEGIN
  CREATE TEMP TABLE IF NOT EXISTS user_balances (
    user_id uuid PRIMARY KEY,
    balance numeric NOT NULL DEFAULT 0
  );

  TRUNCATE user_balances;

  FOR v_user IN
    SELECT DISTINCT lm.user_id
    FROM list_members lm
    WHERE lm.list_id = p_list_id AND lm.status = 'active'
  LOOP
    SELECT
      COALESCE(SUM(e.amount), 0) - COALESCE(SUM(es.amount), 0)
    INTO v_balance
    FROM list_members lm
    LEFT JOIN expenses e ON e.author_id = lm.user_id AND e.list_id = p_list_id AND e.status = 'approved'
    LEFT JOIN expense_splits es ON es.user_id = lm.user_id AND es.expense_id IN (
      SELECT id FROM expenses WHERE list_id = p_list_id AND status = 'approved'
    )
    WHERE lm.user_id = v_user.user_id;

    INSERT INTO user_balances (user_id, balance)
    VALUES (v_user.user_id, v_balance);
  END LOOP;

  RETURN QUERY
  WITH debtors AS (
    SELECT user_id, ABS(balance) as debt
    FROM user_balances
    WHERE balance < 0
    ORDER BY balance
  ),
  creditors AS (
    SELECT user_id, balance as credit
    FROM user_balances
    WHERE balance > 0
    ORDER BY balance DESC
  )
  SELECT
    d.user_id as from_user_id,
    c.user_id as to_user_id,
    LEAST(d.debt, c.credit) as amount
  FROM debtors d
  CROSS JOIN creditors c
  WHERE d.debt > 0.01 AND c.credit > 0.01;

  DROP TABLE IF EXISTS user_balances;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNZIONE: Genera codice invito univoco
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Genera invite_code per nuove liste
-- ============================================================================
CREATE OR REPLACE FUNCTION set_list_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := generate_invite_code();

    WHILE EXISTS (SELECT 1 FROM lists WHERE invite_code = NEW.invite_code) LOOP
      NEW.invite_code := generate_invite_code();
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_list_invite_code
  BEFORE INSERT ON lists
  FOR EACH ROW
  EXECUTE FUNCTION set_list_invite_code();
