# 🚀 Guida Setup Completo

Ambiente locale per API .NET + app Expo usando PostgreSQL in Docker.

## Prerequisiti

- Docker Desktop o Docker Engine
- .NET 9 SDK
- Node.js 18+ e npm
- Expo Go sul telefono (o un emulatore) per i test rapidi

## 1) Database PostgreSQL con Docker

```bash
cd backend
docker compose -f docker-compose.db.yml up -d
```

- Il database è esposto su `localhost:5432` con utente/password `postgres`.
- Applica le migration in **ordine** dalla cartella `backend/migrations` (usa DataGrip oppure psql):

```bash
cd backend/migrations
# Esempio con il container predefinito
docker exec -i splitexpenses-postgres psql -U postgres -d split_expenses < 001_initial_schema.sql
docker exec -i splitexpenses-postgres psql -U postgres -d split_expenses < 002_stored_procedures.sql
docker exec -i splitexpenses-postgres psql -U postgres -d split_expenses < 003_roles_and_member_split.sql
docker exec -i splitexpenses-postgres psql -U postgres -d split_expenses < 004_member_display_name_and_expense_fix.sql
docker exec -i splitexpenses-postgres psql -U postgres -d split_expenses < 005_expense_date_column.sql
docker exec -i splitexpenses-postgres psql -U postgres -d split_expenses < 006_expense_payment_and_beneficiaries.sql
```

Verifica:

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
```

## 2) Backend API (.NET 9)

1. Copia le variabili d'ambiente di esempio:
   ```bash
   cp docs/.env.example.api backend/.env
   ```
2. La connection string di default (`backend/SplitExpenses.Api/appsettings.json`) punta già a `localhost:5432`.
3. Avvia l'API:
   ```bash
   cd backend/SplitExpenses.Api
   dotnet run
   ```
4. Controlla la salute su `http://localhost:5000/health` e gli endpoint su `http://localhost:5000/swagger`.

## 3) App mobile (React Native + Expo)

1. Crea il file `.env`:
   ```bash
   cp docs/.env.example.mobile mobile/.env
   ```
   Imposta `EXPO_PUBLIC_API_URL` con l'IP della tua macchina raggiungibile dal telefono (es.
   `http://192.168.1.60:5000/api`).
2. Installa e avvia Expo:
   ```bash
   cd mobile
   npm install
   npm start
   ```
3. Scansiona il QR code con Expo Go oppure premi `a`/`i` per aprire l'emulatore.
4. Per testare le notifiche push usa un **development build** (`npx expo run:android` o
   `npx expo run:ios --configuration Debug`).

## 4) Test manuali rapidi

- **Login Google**: il backend supporta l'exchange dell'ID token, ma la UI mobile attuale non espone la schermata di
  login.
- **Liste**: `POST /api/lists` con membri e percentuali; verifica `GET /api/lists/{id}/members`.
- **Spese**: `POST /api/expenses` con metodo di pagamento e beneficiari; controlla gli split e i rimborsi calcolati.
- **Notifiche**: `POST /api/notifications/test/*` (richiede token valido) per simulare nuove spese o inviti.

## 5) Troubleshooting veloce

- **Database vuoto o incoerente**: esegui `000_reset_database.sql` e riapplica le migration in ordine.
- **401 su ogni endpoint**: controlla la chiave JWT in `.env` e in `appsettings.json`, poi rifai login.
- **API non raggiungibile da telefono**: usa l'IP LAN nel `.env` mobile e assicurati che l'API ascolti su
  `0.0.0.0:5000`.
- **Errori di schema (es. colonne mancanti)**: usa esclusivamente le migration in `backend/migrations/`, non quelle
  Supabase.
