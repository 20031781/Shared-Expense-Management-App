/*
  # Stored Procedures e Funzioni

  ## Descrizione
  Funzioni SQL per operazioni complesse:
  1. Calcolo automatico expense_splits quando una spesa è validata
  2. Calcolo rimborsi ottimizzati (minimizzazione transazioni)
  3. Aggiornamento stato spese dopo validazioni
  
  ## Funzioni Create
  
  ### calculate_expense_splits
  Calcola la divisione di una spesa tra i membri attivi della lista
  secondo le percentuali configurate.
  
  ### calculate_optimized_reimbursements
  Calcola i rimborsi necessari per una lista minimizzando il numero
  di transazioni usando un algoritmo greedy.
  
  ### update_expense_status_after_validation
  Aggiorna lo stato di una spesa dopo che tutti i validatori hanno espresso il loro voto.
*/

-- ============================================================================
-- FUNZIONE: Calcolo splits spesa
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_expense_splits(expense_id_param uuid)
RETURNS void AS $$
DECLARE
  expense_record RECORD;
  member_record RECORD;
  split_amount decimal(10,2);
BEGIN
  -- Recupera la spesa
  SELECT * INTO expense_record FROM expenses WHERE id = expense_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Expense not found';
  END IF;
  
  -- Cancella eventuali splits esistenti
  DELETE FROM expense_splits WHERE expense_id = expense_id_param;
  
  -- Crea splits per ogni membro attivo
  FOR member_record IN 
    SELECT * FROM list_members 
    WHERE list_id = expense_record.list_id AND status = 'active'
  LOOP
    split_amount := (expense_record.amount * member_record.split_percentage / 100);
    
    INSERT INTO expense_splits (expense_id, member_id, amount, percentage)
    VALUES (expense_id_param, member_record.id, split_amount, member_record.split_percentage);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNZIONE: Aggiornamento stato spesa dopo validazione
-- ============================================================================
CREATE OR REPLACE FUNCTION update_expense_status_after_validation()
RETURNS TRIGGER AS $$
DECLARE
  validators_count integer;
  validations_count integer;
  rejected_count integer;
