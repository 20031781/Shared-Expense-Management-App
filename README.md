# Split Expenses - Applicazione Gestione Spese Condivise

Applicazione mobile multipiattaforma (iOS/Android) con backend API per la gestione di spese condivise tra gruppi di utenti. Include autenticazione Google OAuth, validazione spese, calcolo automatico rimborsi ottimizzati e sincronizzazione offline.

---

## 📖 Documentazione

### ⚡ Inizia Qui
- **[START_HERE.md](START_HERE.md)** ← **LEGGI QUESTO PER PRIMO!** 🚀
- **[FULLSTACK_QUICKSTART.md](FULLSTACK_QUICKSTART.md)** - Guida completa 10 minuti

### 📚 Documentazione Tecnica
- [📱 Mobile App](mobile/README.md) - React Native + Expo (✅ COMPLETE!)
- [🏗️ Architecture](ARCHITECTURE.md) - Design e architettura
- [📊 Project Summary](PROJECT_SUMMARY.md) - Statistiche e overview
- [🐛 Troubleshooting](TROUBLESHOOTING.md) - Risoluzione problemi

### 📦 Archive
- [docs/archive/](docs/archive/) - Documentazione vecchia archiviata

---

## 🏗️ Architettura

### Stack Tecnologico

**Backend:**
- ASP.NET Core 8.0 Web API
- PostgreSQL (via Supabase)
- JWT Authentication
- Firebase Cloud Messaging (notifiche push)
- Docker & Docker Compose

**Mobile:** ✅ COMPLETE!
- React Native + Expo
- TypeScript
- Google OAuth Sign-In
- Offline-capable architecture
- iOS + Android support

### Struttura Progetto

```
project/
├── backend/                    # Backend API ASP.NET Core
│   ├── SplitExpenses.Api/
│   │   ├── Controllers/        # REST API endpoints
│   │   ├── Services/           # Business logic
│   │   ├── Repositories/       # Data access layer
│   │   ├── Models/             # Domain models
│   │   └── Program.cs          # App configuration
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .env.example
├── mobile/                     # App mobile .NET MAUI (TODO)
└── README.md
```

## 📋 Funzionalità Principali

### ✅ Implementato (Backend)

1. **Autenticazione**
   - Login con Google OAuth2
   - JWT access token e refresh token
   - Gestione sessioni sicure
   - Registrazione device token per notifiche push

2. **Gestione Profilo**
   - Dati utente (nome, email, foto profilo)
   - Preferenze notifiche
   - Valuta predefinita

3. **Liste di Spese**
   - Creazione liste con amministratore
   - Inviti membri via email
   - Codice invito unico per condivisione
   - Percentuali divisione spese personalizzabili
   - Assegnazione ruolo "Validatore"

4. **Spese**
   - Workflow stati: Draft → Submitted → Validated/Rejected
   - Campi: titolo, importo, data, note, scontrino
   - Divisione automatica tra membri secondo percentuali
   - Sistema validazione multi-validatore
   - Query per periodo e lista

5. **Rimborsi**
   - Calcolo automatico rimborsi ottimizzati
   - Algoritmo minimizzazione transazioni (greedy)
   - Stati: Pending → Completed
   - Notifiche per rimborsi

6. **Sincronizzazione Offline**
   - Queue operazioni offline
   - Strategia last-write-wins con timestamp server
   - Gestione conflitti e riconciliazione

7. **Notifiche Push**
   - Nuova spesa inserita
   - Richiesta validazione
   - Esito validazione
   - Nuovo rimborso

### 🚧 Da Implementare

- **App Mobile .NET MAUI completa**
- **UI/UX design**
- **Storage locale SQLite**
- **GitHub Actions CI/CD**
- **Test automatizzati**

## 🚀 Setup e Avvio

### Prerequisiti

- .NET 8.0 SDK
- Docker & Docker Compose
- Account Supabase (database già configurato)
- Google Cloud Console (OAuth credentials)
- Firebase (per notifiche push)

### 1. Setup Database Supabase

Il database è già configurato con le seguenti tabelle:
- `users` - Utenti registrati
- `refresh_tokens` - Token sessione
- `device_tokens` - Token FCM
- `lists` - Liste spese
- `list_members` - Membri liste con ruoli
- `expenses` - Spese
- `expense_validations` - Validazioni
- `expense_splits` - Divisione spese
- `reimbursements` - Rimborsi
- `sync_queue` - Coda sincronizzazione
- `notifications` - Notifiche

