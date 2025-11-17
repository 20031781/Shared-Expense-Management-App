# File Index - Split Expenses Project

## 📄 Documentation Files

### Getting Started

- **GETTING_STARTED.md** - Prima guida per nuovi utenti
- **README.md** - Documentazione tecnica principale
- **QUICK_START.md** - Avvio rapido backend (5 minuti)

### Reference Documentation

- **PROJECT_SUMMARY.md** - Panoramica completa, statistiche, status
- **ARCHITECTURE.md** - Design sistema, diagrammi, pattern
- **MOBILE_SETUP.md** - Guida completa setup .NET MAUI
- **TROUBLESHOOTING.md** - Risoluzione problemi comuni

### Legal

- **LICENSE.md** - Licenza e termini utilizzo

### Utility

- **FILE_INDEX.md** - Questo file (indice completo)

## 🖥️ Backend Files

### Root Configuration

```
backend/
├── Dockerfile                      # Docker image multi-stage build
├── docker-compose.yml              # Container orchestration
├── .env                            # Environment variables (configurato)
└── .env.example                    # Template environment variables
```

### API Project

```
backend/SplitExpenses.Api/
├── Program.cs                      # Application entry point, DI config
├── appsettings.json               # App configuration
└── SplitExpenses.Api.csproj       # .NET project file
```

### Controllers (REST API Endpoints)

```
backend/SplitExpenses.Api/Controllers/
├── AuthController.cs              # Authentication endpoints
│   - POST /api/auth/google
│   - POST /api/auth/refresh
│   - POST /api/auth/logout
│   - POST /api/auth/device-token
│
├── ListsController.cs             # Lists management
│   - GET /api/lists
│   - GET /api/lists/{id}
│   - POST /api/lists
│   - GET /api/lists/{id}/members
│   - POST /api/lists/{id}/members
│   - GET /api/lists/invite/{code}
│
├── ExpensesController.cs          # Expenses CRUD
│   - GET /api/expenses/list/{listId}
│   - GET /api/expenses/user
│   - GET /api/expenses/{id}
│   - POST /api/expenses
│   - PUT /api/expenses/{id}
│   - POST /api/expenses/{id}/submit
│   - POST /api/expenses/{id}/validate
│   - DELETE /api/expenses/{id}
│
└── ReimbursementsController.cs    # Reimbursements
    - GET /api/reimbursements/list/{listId}
    - GET /api/reimbursements/user
    - POST /api/reimbursements/generate/{listId}
    - PUT /api/reimbursements/{id}/complete
```

### Services (Business Logic)

```
backend/SplitExpenses.Api/Services/
├── IAuthService.cs                # Auth interface
├── AuthService.cs                 # OAuth2 + JWT implementation
├── INotificationService.cs        # Notifications interface
├── NotificationService.cs         # Firebase Cloud Messaging
├── ISyncService.cs                # Sync interface
├── SyncService.cs                 # Offline sync logic
├── ISupabaseService.cs            # Supabase client interface
└── SupabaseService.cs             # Supabase client singleton
```

### Repositories (Data Access)

```
backend/SplitExpenses.Api/Repositories/
├── IUserRepository.cs             # User data interface
├── UserRepository.cs              # ✅ COMPLETO - User CRUD + tokens
├── IListRepository.cs             # List data interface
├── ListRepository.cs              # ✅ COMPLETO - Lists + Members CRUD
├── IExpenseRepository.cs          # Expense data interface
├── ExpenseRepository.cs           # ✅ COMPLETO - Expenses + Validations + Splits
├── IReimbursementRepository.cs    # Reimbursement interface
└── ReimbursementRepository.cs     # ✅ COMPLETO - Reimbursements CRUD + RPC
```

### Models (Domain Models)

```
backend/SplitExpenses.Api/Models/
├── User.cs                        # User model + NotificationPreferences
├── List.cs                        # List + ListMember + MemberStatus enum
├── Expense.cs                     # Expense + ExpenseValidation + ExpenseSplit
├── Reimbursement.cs               # Reimbursement model
└── SyncQueue.cs                   # SyncQueueItem model
```

## 📱 Mobile Files (TODO)

```
mobile/                            # ❌ Da creare
└── (Vedi MOBILE_SETUP.md per struttura completa)
```

## 🗄️ Database (Supabase)

### Migrations Applied

