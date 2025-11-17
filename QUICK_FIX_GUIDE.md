# 🚀 Guida Rapida - Fix Errori

## ✅ Problemi Risolti

### 1. ✅ Routines Duplicate nel DB Locale

**Non danno fastidio**, puoi ignorarle. Sono dalla vecchia migration Supabase.

Se vuoi pulire tutto:

```sql
-- In DataGrip esegui:
-- backend/migrations/000_reset_database.sql
-- Poi riapplica 001 e 002
```

---

### 2. ✅ Errore Navigation "JoinList"

**Risolto** - Il pulsante "Join List" ora mostra un alert "Coming Soon" invece di navigare.

L'errore non apparirà più! ✅

---

### 3. ✅ Errore 401 Unauthorized

**Causa:** Quando fai signup su Supabase, l'utente viene creato in `auth.users` ma NON in `public.users`.

**Soluzione:** Applica la migration che sincronizza automaticamente i due:

#### Su Supabase Dashboard (OBBLIGATORIO per l'app mobile)

1. Vai su **Supabase Dashboard** → **SQL Editor**
2. Apri il file `supabase/migrations/20251027000001_auth_users_sync.sql`
3. Copia tutto il contenuto
4. Incolla nel SQL Editor
5. Clicca **Run** ▶️

Questo crea un trigger che:

- Quando fai signup, crea automaticamente l'utente in `public.users`
- Sincronizza email e nome
- Abilita RLS per sicurezza

---

## 🧪 Come Testare Ora

### Step 1: Applica Migration su Supabase

**IMPORTANTE**: Devi farlo su **Supabase Dashboard**, non su PostgreSQL locale!

1. Vai su https://supabase.com/dashboard
2. Apri il tuo progetto
3. SQL Editor → Nuova Query
4. Copia il contenuto di `supabase/migrations/20251027000001_auth_users_sync.sql`
5. Run ▶️

### Step 2: Testa l'App Mobile

```powershell
cd mobile
npm start
```

### Step 3: Crea Account

1. Apri app su telefono
2. Clicca **"Don't have an account? Sign Up"**
3. Inserisci:
    - Email: `test@example.com`
    - Password: `password123`
4. Clicca **Sign Up**
5. Dovresti vedere il messaggio **"Account created successfully!"** ✅

### Step 4: Verifica Database

Su Supabase Dashboard → Table Editor:

```sql
-- Dovresti vedere il tuo utente
SELECT * FROM public.users;

-- E anche in auth.users
SELECT * FROM auth.users;
```

### Step 5: Crea Lista

1. Clicca **"+"** (FAB button in basso a destra)
2. Inserisci nome: `Vacanza 2024`
3. Salva
4. La lista appare! ✅ **Nessun 401!**

---

## 🔍 Debug Errori

### Se ottieni ancora 401:

**Verifica che la migration sia stata applicata:**

```sql
-- Su Supabase Dashboard SQL Editor
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

Dovresti vedere 1 riga. Se non c'è, la migration non è stata applicata.

### Se il trigger non funziona:

**Cancella utente vecchio e ricrealo:**

```sql
-- Su Supabase Dashboard
-- ATTENZIONE: Cancella tutti i dati di test!
DELETE FROM auth.users WHERE email = 'test@example.com';
DELETE FROM public.users WHERE email = 'test@example.com';
```

Poi rifai signup nell'app.

---

## 📝 Riepilogo File Modificati

- ✅ `mobile/src/screens/ListsScreen.tsx` - Rimosso navigation a JoinList
- ✅ `supabase/migrations/20251027000001_auth_users_sync.sql` - Nuovo trigger sync
- ✅ `backend/migrations/000_reset_database.sql` - Script reset DB locale

---

## ⚠️ IMPORTANTE

**NON cancellare `/supabase/`!**

- `backend/migrations/` → PostgreSQL locale (sviluppo, no RLS)
- `supabase/migrations/` → Supabase hosted (produzione, con RLS)

L'app mobile usa **Supabase hosted**, quindi serve `supabase/migrations/`!

---

## ✅ Checklist Finale

- [ ] Migration `20251027000001_auth_users_sync.sql` applicata su Supabase Dashboard
- [ ] Trigger `on_auth_user_created` presente nel database
- [ ] Account creato con signup nell'app
- [ ] Utente presente in `public.users`
- [ ] Creazione lista funziona senza 401

**Se tutti i check sono OK → TUTTO FUNZIONA!** 🎉
