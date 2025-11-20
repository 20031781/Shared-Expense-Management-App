# Troubleshooting Guide

## Backend API

### Errore: "dotnet: command not found"

**Soluzione:**

```bash
# Verifica installazione .NET
dotnet --version

# Se non installato, scarica da:
# https://dotnet.microsoft.com/download/dotnet/8.0
```

### Errore: "Failed to bind to address"

**Problema:** Porta 5000 già in uso

**Soluzione:**

```bash
# Trova processo sulla porta
lsof -i :5000
# oppure su Windows
netstat -ano | findstr :5000

# Termina processo o cambia porta in docker-compose.yml
ports:
  - "5001:80"  # Usa 5001 invece di 5000
```

### Errore: "Unable to connect to PostgreSQL"

**Verifica:**

1. Il container `splitexpenses-postgres` è in esecuzione (`docker ps`).
2. La porta `5432` non è occupata da altri servizi.
3. La connection string in `appsettings.json` punta al database corretto (`split_expenses`).
4. Username/password coincidono con quelli definiti in `docker-compose.db.yml`.

**Test connessione:**

```bash
docker exec -it splitexpenses-postgres pg_isready -U postgres -d split_expenses

# oppure dalla tua macchina locale
psql "postgresql://postgres:postgres@localhost:5432/split_expenses"
```

### Errore: "Invalid Google OAuth token"

**Verifica:**

1. Client ID configurato correttamente
2. Redirect URI autorizzato in Google Console
3. Token non scaduto

**Redirect URI corretto:**

```
http://localhost:5000/signin-google
https://your-domain.com/signin-google
```

### Errore: "Request failed with status code 400" quando creo una lista

**Problema:** Con l'attributo `[ApiController]` attivo, ogni proprietà non-nullable del DTO è obbligatoria.
`CreateListRequest` richiedeva `Members`, quindi una richiesta senza il campo veniva respinta durante il model binding e
Rider non poteva mai arrivare al breakpoint nell'`action`.

**Soluzione:**

1. Il DTO (`backend/SplitExpenses.Api/Controllers/ListsController.cs`) inizializza ora `Members` a una lista vuota, così
   il model binding non fallisce più quando il campo manca.
2. Il client mobile (`mobile/src/services/lists.service.ts`) invia sempre `members: []`, rendendo esplicito il payload
   accettato dall'API.
3. Riavvia l'API in modalità Debug: qualsiasi `POST /api/lists` raggiungerà il breakpoint impostato su `CreateList` e
   restituirà `201 Created` se il token è valido.

### Errore: "Firebase credentials not found"

**Soluzione:**

1. Scarica credenziali da Firebase Console
2. Salva come `backend/firebase-credentials.json`
3. Verifica path in docker-compose.yml

### Errore: "JWT key too short"

**Soluzione:**
La chiave JWT deve essere minimo 32 caratteri.

```bash
# Genera chiave sicura
openssl rand -base64 32
```

Aggiorna `JWT_SECRET_KEY` in `.env`

## Docker

### Errore: "Docker daemon not running"

**Linux/Mac:**

```bash
sudo systemctl start docker
```

**Windows:**
Avvia Docker Desktop

### Errore: "Cannot connect to Docker daemon"

**Soluzione:**

```bash
# Aggiungi utente a gruppo docker
sudo usermod -aG docker $USER
newgrp docker
```

### Container si riavvia continuamente

**Diagnosi:**

```bash
docker-compose logs api
```

**Cause comuni:**

- Errore configurazione `.env`
- Porta già in uso
- Credenziali Firebase mancanti

### Rebuild completo Docker

```bash
cd backend
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Database PostgreSQL

### Errore: "permission denied for table"

**Problema:** L'utente PostgreSQL non ha i permessi corretti.

**Soluzione:**

1. Connettiti con l'utente `postgres`.
2. Esegui i GRANT necessari:
   ```sql
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
   ```
3. Se hai creato un utente custom, ricordati di concedere i permessi anche sulle SEQUENCES:
   ```sql
   GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
   ```

### Query lenta

**Soluzione:**

1. Abilita `auto_explain` o usa `EXPLAIN ANALYZE` da psql/DataGrip.
2. Aggiungi indici sulle colonne usate nei filtri (`list_id`, `member_id`, ...).
3. Limita i risultati con pagination (`LIMIT/OFFSET`).

```sql
EXPLAIN ANALYZE
SELECT * FROM expenses WHERE list_id = 'uuid';

