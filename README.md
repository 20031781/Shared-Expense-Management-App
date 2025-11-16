# Split Expenses - Gestione Spese Condivise

App mobile (iOS/Android) + Backend API per gestire spese condivise tra gruppi.

## 🚀 INIZIA QUI

**Vuoi provare l'app?** → Leggi **[SETUP_LOCALE.md](SETUP_LOCALE.md)** (5 minuti)

## 📚 Documentazione

- **[SETUP_LOCALE.md](SETUP_LOCALE.md)** - Setup rapido per test locale
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Come funziona il sistema
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Problemi comuni

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
- ✅ Calcolo rimborsi ottimizzati
- ✅ Notifiche push
- ✅ Sincronizzazione offline
- ✅ App mobile iOS/Android

## 🚀 Quick Start

Vedi **[SETUP_LOCALE.md](SETUP_LOCALE.md)** per istruzioni dettagliate.

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
