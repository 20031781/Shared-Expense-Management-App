# Split Expenses

Suite completa (API .NET + app mobile React Native) per gestire spese condivise in gruppi con inviti, validazione e rimborsi ottimizzati.

## 🚀 Avvio rapido

1. Clona il repo e prepara gli env dalla root:
   ```bash
   cp docs/.env.example.api backend/.env
   cp docs/.env.example.mobile mobile/.env
   ```
2. Avvia PostgreSQL locale:
   ```bash
   cd backend
   docker compose -f docker-compose.db.yml up -d
   ```
3. Applica le migration SQL in `backend/migrations/` (vedi [GUIDA_SETUP_COMPLETO.md](docs/GUIDA_SETUP_COMPLETO.md)).
4. Avvia l'API:
   ```bash
   cd backend/SplitExpenses.Api
   dotnet run
   ```
5. Avvia l'app mobile:
   ```bash
   cd mobile
   npm install
   npm start
   ```

## 📚 Documentazione

- [GUIDA_SETUP_COMPLETO.md](docs/GUIDA_SETUP_COMPLETO.md): setup locale end-to-end per API e mobile.
- [ARCHITECTURE.md](docs/ARCHITECTURE.md): panoramica di flussi, moduli e schema dati.
- [README_MOBILE.md](docs/README_MOBILE.md): istruzioni mirate per il client Expo.
- [TRAEFIK_SUMMARY.md](docs/TRAEFIK_SUMMARY.md): note di pubblicazione su NAS/Traefik.

## 🏗️ Stack tecnologico

- **Backend:** ASP.NET Core 9, Dapper + Npgsql, JWT, Swagger, notifiche FCM.
- **Database:** PostgreSQL via Docker Compose con migration SQL dedicate.
- **Mobile:** React Native + Expo SDK 54, TypeScript, React Navigation, Zustand, React Query, Victory charts.
- **Auth:** backend predisposto per Google OAuth/refresh token; la UI mobile non espone ancora il login Google.

## ✨ Funzionalità principali

- Onboarding utente (senza login Google in app) e profilo multilingua (IT/EN) con tema chiaro/scuro.
- Gestione liste con inviti, ruoli Admin/Validatore e percentuali di ripartizione editabili.
- CRUD spese con foto scontrino, data reale, metodo di pagamento e destinatari personalizzati.
- Divisione spese per-lista o per-singola spesa (importi o "parti") con ripartizione personalizzabile tipo Tricount.
- Validazione collaborativa delle spese e calcolo rimborsi ottimizzati con suggerimenti.
- Azioni di modifica/cancellazione spese limitate agli amministratori della lista per maggiore sicurezza.
- Dashboard Insights con grafici (barre/torta/trend) e filtri temporali per lista/membro.
- Notifiche push configurabili per nuove spese, rimborsi e inviti; supporto test via endpoint dedicati.
- Sincronizzazione resiliente con cache locale (SQLite/AsyncStorage) e gestione offline.

## 🗂️ Struttura del repository

```
backend/    # API ASP.NET Core, docker-compose* e migration SQL
docs/       # Documentazione e template .env
mobile/     # App Expo (TypeScript) con src/ componentizzata
```

## 📄 Licenza

Tutti i diritti riservati © 2025