BEGIN
  -- Conta validatori della lista
  SELECT COUNT(*) INTO validators_count
  FROM list_members lm
  INNER JOIN expenses e ON e.list_id = lm.list_id
  WHERE e.id = NEW.expense_id 
    AND lm.is_validator = true 
    AND lm.status = 'active';
  
  -- Conta validazioni esistenti
  SELECT COUNT(*) INTO validations_count
  FROM expense_validations
  WHERE expense_id = NEW.expense_id;
  
  -- Conta rifiuti
  SELECT COUNT(*) INTO rejected_count
  FROM expense_validations
  WHERE expense_id = NEW.expense_id AND status = 'rejected';
  
  -- Se almeno un validatore ha rifiutato, segna come rejected
  IF rejected_count > 0 THEN
    UPDATE expenses SET status = 'rejected' WHERE id = NEW.expense_id;
  -- Se tutti i validatori hanno approvato, segna come validated e calcola splits
  ELSIF validations_count >= validators_count THEN
    UPDATE expenses SET status = 'validated' WHERE id = NEW.expense_id;
    PERFORM calculate_expense_splits(NEW.expense_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_expense_status
AFTER INSERT ON expense_validations
FOR EACH ROW
EXECUTE FUNCTION update_expense_status_after_validation();

-- ============================================================================
-- FUNZIONE: Calcolo rimborsi ottimizzati per una lista
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_optimized_reimbursements(list_id_param uuid)
RETURNS TABLE(
  from_user uuid,
  to_user uuid,
  amount decimal(10,2),
  currency text
) AS $$
DECLARE
  member_balance RECORD;
  debtor RECORD;
  creditor RECORD;
  transfer_amount decimal(10,2);
  list_currency text;
  debtors CURSOR FOR 
    SELECT user_id, balance FROM temp_balances WHERE balance < 0 ORDER BY balance ASC;
  creditors CURSOR FOR 
    SELECT user_id, balance FROM temp_balances WHERE balance > 0 ORDER BY balance DESC;
BEGIN
  -- Recupera la valuta della lista (dalla prima spesa)
  SELECT COALESCE(
    (SELECT currency FROM expenses WHERE list_id = list_id_param LIMIT 1),
    'EUR'
  ) INTO list_currency;
  
  -- Crea tabella temporanea per i bilanci
  CREATE TEMP TABLE IF NOT EXISTS temp_balances (
    user_id uuid,
    balance decimal(10,2)
  ) ON COMMIT DROP;
  
  -- Calcola il bilancio di ogni membro (quanto ha speso - quanto deve)
  INSERT INTO temp_balances (user_id, balance)
  SELECT 
    lm.user_id,
    COALESCE(
      (SELECT SUM(e.amount) 
       FROM expenses e 
       WHERE e.list_id = list_id_param 
         AND e.author_id = lm.user_id 
         AND e.status = 'validated'),
      0
    ) - COALESCE(
      (SELECT SUM(es.amount)
       FROM expense_splits es
       INNER JOIN expenses e ON e.id = es.expense_id
       WHERE es.member_id = lm.id 
         AND e.list_id = list_id_param
         AND e.status = 'validated'),
      0
    ) as balance
  FROM list_members lm
  WHERE lm.list_id = list_id_param AND lm.status = 'active';
  
  -- Algoritmo greedy per minimizzare transazioni
  OPEN debtors;
  OPEN creditors;
  
  FETCH debtors INTO debtor;
  FETCH creditors INTO creditor;
  
  WHILE debtor.user_id IS NOT NULL AND creditor.user_id IS NOT NULL LOOP
    -- Calcola l'importo del trasferimento
    transfer_amount := LEAST(ABS(debtor.balance), creditor.balance);
    
    -- Restituisce la transazione
    from_user := debtor.user_id;
    to_user := creditor.user_id;
    amount := transfer_amount;
    currency := list_currency;
    RETURN NEXT;
    
    -- Aggiorna i bilanci
    UPDATE temp_balances SET balance = balance + transfer_amount WHERE user_id = debtor.user_id;
    UPDATE temp_balances SET balance = balance - transfer_amount WHERE user_id = creditor.user_id;
    
    -- Passa al prossimo debitore o creditore se il bilancio è saldato
    IF ABS(debtor.balance) <= transfer_amount THEN
      FETCH debtors INTO debtor;
    ELSE
      SELECT balance INTO debtor.balance FROM temp_balances WHERE user_id = debtor.user_id;
    END IF;
    
    IF creditor.balance <= transfer_amount THEN
      FETCH creditors INTO creditor;
    ELSE
      SELECT balance INTO creditor.balance FROM temp_balances WHERE user_id = creditor.user_id;
    END IF;
  END LOOP;
  
  CLOSE debtors;
  CLOSE creditors;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNZIONE: Genera rimborsi per una lista
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_reimbursements_for_list(list_id_param uuid)
RETURNS integer AS $$
DECLARE
  reimbursement_count integer := 0;
  reimbursement_record RECORD;
BEGIN
  -- Cancella rimborsi pending esistenti
  DELETE FROM reimbursements 
  WHERE list_id = list_id_param AND status = 'pending';
  
  -- Genera nuovi rimborsi ottimizzati
  FOR reimbursement_record IN 
    SELECT * FROM calculate_optimized_reimbursements(list_id_param)
  LOOP
    INSERT INTO reimbursements (
      list_id, 
      from_user_id, 
      to_user_id, 
      amount, 
      currency,
      status
    ) VALUES (
      list_id_param,
      reimbursement_record.from_user,
      reimbursement_record.to_user,
      reimbursement_record.amount,
      reimbursement_record.currency,
      'pending'
    );
    
    reimbursement_count := reimbursement_count + 1;
  END LOOP;
  
  RETURN reimbursement_count;
END;
$$ LANGUAGE plpgsql;