CREATE INDEX IF NOT EXISTS idx_expenses_list_id ON expenses(list_id);
```

### Stored procedure fallisce

**Diagnosi:**

```sql
SELECT * FROM calculate_optimized_reimbursements('list-uuid');
```

**Verifica:**

- Parametri passati correttamente (UUID esistente).
- Constraint e foreign key soddisfatti.
- Nessun lock persistente (`SELECT * FROM pg_locks;`).

## Mobile App (React Native)

### Errore: "Workload 'maui' not installed"

**Soluzione:**

Questo repository usa Expo/React Native. Se visualizzi ancora messaggi legati a MAUI significa che stai lanciando il
progetto sbagliato o hai ancora un ambiente MAUI aperto. Chiudi tutto e avvia `cd mobile && npm start`.

### Ricevo "New expense notification dispatched" ma nessuna push sul telefono

1. Se usi **Expo Go**, le notifiche remote sono disattivate da SDK 53. Passa a una development build (`eas build --profile
   development`) o crea un dev client con `npx expo run:android/ios`.
2. Apri l'app → Impostazioni → Notifiche e assicurati che i permessi siano concessi e i toggle attivi. Su Expo Go non verrà
   registrato alcun token finché non installi una build di sviluppo/anteprima reale.
3. Controlla che la tabella `device_tokens` contenga almeno un record per il tuo `user_id`. In caso contrario, reinstallare
   la build (non Expo Go) e consenti i permessi.
4. Riprova gli endpoint di test descritti in [docs/NOTIFICATIONS.md](docs/NOTIFICATIONS.md).

> ⚠️ Messaggio ricorrente su Expo Go
>
> ````
> ERROR  expo-notifications: Android Push notifications ... were removed from Expo Go with the release of SDK 53
> ````
>
> È previsto: Expo Go non supporta più le push remote e mostrerà sempre l'errore/warning. Chiudi il popup e continua lo
> sviluppo solo per l'anteprima, ma ricordati di usare una development build per testare le notifiche reali.

```bash
dotnet workload install maui
```

### Errore build Android

**Verifica:**

1. Android SDK installato
2. Java JDK installato (JDK 11 o superiore)
3. Variabili ambiente configurate

```bash
# Verifica
echo $ANDROID_HOME
echo $JAVA_HOME
```

### Errore build iOS

**Solo su Mac:**

1. Xcode installato
2. Command Line Tools installati

### Errore: "React has detected a change in the order of Hooks"

**Scenario:** Aprendo `ListDetailsScreen` l'app mobile mostrava l'errore sui React Hooks a causa del ritorno anticipato
che saltava una `useMemo`.

**Soluzione:**

- Mantieni l'ordine dei React Hooks costante spostando i calcoli memoizzati (es. `splitSummary`) prima di qualsiasi
  `return` condizionale.
- Dopo la modifica ricordati di rieseguire la schermata: il loader verrà renderizzato senza errori e al render
  successivo i dati saranno caricati correttamente.

```bash
xcode-select --install
```

### Google Sign-In non funziona

**Android:**

- SHA-1 certificate fingerprint configurato in Firebase
- Client ID Android corretto in google-services.json

**iOS:**

- URL Scheme configurato in Info.plist
- Client ID iOS corretto in GoogleService-Info.plist

### Crash al lancio

**Verifica logs:**

**Android:**

```bash
adb logcat
```

**iOS (in Xcode):**
Window → Devices and Simulators → View Device Logs

### Errore: "Rendered more hooks than during the previous render"

**Problema:** In `mobile/src/screens/ListDetailsScreen.tsx` il componente restituiva `<Loading />` prima di eseguire
alcuni `useMemo`, quindi al render successivo React vedeva più hook del previsto e bloccava l'app quando si apriva una
lista esistente.

**Soluzione:** Mantieni tutti gli hook (useMemo, useEffect, ecc.) in cima al componente e solo dopo gestisci i `return`
condizionali. Nel fix attuale gli hook vengono eseguiti sempre e la guardia `if (!currentList)` vive subito dopo i
calcoli, evitando il crash.

## API Testing

### Test con cURL

```bash
# Health check
curl http://localhost:5000/health

# Login (sostituisci con token Google reale)
curl -X POST http://localhost:5000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"your-google-id-token"}'

# Get lists (con JWT)
curl http://localhost:5000/api/lists \
  -H "Authorization: Bearer your-jwt-token"
```

### Test con Postman

1. Import collezione da Swagger: http://localhost:5000/swagger/v1/swagger.json
2. Configura variabile `baseUrl`: http://localhost:5000
3. Configura variabile `token` dopo login

### Swagger UI non carica

**Verifica:**

1. Ambiente Development: `ASPNETCORE_ENVIRONMENT=Development`
2. Swagger registrato in Program.cs
3. Browser cache pulita

## Network Issues

### CORS Error

**Problema:** Browser blocca richieste cross-origin

**Soluzione in Program.cs:**

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowMobileApp", policy =>
    {
        policy.WithOrigins("http://localhost:8081") // Expo dev server
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});
```

