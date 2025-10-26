# Architettura Sistema Split Expenses

## Diagramma Architetturale

```mermaid
graph TB
    subgraph "Mobile App (React Native)"
        MA[React Native + Expo]
        SC[Screens]
        ST[Zustand Stores]
        SV[Services]

        MA --> SC
        SC --> ST
        ST --> SV
    end

    subgraph "Backend API (ASP.NET Core)"
        API[Controllers]
        BL[Services Business Logic]
        REPO[Repositories Data Access]

        API --> BL
        BL --> REPO
    end

    subgraph "Infrastructure"
        SUPABASE[(Supabase PostgreSQL)]
        FCM[Firebase Cloud Messaging]
        OAUTH[Google OAuth]
    end

    MA -->|HTTPS REST| API
    REPO -->|Supabase Client| SUPABASE
    BL -->|Push Notifications| FCM
    API -->|Verify Token| OAUTH
    MA -->|Google Sign-In| OAUTH
    FCM -->|Notifiche| MA

    style MA fill:#4CAF50
    style API fill:#2196F3
    style SUPABASE fill:#FF9800
```

## Flusso Autenticazione

```mermaid
sequenceDiagram
    participant User
    participant App as React Native App
    participant Google
    participant API as Backend API
    participant DB as Supabase

    User->>App: Tap "Accedi con Google"
    App->>Google: Request OAuth
    Google->>User: Login Google
    User->>Google: Credenziali
    Google->>App: ID Token
    App->>API: POST /auth/google {idToken}
    API->>Google: Verify Token
    Google->>API: Token Valid
    API->>DB: Get/Create User
    DB->>API: User Data
    API->>API: Generate JWT + Refresh Token
    API->>DB: Store Refresh Token
    API->>App: {accessToken, refreshToken, user}
    App->>App: Store Tokens Securely
    App->>User: Navigate to Home
```

## Workflow Spesa

```mermaid
stateDiagram-v2
    [*] --> Draft: Crea Spesa
    Draft --> Submitted: Invia per Validazione
    Draft --> [*]: Elimina
    Submitted --> Validated: Tutti Approvano
    Submitted --> Rejected: Almeno 1 Rifiuta
    Validated --> [*]: Calcola Splits
    Rejected --> Draft: Modifica
    Rejected --> [*]: Elimina

    note right of Validated
        Trigger automatico:
        - Calcola expense_splits
        - Notifica membri
    end note
```

## Calcolo Rimborsi Ottimizzati

```mermaid
flowchart TD
    Start([Inizio]) --> GetExpenses[Recupera Spese Validate]
    GetExpenses --> CalcBalance[Calcola Bilancio per Membro]
    CalcBalance --> SortDebtors[Ordina Debitori Crescente]
    SortDebtors --> SortCreditors[Ordina Creditori Decrescente]
    SortCreditors --> HasDebtors{Ci sono debitori?}

    HasDebtors -->|Sì| HasCreditors{Ci sono creditori?}
    HasDebtors -->|No| End([Fine])

    HasCreditors -->|Sì| CalcTransfer[transfer = min(debito, credito)]
    HasCreditors -->|No| End

    CalcTransfer --> CreateReimbursement[Crea Rimborso]
    CreateReimbursement --> UpdateBalances[Aggiorna Bilanci]
    UpdateBalances --> CheckDebtor{Debito Saldato?}

    CheckDebtor -->|Sì| NextDebtor[Prossimo Debitore]
    CheckDebtor -->|No| UpdateDebtor[Aggiorna Debito]

    NextDebtor --> CheckCreditor
    UpdateDebtor --> CheckCreditor{Credito Saldato?}

    CheckCreditor -->|Sì| NextCreditor[Prossimo Creditore]
    CheckCreditor -->|No| UpdateCreditor[Aggiorna Credito]

    NextCreditor --> HasDebtors
    UpdateCreditor --> HasDebtors
```

## Sincronizzazione Offline

```mermaid
sequenceDiagram
    participant User
    participant App
    participant LocalDB as SQLite
    participant SyncQueue
    participant API
    participant Supabase

    Note over User,Supabase: Scenario: Utente offline

    User->>App: Crea Spesa
    App->>LocalDB: Save Expense (local_id)
    App->>SyncQueue: Add to Queue (pending)
    App->>User: ✓ Spesa Creata (sync pending)

    Note over App: Network Available

    App->>API: POST /sync/batch
    Note right of API: Batch di operazioni
    loop Per ogni operazione
        API->>Supabase: Execute Operation
        Supabase->>API: Result
        alt Success
            API->>API: Mark as synced
        else Conflict
            API->>App: Conflict Info
            App->>User: Banner Riconciliazione
        else Error
            API->>SyncQueue: Increment retry_count
        end
    end
    API->>App: Sync Result
    App->>LocalDB: Update local records
    App->>User: ✓ Sincronizzato
```

