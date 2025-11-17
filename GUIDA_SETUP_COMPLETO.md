# 🚀 Guida Setup Completo - Split Expenses

## Prerequisiti

- ✅ Windows con Docker Desktop installato
- ✅ JetBrains Rider (per backend .NET)
- ✅ Node.js 18+ installato
- ✅ PostgreSQL (tramite Docker)
- ✅ Telefono con Expo Go installato

---

## 📋 Passaggi Setup

### 1. Database PostgreSQL con Docker

#### Crea il database PostgreSQL

Apri PowerShell nella cartella `backend/`:

```powershell
cd backend
docker-compose -f docker-compose.db.yml up -d
```

Questo avvia PostgreSQL sulla porta **5432**.

#### Verifica che PostgreSQL sia attivo

```powershell
docker ps
```

Dovresti vedere un container con `postgres` in esecuzione.

#### Applica le migrations

**⚠️ IMPORTANTE**: Le migrations in `supabase/migrations/` usano `auth.uid()` che **NON funziona** in PostgreSQL locale
standalone.

Usa le migrations semplificate per sviluppo locale.

**Con DataGrip (consigliato):**

1. Connettiti al database:
    - Host: `localhost`
    - Port: `5432`
    - Database: `split_expenses`
    - User: `postgres`
    - Password: `postgres`

2. Esegui in ordine i file SQL in `backend/migrations/`:
    - Apri `001_initial_schema.sql`
    - Clicca **Execute** (Ctrl+Enter)
    - Apri `002_stored_procedures.sql`
    - Clicca **Execute** (Ctrl+Enter)
    - Apri `003_roles_and_member_split.sql`
    - Clicca **Execute** (Ctrl+Enter)
    - Apri `004_member_display_name_and_expense_fix.sql`
    - Clicca **Execute** (Ctrl+Enter)
    - Apri `005_expense_date_column.sql`
    - Clicca **Execute** (Ctrl+Enter)

**Con psql (CLI):**

```powershell
cd backend/migrations
docker exec -i splitexpenses-postgres psql -U postgres -d split_expenses < 001_initial_schema.sql
docker exec -i splitexpenses-postgres psql -U postgres -d split_expenses < 002_stored_procedures.sql
docker exec -i splitexpenses-postgres psql -U postgres -d split_expenses < 003_roles_and_member_split.sql
docker exec -i splitexpenses-postgres psql -U postgres -d split_expenses < 004_member_display_name_and_expense_fix.sql
docker exec -i splitexpenses-postgres psql -U postgres -d split_expenses < 005_expense_date_column.sql
```

> 💡 **Importante**: la migrazione `003` abilita il campo `split_percentage` (necessario per modificare i membri) e la
`005` rinomina il campo `expense_date` evitando l'errore 500 in fase di creazione di una spesa. Assicurati di applicarle
> entrambe.

**Verifica che funzioni:**

```postgresql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Dovresti vedere 11 tabelle (users, lists, expenses, ecc.)

---

### 2. Backend API (.NET) in Debug con Rider

#### Configura appsettings.json

Il file `backend/SplitExpenses.Api/appsettings.json` punta già al PostgreSQL locale avviato tramite Docker:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=split_expenses;Username=postgres;Password=postgres"
  }
}
```

**Non serve modificarlo**, a meno che tu non abbia cambiato porta, database o credenziali nel `docker-compose.db.yml`.

#### Restore pacchetti NuGet

Il pacchetto BCrypt.Net è già nel file `.csproj`.

#### Avvia in Debug su Rider

1. Apri `backend/SplitExpenses.Api.sln` con **Rider**
2. Clicca destro sul progetto → **Restore NuGet Packages** (se necessario)
3. Clicca su **Run** (▶️) o **Debug** (🐞)
4. Il backend si avvia su **http://0.0.0.0:5000**

#### Verifica che funzioni

Apri il browser su:

```
http://localhost:5000/health
```

Dovresti vedere:

```json
{
  "status": "Healthy",
  "timestamp": "2025-10-26T..."
}
```

---

### 3. App Mobile (React Native + Expo)

#### Trova il tuo IP locale

**Windows:**

```powershell
ipconfig
```

Cerca **"Indirizzo IPv4"** della tua rete WiFi (es: `192.168.1.56`)

#### Configura .env

Crea/modifica `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.56:5000/api
```

⚠️ **IMPORTANTE**: Sostituisci `192.168.1.56` con il TUO IP locale!

#### Installa dipendenze e avvia

```powershell
cd mobile
npm install
npm start
```

Vedrai un QR code nel terminale.

#### Sul telefono

1. Apri **Expo Go**
2. Scansiona il **QR code**
3. Aspetta che l'app si carichi

#### Condividere l'invito via WhatsApp

