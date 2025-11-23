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

Usa le migrations semplificate per sviluppo locale.

**Con DataGrip (consigliato):**

1. Connettiti al database:
    - Host: `localhost`
    - Port: `5432`
    - Database: `split_expenses`
    - User: `postgres`
    - Password: `postgres`

2. Esegui in ordine i file SQL in `backend/migrations/`:
    - Apri `001_initial_schema.sql`.
      - Clicca **Execute** (Ctrl+Enter).
    - Apri `002_stored_procedures.sql`.
      - Clicca **Execute** (Ctrl+Enter).
    - Apri `003_roles_and_member_split.sql`.
      - Clicca **Execute** (Ctrl+Enter).
    - Apri `004_member_display_name_and_expense_fix.sql`.
      - Clicca **Execute** (Ctrl+Enter).
    - Apri `005_expense_date_column.sql`.
      - Clicca **Execute** (Ctrl+Enter).

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

Dovresti vedere 11 tabelle (users, lists, expenses, ecc.).

---

### 2. Backend API (.NET)

#### Configura appsettings.json

Il file [appsettings.json](../appsettings.json) punta già al PostgreSQL locale avviato tramite Docker:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=split_expenses;Username=postgres;Password=postgres"
  }
}
```

**Non serve modificarlo**, a meno che tu non abbia cambiato porta, database o credenziali nel `docker-compose.db.yml`.

#### Avvia in Debug su Rider

1. Apri `backend/SplitExpenses.Api.sln` con **Rider**.
2. Clicca su **Run** (▶️) o **Debug** (🐞), configurazione "Api".

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

### Docker

Creare immagine API:

```
docker compose build api
```

---

### 3. App Mobile (React Native + Expo)

#### Trova il tuo IP locale

**Windows:**

```powershell
ipconfig
```

Cerca **"Indirizzo IPv4"** della tua rete WiFi (es: `192.168.1.60`).

#### Configura .env

Crea/modifica `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.60:5000/api
```

⚠️ **IMPORTANTE**: Sostituisci `192.168.1.60` con il TUO IP locale!

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

#### Creare un *Development Build* (necessario per `expo-notifications`)

Con l'SDK 53 Expo ha rimosso dal client **Expo Go** il supporto alle notifiche push remote. Per testare correttamente
`expo-notifications` serve quindi un *development build* personalizzato (*Expo Dev Client*), che sfrutta il codice
nativo del
progetto.

# TODO finire di controllare la doc da questo punto in giù.

---

# TEMPORANEO

Registrazione manuale con token FCM:

```powershell
curl -X POST http://localhost:5000/api/auth/device-token `
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMWZmMDRlMC0yYTA0LTQ0NTYtYTIxMi03NzkwYWMwZTQxYTEiLCJlbWFpbCI6ImxvcmVuem9hcHBldGl0b0BnbWFpbC5jb20iLCJuYW1lIjoibG9yZW56b2FwcGV0aXRvIiwianRpIjoiYmQxNmFmYTMtYzFjOC00YmZkLThjZGUtOWU2YmM5ZTk4ZjkxIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvZW1haWxhZGRyZXNzIjoibG9yZW56b2FwcGV0aXRvQGdtYWlsLmNvbSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFkbWluIiwiZXhwIjoxNzYzNDE5MzI5LCJpc3MiOiJTcGxpdEV4cGVuc2VzQXBpIiwiYXVkIjoiU3BsaXRFeHBlbnNlc0FwcCJ9.vKhuQuqHUNNBss5H-3IQW6r83V6geq2YIJKUOkUALZw" `
-H "Content-Type: application/json" `
-d '{"token":"e_octOePRqelKUUU-lU-PY:APA91bGgig6zHDeUS09-Tu7KAHpxzAyOijVeMDu6CwhzfFMdhZKlsUj4podIXiJVuqKbzQgY3ZnxJBjLYSpCMRhC0QvmzUFcjFqYGwqgLMQOwLjIQAH8Tx8","platform":"android"}'
```

Nuova spesa:

```powershell
curl -X POST http://localhost:5000/api/notifications/test/new-expense/de04c8c7-1f4d-4d05-a0ca-a3dc9043d9c7 `
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMWZmMDRlMC0yYTA0LTQ0NTYtYTIxMi03NzkwYWMwZTQxYTEiLCJlbWFpbCI6ImxvcmVuem9hcHBldGl0b0BnbWFpbC5jb20iLCJuYW1lIjoibG9yZW56b2FwcGV0aXRvIiwianRpIjoiYmQxNmFmYTMtYzFjOC00YmZkLThjZGUtOWU2YmM5ZTk4ZjkxIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvZW1haWxhZGRyZXNzIjoibG9yZW56b2FwcGV0aXRvQGdtYWlsLmNvbSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFkbWluIiwiZXhwIjoxNzYzNDE5MzI5LCJpc3MiOiJTcGxpdEV4cGVuc2VzQXBpIiwiYXVkIjoiU3BsaXRFeHBlbnNlc0FwcCJ9.vKhuQuqHUNNBss5H-3IQW6r83V6geq2YIJKUOkUALZw"
```

Nuovo membro:

```powershell
curl -X POST http://localhost:5000/api/notifications/test/member-added/<LIST_ID>/<MEMBER_ID> `
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMWZmMDRlMC0yYTA0LTQ0NTYtYTIxMi03NzkwYWMwZTQxYTEiLCJlbWFpbCI6ImxvcmVuem9hcHBldGl0b0BnbWFpbC5jb20iLCJuYW1lIjoibG9yZW56b2FwcGV0aXRvIiwianRpIjoiYmQxNmFmYTMtYzFjOC00YmZkLThjZGUtOWU2YmM5ZTk4ZjkxIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvZW1haWxhZGRyZXNzIjoibG9yZW56b2FwcGV0aXRvQGdtYWlsLmNvbSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFkbWluIiwiZXhwIjoxNzYzNDE5MzI5LCJpc3MiOiJTcGxpdEV4cGVuc2VzQXBpIiwiYXVkIjoiU3BsaXRFeHBlbnNlc0FwcCJ9.vKhuQuqHUNNBss5H-3IQW6r83V6geq2YIJKUOkUALZw"
```

---

1. Installa le dipendenze native e il Dev Client (una sola volta):

   ```bash
   cd mobile
   npx expo install expo-dev-client
   ```

2. Collega il dispositivo Android via USB (o avvia un emulatore) e genera il build di sviluppo:

   ```bash
   npx expo run:android
   ```

   Per iOS (serve Xcode su macOS):

   ```bash
   npx expo run:ios --configuration Debug
   ```

3. Una volta completato il build il dispositivo installerà l'app **Split Expenses Dev**. Da ora in poi, quando esegui `npm
   start`, scegli "a" o "i" per aprire il *dev client* invece di Expo Go: il runtime userà il codice nativo compilato e
   le
   notifiche push funzioneranno senza gli avvisi bloccanti.

4. Se vuoi condividere il dev client con altri collaboratori senza cavo, puoi anche generare un pacchetto dedicato via
   EAS:

   ```bash
   npx eas build -p android --profile development
   ```

   (Su iOS usa `--platform ios`). Il build risultante può essere installato con `adb install` (Android) o TestFlight (
   iOS).

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

**Domande?** Consulta `TROUBLESHOOTING.md` o `ARCHITECTURE.md`