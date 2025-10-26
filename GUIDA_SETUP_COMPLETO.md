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
docker-compose up -d
```

Questo avvia PostgreSQL sulla porta **5432**.

#### Verifica che PostgreSQL sia attivo

```powershell
docker ps
```

Dovresti vedere un container con `postgres` in esecuzione.

#### Applica le migrations

**Opzione A: Con Supabase CLI (consigliato)**

Se hai Supabase CLI:
```powershell
cd supabase
supabase db push
```

**Opzione B: Manualmente con DataGrip/pgAdmin**

1. Connettiti al database:
   - Host: `localhost`
   - Port: `5432`
   - Database: `split_expenses`
   - User: `postgres`
   - Password: `postgres` (vedi `docker-compose.yml`)

2. Esegui in ordine i file SQL in `supabase/migrations/`:
   - `20251010083149_001_initial_schema_tables.sql`
   - `20251010083215_002_row_level_security.sql`
   - `20251010083249_003_stored_procedures.sql`
   - `20251026000001_add_password_hash.sql` ← **IMPORTANTE: Aggiunge supporto password**

---

### 2. Backend API (.NET) in Debug con Rider

#### Configura appsettings.json

Apri `backend/SplitExpenses.Api/appsettings.json` e verifica:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=split_expenses;Username=postgres;Password=postgres"
  },
  "Jwt": {
    "Key": "questo_e_un_jwt_secret_molto_lungo_e_sicuro_di_almeno_32_caratteri",
    "Issuer": "SplitExpensesApi",
    "Audience": "SplitExpensesApp",
    "ExpiryMinutes": 60,
    "RefreshTokenExpiryDays": 30
  }
}
```

#### Aggiungi BCrypt.Net

Il backend usa BCrypt per hashare le password. Aggiungi il pacchetto NuGet:

```powershell
cd backend/SplitExpenses.Api
dotnet add package BCrypt.Net-Next
```

#### Avvia in Debug su Rider

1. Apri `backend/SplitExpenses.Api.sln` con **Rider**
2. Clicca su **Run** (▶️) o **Debug** (🐞)
3. Il backend si avvia su **http://0.0.0.0:5000**

#### Verifica che funzioni

Apri il browser su:
```
http://localhost:5000/health
```

Dovresti vedere:
```json
{"status":"Healthy","timestamp":"2025-10-26T..."}
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

**Problema:** Backend non si connette a PostgreSQL

**Soluzione:**
```powershell
# Verifica che PostgreSQL sia attivo
docker ps

# Se non è attivo, avvialo
cd backend
docker-compose up -d

# Verifica connection string in appsettings.json
```

### Migration non applicate

**Problema:** Errori "table does not exist"

**Soluzione:**
Esegui manualmente le migrations in `supabase/migrations/` con DataGrip.

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
```sql
-- Vedi tutti gli utenti
SELECT * FROM users;

-- Vedi tutte le liste
SELECT * FROM lists;

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
   ```sql
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
- `supabase/migrations/*.sql` - Schema database

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
