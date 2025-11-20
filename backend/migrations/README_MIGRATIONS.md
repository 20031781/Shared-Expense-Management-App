# 🗄️ Migrations Database - PostgreSQL Locale

## ⚠️ IMPORTANTE

Queste migrations sono per **PostgreSQL standalone locale** (Docker).

**NON includono Row Level Security (RLS)** perché `auth.uid()` richiede Supabase Auth che non è disponibile in PostgreSQL locale.

Per produzione, usa **Supabase hosted** con le migrations complete in `../supabase/migrations/`.

---

## 📋 Migrations Disponibili

0. **000_reset_database.sql** - ⚠️ RESET completo (cancella tutto!)
1. **001_initial_schema.sql** - Schema completo (tabelle, indici, trigger)
2. **002_stored_procedures.sql** - Funzioni per calcolo rimborsi
3. **003_roles_and_member_split.sql** - Flag Admin utente + percentuali membri
4. **004_member_display_name_and_expense_fix.sql** - Display name membri + colonne mancanti per le spese
5. **005_expense_date_column.sql** - Allinea il nome della colonna `expense_date` con l'API
6. **006_expense_payment_and_beneficiaries.sql** - Tipologia pagamento e destinatari collegati a ogni spesa

---

## 🚀 Come Applicare le Migrations

### ⚠️ Se hai già migrations vecchie

Se ottieni errori tipo:
- `ERROR: column "date" does not exist`
- `ERROR: column "expense_date" already exists`

Significa che hai applicato le vecchie migrations da `supabase/migrations/`.

**Devi resettare il database:**

1. **Apri** `000_reset_database.sql` in DataGrip
2. **Execute** (Ctrl+Enter) - Questo CANCELLA TUTTI I DATI!
3. Verifica: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
4. Dovresti vedere **0 tabelle** ✅

### Setup Pulito (Database Nuovo)

Con DataGrip (consigliato):

1. **Connetti al database**:
   - Host: `localhost`
   - Port: `5432`
   - Database: `split_expenses`
   - User: `postgres`
   - Password: `postgres`

2. **Esegui in ordine**:
   - Apri `001_initial_schema.sql`
   - Clicca **Execute** (Ctrl+Enter)
   - Apri `002_stored_procedures.sql`
   - Clicca **Execute** (Ctrl+Enter)
   - Apri `003_roles_and_member_split.sql`
   - Clicca **Execute** (Ctrl+Enter)
   - Apri `004_member_display_name_and_expense_fix.sql`
   - Clicca **Execute** (Ctrl+Enter)

### Con psql (CLI)

```bash
docker exec -i splitexpenses-postgres psql -U postgres -d split_expenses < 001_initial_schema.sql
docker exec -i splitexpenses-postgres psql -U postgres -d split_expenses < 002_stored_procedures.sql
docker exec -i splitexpenses-postgres psql -U postgres -d split_expenses < 003_roles_and_member_split.sql
docker exec -i splitexpenses-postgres psql -U postgres -d split_expenses < 004_member_display_name_and_expense_fix.sql
```

---

## ✅ Verifica Migrations

```sql
-- Vedi tutte le tabelle
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Dovrebbe mostrare:
-- device_tokens
-- expense_splits
-- expense_validations
-- expenses
-- list_members
-- lists
-- notifications
-- refresh_tokens
-- reimbursements
-- sync_queue
-- users
```

---

## 🔐 Sicurezza in Sviluppo Locale

Senza RLS, **tutti i controlli di sicurezza sono nell'API C#**.

Verifica che ogni endpoint controlli:
- JWT token valido
- User ID dal token
- Appartenenza alla lista richiesta

**Non esporre mai il database PostgreSQL su internet senza RLS!**

---

## 🚀 Deploy su Produzione (Supabase)

Quando vai in produzione, usa `../supabase/migrations/` che include:
- ✅ Row Level Security completo
- ✅ Policy restrittive
- ✅ Integrazione con Supabase Auth

Applica con Supabase CLI:
```bash
supabase db push
```

Oppure dalla Supabase Dashboard → SQL Editor.
