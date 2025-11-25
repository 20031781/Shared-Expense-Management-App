# Split Expenses - Gestione Spese Condivise

App mobile (iOS/Android) + Backend API per gestire spese condivise tra gruppi.

## 🚀 INIZIA QUI

**Vuoi provare l'app?** → Leggi **[GUIDA SETUP COMPLETO.md](docs/GUIDA_SETUP_COMPLETO.md)** (5 minuti)

## 📚 Documentazione

- **[GUIDA SETUP COMPLETO.md](docs/GUIDA_SETUP_COMPLETO.md)** - Setup rapido per test locale
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Come funziona il sistema

## 🏗️ Stack Tecnologico

**Backend:** ASP.NET Core 9.0 + PostgreSQL (Supabase) + Docker
**Mobile:** React Native + Expo + TypeScript
**Auth:** Google OAuth and JWT
**Database:** PostgreSQL self-hosted tramite Docker Compose

## ✨ Funzionalità

- ✅ Login con Google OAuth
- ✅ Creazione e gestione liste spese
- ✅ Aggiunta spese con foto scontrino
- ✅ Divisione automatica spese tra membri
- ✅ Riepilogo spese con filtri temporali e grafici
- ✅ Tab Insights con selezione lista, filtri temporali e grafici per lista e membro
- ✅ Menù a tendina negli Insights per scegliere velocemente le liste e riepilogo paganti migliorato
- ✅ Grafici dinamici (barre, torta, trend) con animazioni fluide e assi che evitano sovrapposizioni di etichette
- ✅ Tooltip persistenti su barre e trend con marker interattivo e asse euro ottimizzato
- ✅ Controllo della velocità delle animazioni (ora nelle Impostazioni) con transizioni più scattanti condivise negli
  Insights
- ✅ Selezione del pagatore e tracciamento della data di inserimento
- ✅ Modifica spese con data reale, metodo di pagamento e destinatari personalizzati
- ✅ Calcolo rimborsi ottimizzati
- ✅ Ripartizione spese integrata negli Insights con suggerimenti sui rimborsi
- ✅ Swipe-to-edit/delete direttamente nella lista spese, navigazione del dettaglio senza swipe e logout rapido dalle
  Impostazioni
- ✅ Selezione lista negli Insights stabilizzata con gestione sicura dei dati caricati
- ✅ Swipe per rinominare o eliminare le liste e blocco delle azioni di eliminazione alle sole spese create dall'utente
- ✅ Ruoli Admin/Validatore con approvazione delle spese prima della conferma
- ✅ Percentuali di ripartizione modificabili dagli amministratori in ogni momento con bilanciamento automatico del resto
- ✅ Notifiche push
- ✅ Preferenze notifiche granulari + endpoint di test
- ✅ Sincronizzazione offline
- ✅ App mobile iOS/Android
- ✅ Impostazioni multilingua (Italiano/Inglese)
- ✅ Tema chiaro/scuro/sistema configurabile dall'app mobile
- ✅ Onboarding guidato con checklist interattiva
- ✅ Dialoghi personalizzati coerenti con il tema per conferme, errori e successi
- ✅ Messaggi di errore di connessione localizzati e coerenti in tutte le schermate principali

## 🏗️ Struttura Progetto

```
project/
├── backend/                # ASP.NET Core API + Docker
│   ├── SplitExpenses.Api/
│   ├── docker-compose      # Docker Compose locale e NAS
│   └── migrations/         # SQL per PostgreSQL locale
├── docs/                   # Guide e approfondimenti
└── mobile/                 # React Native + Expo
    └── src/
```

## 📄 Licenza

Tutti i diritti riservati © 2025