## Struttura Database

```mermaid
erDiagram
    users ||--o{ lists : "admin"
    users ||--o{ list_members : "member"
    users ||--o{ expenses : "author"
    users ||--o{ expense_validations : "validator"
    users ||--o{ reimbursements : "from/to"

    lists ||--o{ list_members : "has"
    lists ||--o{ expenses : "contains"
    lists ||--o{ reimbursements : "generates"

    list_members ||--o{ expense_splits : "owes"

    expenses ||--o{ expense_validations : "validated_by"
    expenses ||--o{ expense_splits : "divided_into"

    users {
        uuid id PK
        text email UK
        text google_id UK
        text full_name
        text default_currency
        jsonb notification_preferences
    }

    lists {
        uuid id PK
        text name
        uuid admin_id FK
        text invite_code UK
    }

    list_members {
        uuid id PK
        uuid list_id FK
        uuid user_id FK
        decimal split_percentage
        boolean is_validator
        text status
    }

    expenses {
        uuid id PK
        uuid list_id FK
        uuid author_id FK
        decimal amount
        text status
        timestamptz server_timestamp
    }

    expense_splits {
        uuid id PK
        uuid expense_id FK
        uuid member_id FK
        decimal amount
    }

    reimbursements {
        uuid id PK
        uuid list_id FK
        uuid from_user_id FK
        uuid to_user_id FK
        decimal amount
        text status
    }
```

## Stack Tecnologico

### Backend
```
ASP.NET Core 8.0
├── Controllers (REST API)
├── Services (Business Logic)
│   ├── AuthService
│   ├── NotificationService
│   └── SyncService
├── Repositories (Data Access)
│   ├── UserRepository
│   ├── ListRepository
│   ├── ExpenseRepository
│   └── ReimbursementRepository
└── Models (Domain)
```

### Mobile
```
React Native + Expo + TypeScript
├── screens/ (UI Components)
├── store/ (Zustand State)
├── services/
│   ├── api.service (Axios HTTP)
│   ├── auth.service
│   ├── supabase.client (Direct DB)
│   └── storage.service
├── components/ (Reusable UI)
└── types/ (TypeScript)
```

### Database
```
Supabase (PostgreSQL)
├── Tables (11)
├── RLS Policies (Security)
├── Stored Procedures
│   ├── calculate_expense_splits
│   ├── calculate_optimized_reimbursements
│   └── generate_reimbursements_for_list
└── Triggers
    └── update_expense_status_after_validation
```

## Pattern e Principi

### Backend Architecture
- **Layered Architecture**: Controllers → Services → Repositories
- **Dependency Injection**: Tutti i servizi registrati in Program.cs
- **Repository Pattern**: Astrazione accesso dati
- **Single Responsibility**: Ogni classe ha un solo scopo

### Mobile Architecture
- **Component-Based**: React functional components
- **State Management**: Zustand stores
- **Hooks Pattern**: React hooks for logic
- **Service Layer**: Direct Supabase + HTTP API

### Security
- **Authentication**: Google OAuth + JWT
- **Authorization**: Claims-based con policy
- **Data Security**: RLS su database
- **Token Security**: Refresh token con rotazione

## Deployment Architecture

```mermaid
graph LR
    subgraph "Production"
        LB[Load Balancer]
        API1[API Instance 1]
        API2[API Instance 2]
        LB --> API1
        LB --> API2
    end

    subgraph "Data Layer"
        SUPABASE[(Supabase Cloud)]
        API1 --> SUPABASE
        API2 --> SUPABASE
    end

    subgraph "Services"
        FCM[Firebase]
        GOOGLE[Google OAuth]
        API1 --> FCM
        API1 --> GOOGLE
    end

    subgraph "Clients"
        IOS[iOS App]
        ANDROID[Android App]
    end

    IOS --> LB
    ANDROID --> LB
```

## Scalabilità

### Horizontal Scaling
- API stateless: può essere replicata
- Load balancer distribuisce carico
- Supabase gestisce connection pooling

### Vertical Scaling
- Aumenta risorse Docker container
- Ottimizza query database con indici
- Caching strategico (Redis future)

### Performance Optimization
- Indici database su campi chiave
- Batch operations per sync
- Pagination per liste grandi
- Lazy loading su mobile

## Monitoring e Observability

### Logs
- Application Insights (Azure)
- Serilog structured logging
- Docker logs persistenti

### Metrics
- Request rate/latency
- Error rate
- Database query performance
- Sync success rate

### Alerts
- API down
- High error rate
- Database connection issues
- Sync failures

---

**Ultimo aggiornamento**: 2025-10-10