### Timeout su richieste

**Aumenta timeout HttpClient:**

```csharp
builder.Services.AddHttpClient("api", client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});
```

## Performance Issues

### API lenta

**Diagnosi:**

1. Abilita logging query
2. Monitora tempo risposta
3. Profila con Application Insights

**Ottimizzazioni:**

- Usa pagination
- Aggiungi caching
- Ottimizza query N+1

### App mobile lenta

**Ottimizzazioni:**

- Lazy loading liste
- Virtualizzazione liste lunghe
- Compressione immagini
- Preload dati critici

### Database lento

**Verifica:**

1. Controlla l'utilizzo CPU/RAM del container (`docker stats splitexpenses-postgres`).
2. Consulta i log PostgreSQL (`docker logs splitexpenses-postgres`).
3. Usa `EXPLAIN (ANALYZE, BUFFERS)` per individuare query lente.

## Deployment Issues

### NAS: Container non parte

**Verifica:**

1. Docker installato correttamente
2. Permessi file corretti
3. Porte non in conflitto
4. Variabili ambiente corrette

**Logs:**

```bash
docker logs splitexpenses-api
```

### SSL/HTTPS Issues

**Con Nginx reverse proxy:**

```nginx
server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## CI/CD Issues

### GitHub Actions fail

**Build fail:**

1. Verifica .NET SDK version
2. Verifica dipendenze NuGet
3. Controlla secrets configurati

**Secrets necessari:**

- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`
- `SERVER_HOST`
- `SERVER_USERNAME`
- `SERVER_SSH_KEY`
- `ANDROID_KEYSTORE_FILE`
- `ANDROID_KEYSTORE_PASSWORD`
- `IOS_CERTIFICATE_BASE64`
- `IOS_PROVISIONING_PROFILE_BASE64`

### Deploy fail

**SSH connection issues:**

```bash
# Test connessione SSH
ssh username@server-host

# Verifica SSH key
cat ~/.ssh/id_rsa.pub
```

## Sync Issues

### Offline sync non funziona

**Verifica:**

1. SQLite database inizializzato
2. Network connectivity detection attivo
3. Sync queue popolata

**Test manuale:**

```csharp
await syncService.ProcessSyncBatchAsync(userId, pendingItems);
```

### Conflitti continui

**Strategia:**

1. Last-write-wins basato su server_timestamp
2. Mostra banner UI per conflitti critici
3. Log conflitti per analisi

## Common Errors

### "Null reference exception"

**Cause:**

- Dependency injection non configurato
- Servizio non registrato
- Database query restituisce null

**Fix:**

```csharp
// Usa null-conditional operator
var user = await userRepository.GetByIdAsync(id);
if (user == null)
    return NotFound();
```

### "Unauthorized 401"

**Cause:**

- JWT token mancante
- Token scaduto
- Token invalido

**Fix:**

1. Implementa refresh token flow
2. Verifica header Authorization
3. Controlla validità token

### "Forbidden 403"

**Cause:**

- Claim/ruoli utente non sufficienti
- Risorsa appartiene ad un altro utente
- Policy di autorizzazione lato backend non soddisfatta

**Fix:**

1. Verifica che il JWT contenga i claim attesi.
2. Controlla l'ownership della risorsa nel database.
3. Aggiorna i requisiti `[Authorize]` nel controller se necessario.

## Debug Tips

### Backend Debug

```csharp
// In appsettings.Development.json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Information"
    }
  }
}
```

### Mobile Debug

```csharp
// In ViewModel
System.Diagnostics.Debug.WriteLine($"API Response: {response}");

// Breakpoint conditional
if (userId == specificUserId)
{
    System.Diagnostics.Debugger.Break();
}
```

### SQL Debug

```sql
-- Abilita logging delle query in PostgreSQL (postgresql.conf)
log_min_duration_statement = 0

-- Oppure usa temporary logging per sessione
SET log_min_duration_statement = 0;
```

## Contatti e Supporto

### Risorse Utili

- [ASP.NET Core Docs](https://docs.microsoft.com/aspnet/core)
- [.NET MAUI Docs](https://docs.microsoft.com/dotnet/maui)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Docker Docs](https://docs.docker.com)

### Community

- Stack Overflow: Tag `asp.net-core`, `maui`, `postgresql`
- GitHub Issues (se repository pubblico)
- Discord/Slack community (se disponibile)

---

**Nota**: Questo documento viene aggiornato continuamente. Se trovi altri problemi comuni, aggiungili qui.
