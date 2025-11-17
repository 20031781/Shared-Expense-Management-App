# Split Expenses - Gestione Spese Condivise

App mobile (iOS/Android) + Backend API per gestire spese condivise tra gruppi.

## 🚀 INIZIA QUI

**Vuoi provare l'app?** → Leggi **[SETUP_LOCALE.md](GUIDA_SETUP_COMPLETO.md)** (5 minuti)

## 📚 Documentazione

- **[SETUP_LOCALE.md](GUIDA_SETUP_COMPLETO.md)** - Setup rapido per test locale
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Come funziona il sistema
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Problemi comuni
- **[NOTIFICATIONS.md](docs/NOTIFICATIONS.md)** - Preferenze e test delle notifiche push

## 🏗️ Stack Tecnologico

**Backend:** ASP.NET Core 8.0 + PostgreSQL (Docker)
**Mobile:** React Native + Expo + TypeScript
**Auth:** Google OAuth + JWT
**Database:** PostgreSQL self-hosted tramite Docker Compose

## ✨ Funzionalità

- ✅ Login con Google OAuth
- ✅ Creazione e gestione liste spese
- ✅ Aggiunta spese con foto scontrino
- ✅ Divisione automatica spese tra membri
- ✅ Riepilogo spese con filtri temporali e grafici
- ✅ Tab Insights con selezione lista, filtri temporali e grafici per lista e membro
- ✅ Menù a tendina negli Insights per scegliere velocemente le liste e riepilogo paganti migliorato
- ✅ Grafici dinamici (barre, torta, trend) per confrontare rapidamente i membri
- ✅ Selezione del pagatore e tracciamento della data di inserimento
- ✅ Modifica spese con data reale, metodo di pagamento e destinatari personalizzati
- ✅ Calcolo rimborsi ottimizzati
- ✅ Ripartizione spese integrata negli Insights con suggerimenti sui rimborsi
- ✅ Swipe-to-edit/delete, schermata di dettaglio spesa con metodo di pagamento/beneficiari e logout rapido dalle
  Impostazioni
- ✅ Ruoli Admin/Validatore con approvazione delle spese prima della conferma
- ✅ Percentuali di ripartizione modificabili dagli amministratori in ogni momento con bilanciamento automatico del resto
- ✅ Notifiche push
- ✅ Preferenze notifiche granulari + endpoint di test
- ✅ Sincronizzazione offline
- ✅ App mobile iOS/Android
- ✅ Impostazioni multilingua (Italiano/Inglese)
- ✅ Tema chiaro/scuro/sistema configurabile dall'app mobile
- ✅ Onboarding guidato con checklist interattiva
- ✅ Avvisi in-app se Expo Go non può registrare notifiche push, con guida rapida per creare una development build

## 🚀 Quick Start

Vedi **[SETUP_LOCALE.md](GUIDA_SETUP_COMPLETO.md)** per istruzioni dettagliate.

```bash
# Backend
cd backend
docker-compose up -d

# Mobile
cd mobile
npm install
npm start
# Scansiona QR con Expo Go
```

### ⚠️ Notifiche push & Expo Go

Con SDK 53+ Expo Go non invia più notifiche remote. Se vuoi testarle devi creare una **development build** o usare un
dev client personalizzato (`eas build --profile development`). L'app mostra un banner in Impostazioni → Notifiche con
il link diretto alla guida aggiornata (**[docs/NOTIFICATIONS.md](docs/NOTIFICATIONS.md)**).

## 🧹 Pulizia delle dipendenze (`node_modules`)

Per mantenere il repository leggero, **non committare mai le cartelle `node_modules`** (già escluse via `.gitignore`).
Se hai bisogno di rimuoverle manualmente:

```bash
# dalla root del progetto
rm -Recurse -Force "mobile/node_modules"
```

Successivamente reinstalla i pacchetti solo quando necessario:

```bash
cd mobile
npm install
```

## 🏗️ Struttura Progetto

```
project/
├── backend/              # ASP.NET Core API + Docker
│   ├── SplitExpenses.Api/
│   └── migrations/       # SQL per PostgreSQL locale
├── mobile/               # React Native + Expo
│   └── src/
├── docs/                # Guide e approfondimenti
└── SETUP_LOCALE.md      # ← INIZIA QUI
```

## 📄 Licenza

Tutti i diritti riservati © 2025