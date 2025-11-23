# Troubleshooting Guide

## Backend API

### Errore: "dotnet: command not found"

**Soluzione:**
```bash
# Verifica installazione .NET
dotnet --version

# Se non installato, scarica da:
# https://dotnet.microsoft.com/download/dotnet/9.0
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

### Errore: "Unable to connect to Supabase"

**Verifica:**
1. URL e Key corretti in `.env`
2. Connessione internet attiva
3. Firewall non blocca connessioni

**Test connessione:**
```bash
curl https://your-project.supabase.co/rest/v1/
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

## Database Supabase

### Errore: "Row level security policy violation"

**Problema:** RLS blocca accesso non autorizzato

**Verifica:**
1. Token JWT valido nell'header
2. User ID corrisponde a auth.uid()
3. Policy RLS configurate correttamente

**Test policy:**
```sql
-- In Supabase SQL Editor
SELECT * FROM users WHERE id = auth.uid();
```

### Query lenta

**Soluzione:**
1. Aggiungi indici su colonne filtrate
2. Usa EXPLAIN per analizzare query
3. Limita risultati con pagination

```sql
-- Verifica piano esecuzione
EXPLAIN ANALYZE
SELECT * FROM expenses WHERE list_id = 'uuid';

-- Aggiungi indice se necessario
CREATE INDEX idx_expenses_list_id ON expenses(list_id);
```

### Stored procedure fallisce

**Diagnosi:**
```sql
-- Test manuale stored procedure
SELECT * FROM calculate_optimized_reimbursements('list-uuid');
```

**Verifica:**
- Dati di input validi
- Constraint soddisfatti
- Nessun deadlock

## Mobile App (.NET MAUI)

### Errore: "Workload 'maui' not installed"

**Soluzione:**
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

**Supabase Dashboard → Database → Performance:**
1. Identifica query lente
2. Aggiungi indici mancanti
3. Ottimizza RLS policies

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
- RLS policy nega accesso
- Utente non autorizzato per risorsa

**Fix:**
1. Verifica policy RLS
2. Controlla ownership risorsa
3. Verifica ruoli utente

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
-- Abilita logging query in Supabase Dashboard
-- Settings → Database → Connection Pooling → Logging Level: debug
```

## Contatti e Supporto

### Risorse Utili
- [ASP.NET Core Docs](https://docs.microsoft.com/aspnet/core)
- [.NET MAUI Docs](https://docs.microsoft.com/dotnet/maui)
- [Supabase Docs](https://supabase.com/docs)
- [Docker Docs](https://docs.docker.com)

### Community
- Stack Overflow: Tag `asp.net-core`, `maui`, `supabase`
- GitHub Issues (se repository pubblico)
- Discord/Slack community (se disponibile)

---

**Nota**: Questo documento viene aggiornato continuamente. Se trovi altri problemi comuni, aggiungili qui.
