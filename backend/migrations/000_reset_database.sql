/*
  # Reset Database - Solo per Sviluppo Locale

  ⚠️ ATTENZIONE: Questo script CANCELLA TUTTI I DATI!
  Usare solo per ripulire il database di sviluppo.

  NON USARE MAI IN PRODUZIONE!
*/

-- Drop tutte le tabelle (in ordine per evitare errori di foreign key)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS sync_queue CASCADE;
DROP TABLE IF EXISTS expense_splits CASCADE;
DROP TABLE IF EXISTS expense_validations CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS reimbursements CASCADE;
DROP TABLE IF EXISTS list_members CASCADE;
DROP TABLE IF EXISTS lists CASCADE;
DROP TABLE IF EXISTS device_tokens CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop funzioni
DROP FUNCTION IF EXISTS calculate_optimized_reimbursements(uuid);
DROP FUNCTION IF EXISTS generate_invite_code();
DROP FUNCTION IF EXISTS set_list_invite_code();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop estensioni (opzionale, probabilmente già presenti)
-- DROP EXTENSION IF EXISTS "uuid-ossp";
-- DROP EXTENSION IF EXISTS "pgcrypto";

-- Database pulito! Ora applica:
-- 1. 001_initial_schema.sql
-- 2. 002_stored_procedures.sql