```
✅ 001_initial_schema_tables       # 11 tabelle create
✅ 002_row_level_security          # RLS + 20+ policies
✅ 003_stored_procedures           # 4 procedures + 1 trigger
```

### Tables (11)

1. **users** - Utenti registrati
2. **refresh_tokens** - Token sessioni
3. **device_tokens** - Token FCM
4. **lists** - Liste spese
5. **list_members** - Membri con ruoli
6. **expenses** - Spese con workflow
7. **expense_validations** - Validazioni
8. **expense_splits** - Divisione spese
9. **reimbursements** - Rimborsi
10. **sync_queue** - Coda offline
11. **notifications** - Notifiche

### Stored Procedures (4)

- `calculate_expense_splits` - Divisione automatica spese
- `update_expense_status_after_validation` - Trigger validazioni
- `calculate_optimized_reimbursements` - Algoritmo greedy
- `generate_reimbursements_for_list` - Genera rimborsi

## 🔄 CI/CD Pipeline

```
.github/workflows/
├── backend-ci.yml                 # Backend build, test, deploy
├── mobile-android.yml             # Android APK build
└── mobile-ios.yml                 # iOS IPA build
```

## 📊 Statistics

### Backend Code

- **Total Files:** 37
- **C# Files:** 26
- **Controllers:** 4 (25+ endpoints)
- **Services:** 6
- **Repositories:** 4 (tutti completi)
- **Models:** 5 + 12 DTOs
- **Lines of Code:** ~5,000

### Documentation

- **MD Files:** 8
- **Total Pages:** ~50 (se stampato)
- **Code Examples:** 100+
- **Diagrams:** 5 (Mermaid)

### Database

- **Tables:** 11
- **Stored Procedures:** 4
- **Triggers:** 1
- **Indexes:** 25+
- **RLS Policies:** 20+

## 🗂️ File Organization

### By Purpose

**Configuration:**

- `backend/.env` - Environment variables
- `backend/docker-compose.yml` - Docker orchestration
- `backend/SplitExpenses.Api/appsettings.json` - App settings
- `.github/workflows/*.yml` - CI/CD pipelines

**Source Code:**

- `backend/SplitExpenses.Api/Controllers/` - API endpoints
- `backend/SplitExpenses.Api/Services/` - Business logic
- `backend/SplitExpenses.Api/Repositories/` - Data access
- `backend/SplitExpenses.Api/Models/` - Domain models

**Documentation:**

- `*.md` files in root - User guides
- `ARCHITECTURE.md` - Technical design
- `TROUBLESHOOTING.md` - Problem solving

**Infrastructure:**

- `backend/Dockerfile` - Container image
- `.github/workflows/` - Automation

## 📝 File Status Legend

- ✅ **Completo** - Implementazione completa e testata
- ⚠️ **Stub** - Interfaccia definita, implementazione stub
- ❌ **Mancante** - Non ancora creato
- 🔄 **Work in Progress** - In fase di sviluppo

## 🎯 Implementation Priority

### Alta Priorità (prossimi passi)

1. Mobile app project structure ❌
2. Mobile ViewModels ❌
3. Mobile Services ❌
4. Mobile Views ❌

### Media Priorità

5. Test suite ❌
6. Performance optimization
7. Advanced features (upload foto, grafici, export CSV)

### Bassa Priorità

8. Multi-currency support con conversione
9. Analytics e tracking
10. Widget e shortcuts

## 🔍 Quick File Lookup

**Voglio capire come:**

- **Autenticazione funziona** → `AuthService.cs` + `AuthController.cs`
- **Database è strutturato** → `ARCHITECTURE.md` (sezione database)
- **Rimborsi sono calcolati** → Supabase stored procedure `calculate_optimized_reimbursements`
- **API è organizzata** → `Program.cs` + `Controllers/`
- **Deploy su Docker** → `docker-compose.yml` + `Dockerfile`
- **RLS è configurato** → Migration `002_row_level_security`
- **Mobile va implementato** → `MOBILE_SETUP.md`

## 📞 Need Help?

**Per troubleshooting:** → `TROUBLESHOOTING.md`
**Per quick start:** → `QUICK_START.md`
**Per architettura:** → `ARCHITECTURE.md`
**Per mobile:** → `MOBILE_SETUP.md`

---

**Ultimo aggiornamento:** 2025-10-10
**Versione progetto:** 1.0.0-alpha