Stored procedures disponibili:
- `calculate_expense_splits` - Divisione automatica spese
- `update_expense_status_after_validation` - Aggiornamento stato post-validazione
- `calculate_optimized_reimbursements` - Calcolo rimborsi ottimizzati
- `generate_reimbursements_for_list` - Generazione rimborsi per lista

### 2. Configurazione Backend

```bash
cd backend
cp .env.example .env
```

Modifica `.env` con i tuoi valori:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
JWT_SECRET_KEY=your-secret-key-min-32-characters
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
FIREBASE_PROJECT_ID=your-firebase-project
```

### 3. Setup Google OAuth

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuovo progetto o seleziona esistente
3. Abilita Google+ API
4. Crea credenziali OAuth 2.0:
   - Tipo: Web application
   - Authorized redirect URIs: `http://localhost:5000/signin-google`
5. Copia Client ID e Client Secret nel file `.env`

### 4. Setup Firebase (Notifiche Push)

1. Vai su [Firebase Console](https://console.firebase.google.com/)
2. Crea nuovo progetto o usa esistente
3. Aggiungi app Android e iOS
4. Scarica `google-services.json` (Android) e `GoogleService-Info.plist` (iOS)
5. Vai in Project Settings → Service Accounts
6. Genera nuova chiave privata (JSON)
7. Salva come `backend/firebase-credentials.json`

### 5. Avvio con Docker

```bash
cd backend
docker-compose up -d
```

L'API sarà disponibile su: `http://localhost:5000`

Swagger UI: `http://localhost:5000/swagger`

### 6. Avvio Sviluppo (senza Docker)

```bash
cd backend/SplitExpenses.Api
dotnet restore
dotnet run
```

## 📡 API Endpoints

### Authentication

- `POST /api/auth/google` - Login con Google ID token
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout (revoca refresh token)
- `POST /api/auth/device-token` - Registra device per push notifications

### Lists

- `GET /api/lists` - Lista delle liste utente
- `GET /api/lists/{id}` - Dettagli lista
- `POST /api/lists` - Crea nuova lista
- `GET /api/lists/{id}/members` - Membri lista
- `POST /api/lists/{id}/members` - Aggiungi membro
- `POST /api/lists/{id}/accept-invite` - Accetta invito
- `GET /api/lists/invite/{code}` - Info lista da codice invito

### Expenses

- `GET /api/expenses/list/{listId}` - Spese di una lista
- `GET /api/expenses/user` - Spese utente
- `GET /api/expenses/{id}` - Dettagli spesa
- `POST /api/expenses` - Crea spesa
- `PUT /api/expenses/{id}` - Modifica spesa (solo draft)
- `POST /api/expenses/{id}/submit` - Invia spesa per validazione
- `POST /api/expenses/{id}/validate` - Valida/Rifiuta spesa
- `GET /api/expenses/{id}/splits` - Divisione spesa
- `DELETE /api/expenses/{id}` - Elimina spesa (solo draft)

### Reimbursements

- `GET /api/reimbursements/list/{listId}` - Rimborsi di una lista
- `GET /api/reimbursements/user` - Rimborsi utente
- `POST /api/reimbursements/generate/{listId}` - Genera rimborsi ottimizzati
- `PUT /api/reimbursements/{id}/complete` - Segna rimborso come completato

## 🔐 Sicurezza

### Row Level Security (RLS)

Tutte le tabelle hanno RLS abilitato con policy restrittive:
- Gli utenti accedono solo ai propri dati
- I membri di una lista vedono solo dati della lista
- Gli admin hanno controllo sulle proprie liste
- I validatori possono approvare/rifiutare spese

### JWT Authentication

- Access token: 60 minuti
- Refresh token: 30 giorni con rotazione automatica
- Hash SHA256 per storage refresh token

## 🔄 Sincronizzazione Offline

### Strategia

1. **Cache locale**: Operazioni offline salvate in `sync_queue`
2. **Sincronizzazione automatica**: Al ritorno online, batch sync
3. **Conflitti**: Last-write-wins basato su `server_timestamp`
4. **Riconciliazione**: Banner UI per conflitti irrisolvibili

### Stati Sync

- `pending` - In attesa di sincronizzazione
- `synced` - Sincronizzato con successo
- `error` - Errore (con retry automatico)

## 🧮 Algoritmo Rimborsi

### Minimizzazione Transazioni (Greedy Algorithm)

1. Calcola bilancio netto di ogni membro:
   - `bilancio = totale_speso - totale_dovuto`
2. Ordina debitori (bilancio negativo) crescente
3. Ordina creditori (bilancio positivo) decrescente
4. Match greedy: debitore con credito più alto
5. Trasferisci `min(debito, credito)`
6. Ripeti fino a saldo zero

**Esempio:**
- Alice ha speso 100€, deve 30€ → bilancio +70€
- Bob ha speso 10€, deve 50€ → bilancio -40€
- Carlo ha speso 20€, deve 50€ → bilancio -30€

**Rimborsi ottimizzati:**
1. Bob → Alice: 40€
2. Carlo → Alice: 30€

Totale: 2 transazioni invece di 6 potenziali.

## 📱 App Mobile (TODO)

### Struttura Prevista

```
mobile/
├── SplitExpenses.Mobile/
│   ├── ViewModels/          # MVVM ViewModels
│   ├── Views/               # UI Pages
│   ├── Services/            # API client, storage
│   ├── Models/              # Data models
│   ├── Controls/            # Custom controls
│   └── App.xaml             # App entry point
└── SplitExpenses.Mobile.csproj
```

### Navigazione Tab-Based

- **Home**: Dashboard spese e saldi
- **Lists**: Elenco liste
- **Expenses**: Spese personali
- **Profile**: Profilo e impostazioni

### Funzionalità Offline

- Database SQLite locale
- Queue operazioni con sync automatico
- Indicatori stato sync per item
- Gestione conflitti con UI riconciliazione

## 🔧 Deployment su NAS

### Synology NAS con Docker

1. Installa Docker dal Package Center
2. Carica `docker-compose.yml` su NAS
3. Crea file `.env` con configurazioni
4. Esegui:

```bash
docker-compose up -d
```

### QNAP NAS con Container Station

1. Apri Container Station
2. Create → Docker Compose
3. Incolla contenuto `docker-compose.yml`
4. Configura variabili ambiente
5. Start

### Accesso Esterno

Configura port forwarding sul router:
- Porta esterna: 5000 → Porta interna: 5000 (NAS IP)

**Consigliato**: Usa reverse proxy (Nginx) con SSL (Let's Encrypt)

## 📊 Monitoraggio

### Health Check

```bash
curl http://localhost:5000/health
```

### Logs

```bash
docker-compose logs -f api
```

### Database

Usa Supabase Dashboard per:
- Query SQL
- Monitoring performance
- Gestione backup

## 🧪 Testing

### Unit Tests (TODO)

```bash
cd backend/SplitExpenses.Tests
dotnet test
```

### Integration Tests (TODO)

```bash
dotnet test --filter Category=Integration
```

## 🚢 CI/CD Pipeline (TODO)

GitHub Actions workflows:

### Backend

```yaml
.github/workflows/backend.yml
- Build & Test
- Docker Build
- Push to Registry
- Deploy to Production
```

### Mobile

```yaml
.github/workflows/mobile-android.yml
- Build APK
- Sign APK
- Upload to Play Store

.github/workflows/mobile-ios.yml
- Build IPA
- Sign with Provisioning Profile
- Upload to TestFlight
```

## 📝 TODO List

### Priorità Alta

- [ ] Completare implementazione repository Supabase (Liste, Spese, Rimborsi)
- [ ] Creare progetto .NET MAUI mobile
- [ ] Implementare UI mobile con navigazione tab
- [ ] Integrare Google Sign-In mobile
- [ ] Implementare offline storage con SQLite
- [ ] Creare logica sync offline → server

### Priorità Media

- [ ] Upload foto scontrini (storage Supabase)
- [ ] Grafici e statistiche spese
- [ ] Export dati CSV/PDF
- [ ] Notifiche in-app
- [ ] Deep linking da inviti WhatsApp
- [ ] Supporto multi-valuta con conversione

### Priorità Bassa

- [ ] Dark mode / Light mode
- [ ] Localizzazione (i18n)
- [ ] Tutorial onboarding
- [ ] Widget home screen
- [ ] Backup automatici
- [ ] Analytics e tracking

## 🤝 Contributi

Progetto privato. Per domande contattare l'amministratore.

## 📄 Licenza

Tutti i diritti riservati © 2025

## 🐛 Bug e Supporto

Segnala bug aprendo una issue su GitHub (se repository pubblico) o contattando direttamente l'amministratore.

---

**Nota**: Il progetto è completo con backend API production-ready e app mobile React Native funzionante. Backend: tutti i repository implementati. Mobile: tutte le schermate principali complete (Login, Lists, Expenses). Pronto per testing immediato. Vedi FULLSTACK_QUICKSTART.md per avviare tutto in 10 minuti!