- Nella schermata **Dettaglio lista** tocca l'icona di condivisione (in alto a destra) per generare un messaggio
  WhatsApp con un link cliccabile `https://splitexpenses.app/accept/<CODICE>` e con il deep-link
  `splitexpenses://accept/<CODICE>` per l'apertura diretta dell'app.
- Chi riceve il messaggio può toccare il link HTTPS per aprire l'app (o il browser, se l'app non è installata) e
  accettare l'invito automaticamente; in alternativa può copiare il codice dal testo.
- Fino a quando un membro non accetta l'invito rimarrà con il **pallino giallo** in elenco: significa che è ancora in
  stato "In attesa".

---

### 4. Generare un APK di test (deploy manuale)

Quando vuoi condividere rapidamente l'app senza passare dagli store puoi creare un `.apk` firmato tramite **EAS Build**.

1. Vai nella cartella del progetto mobile: `cd "Shared Expense Management App/mobile"`.
2. Installa l'ultima versione della CLI ed effettua il login:

   ```bash
   npm install -g eas-cli
   eas login
   ```

3. In `app.json` assicurati che in `extra.eas.projectId` ci sia il valore valido `c7007c74-2472-41be-b3e3-9c0eadfb4f43`.
4. Se necessario inizializza il progetto Expo con `eas init`.
5. Crea (o aggiorna) `eas.json` con il profilo che forza la generazione dell'APK:

   ```json
   {
     "build": {
       "production": {
         "android": { "buildType": "apk" }
       }
     }
   }
   ```

6. Avvia la build cloud: `eas build -p android --profile production`.
7. Quando richiesto rispondi **yes** alla domanda "Generate a new Android Keystore?" (EAS la conserverà per le build
   successive).
8. Al termine della build, EAS mostra l'URL per scaricare l'APK (`https://expo.dev/artifacts/eas/XXXXX.apk`).
   Condividilo con i tester e installa manualmente abilitando le origini sconosciute.

---

## 🔐 Primo Utilizzo

### Registrazione

1. Apri l'app sul telefono
2. Clicca **"Don't have an account? Sign Up"**
3. Inserisci:
    - Email: `test@example.com`
    - Password: `password123`
4. Clicca **"Sign Up"**
5. Se vedi la home ✅ **FUNZIONA!**

### Crea Prima Lista

1. Clicca **"Crea Lista"** (o pulsante +)
2. Inserisci nome: `Vacanza Roma`
3. Salva
4. La lista appare nella home ✅

---

## 🗂️ Struttura Dati Persistenti

### Database PostgreSQL (Docker)

I dati sono salvati in PostgreSQL tramite Docker. Per vederli:

#### Con DataGrip

1. **File → New → Data Source → PostgreSQL**
2. Configura:
    - Host: `localhost`
    - Port: `5432`
    - Database: `split_expenses`
    - User: `postgres`
    - Password: `postgres`
3. **Test Connection** → **OK**

Ora puoi vedere tutte le tabelle:

- `users` - Utenti registrati
- `lists` - Liste spese
- `list_members` - Membri delle liste
- `expenses` - Spese
- `expense_splits` - Divisione spese
- `reimbursements` - Rimborsi calcolati
- `refresh_tokens` - Token per auth

#### Con Docker Volume

I dati sono persistiti nel volume Docker:

```powershell
docker volume ls
```

Cerca il volume tipo `backend_postgres_data`.

**Per backup:**

```powershell
docker exec -t backend-postgres-1 pg_dump -U postgres split_expenses > backup.sql
```

**Per restore:**

```powershell
docker exec -i backend-postgres-1 psql -U postgres split_expenses < backup.sql
```

---

## 🔧 Workflow Sviluppo

### Modifica Backend (Rider)

1. Modifica codice in `backend/SplitExpenses.Api/`
2. Salva (Ctrl+S)
3. Rider ricompila automaticamente
4. Riavvia debug se necessario

### Modifica Mobile (WebStorm/VSCode)

1. Modifica codice in `mobile/src/`
2. Salva (Ctrl+S)
3. Expo reloada automaticamente l'app
4. Se non reloada: scuoti il telefono → **Reload**

### Testa API con Swagger

Quando il backend è in esecuzione, vai su:

```
http://localhost:5000/swagger
```

Puoi testare tutti gli endpoint:

- `POST /api/auth/register` - Registrazione
- `POST /api/auth/login` - Login
- `GET /api/lists` - Lista liste (con token JWT)
- `POST /api/lists` - Crea lista

---

## ⚠️ Problemi Comuni

### Backend non raggiungibile da telefono

**Problema:** `Network error` nell'app mobile

**Soluzione:**

1. Verifica IP corretto nel `.env`
2. Backend DEVE ascoltare su `0.0.0.0:5000` (non `localhost`)
3. Firewall Windows: consenti porta 5000
4. Telefono e PC sulla STESSA rete WiFi

### Database connection error

**Problema:** Backend dice "Cannot connect to database"

**Soluzione:**

1. Assicurati che il container PostgreSQL sia attivo (`docker ps`).
2. Controlla che la connection string in `backend/SplitExpenses.Api/appsettings.json` punti a `localhost:5432` con
   utente/password corretti.
3. Se usi porte diverse, aggiorna sia `docker-compose.db.yml` sia `appsettings.json`.

### Migration non applicate

**Problema:** Errori "table does not exist" in DataGrip

**Soluzione:**
Esegui le migrations in `backend/migrations/` (NON quelle in `supabase/migrations/` che hanno RLS incompatibile con
PostgreSQL locale).

### Errore "Cannot resolve symbol auth"

**Problema:** Le migrations hanno `auth.uid()` che non esiste in PostgreSQL

**Soluzione:**
Usa le migrations in `backend/migrations/` create appositamente per PostgreSQL locale.

### Token JWT non valido

**Problema:** 401 Unauthorized su tutte le chiamate

**Soluzione:**

1. Verifica che JWT secret sia uguale in:
    - `backend/appsettings.json` → `Jwt:Key`
2. Fai logout e re-login nell'app

---

## 📊 Monitoraggio

### Logs Backend (Rider)

Nella console di Rider vedi tutti i logs:

```
info: Microsoft.AspNetCore.Hosting.Diagnostics[1]
      Request starting HTTP/1.1 POST http://localhost:5000/api/auth/login
```

### Logs Mobile (Terminal)

Nel terminale dove hai fatto `npm start`:

```
LOG  Login error: Network Error
```

### Database Queries (DataGrip)

Puoi fare query SQL direttamente:

```postgresql
-- Vedi tutti gli utenti
SELECT *
FROM users;

-- Vedi tutte le liste
SELECT *
FROM lists;

-- Vedi spese con nome lista
SELECT e.*, l.name as list_name
FROM expenses e
         JOIN lists l ON e.list_id = l.id;
```

---

## 🎯 Test Completo End-to-End

1. ✅ **Database**: PostgreSQL attivo su Docker
2. ✅ **Backend**: Rider in debug, risponde su `/health`
3. ✅ **Mobile**: App caricata su telefono
4. ✅ **Registrazione**: Crea account con email/password
5. ✅ **Login**: Accedi con le stesse credenziali
6. ✅ **Lista**: Crea lista "Test"
7. ✅ **Database**: Vedi lista in DataGrip:
   ```postgresql
   SELECT * FROM lists WHERE name = 'Test';
   ```

Se tutti i passaggi funzionano ✅ **SETUP COMPLETO!**

---

## 🔄 Riavvio Ambiente

### Spegni tutto

```powershell
# Backend
Ctrl+C su Rider

# Database
cd backend
docker-compose down

# Mobile
Ctrl+C nel terminale
```

### Riavvia tutto

```powershell
# 1. Database
cd backend
docker-compose up -d

# 2. Backend (apri Rider e Run)

# 3. Mobile
cd mobile
npm start
```

---

## 📝 File Importanti

### Backend

- `Program.cs` - Configurazione app
- `Controllers/AuthController.cs` - Endpoint auth
- `Controllers/ListsController.cs` - Endpoint liste
- `Services/AuthService.cs` - Logica auth
- `appsettings.json` - Configurazione

### Mobile

- `App.tsx` - Entry point
- `src/screens/LoginScreen.tsx` - Schermata login
- `src/screens/ListsScreen.tsx` - Lista liste
- `src/services/auth.service.ts` - Chiamate auth
- `src/services/lists.service.ts` - Chiamate liste
- `src/store/auth.store.ts` - State auth

### Database

- `backend/migrations/*.sql` - Schema database PostgreSQL locale

---

## 🎉 Prossimi Passi

Ora che tutto funziona, puoi:

1. **Aggiungere spese**:
    - Crea endpoint in `ExpensesController.cs`
    - Aggiungi screen in `mobile/src/screens/`

2. **Inviti membri**:
    - Sistema `ListsController.AddMember`
    - QR code / link condivisione

3. **Calcolo rimborsi**:
    - Usa stored procedure `calculate_optimized_reimbursements`
    - Mostra chi deve a chi

4. **Notifiche push**:
    - Firebase Cloud Messaging
    - Notifica nuove spese/rimborsi

5. **Sincronizzazione offline**:
    - SQLite locale
    - Sync quando torna online

---

**Domande?** Consulta `TROUBLESHOOTING.md` o `ARCHITECTURE.md`