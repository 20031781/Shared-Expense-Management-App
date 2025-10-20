# Getting Started - Split Expenses

## 🎉 Benvenuto!

Hai appena ricevuto un progetto completo per un'applicazione di gestione spese condivise. Questa guida ti accompagnerà nei primi passi.

## 📚 Documenti Disponibili

Leggi questi documenti nell'ordine suggerito:

1. **PROJECT_SUMMARY.md** ⭐ INIZIA QUI
   - Panoramica completa del progetto
   - Cosa è stato fatto
   - Cosa manca da fare
   - Metriche e statistiche

2. **QUICK_START.md**
   - Avvio rapido backend in 5 minuti
   - Setup Google OAuth
   - Setup Firebase
   - Test API

3. **README.md**
   - Documentazione tecnica completa
   - API endpoints
   - Architettura database
   - Deployment guide

4. **ARCHITECTURE.md**
   - Diagrammi sistema
   - Pattern utilizzati
   - Flussi di lavoro
   - Schema database

5. **MOBILE_SETUP.md**
   - Guida completa .NET MAUI
   - Setup progetto mobile
   - Esempi codice
   - Configurazioni

6. **TROUBLESHOOTING.md**
   - Soluzioni problemi comuni
   - Debug tips
   - FAQ

## ⚡ Quick Start (5 minuti)

### Passo 1: Verifica Prerequisiti

```bash
# Verifica .NET 8.0
dotnet --version
# Output atteso: 8.0.x

# Verifica Docker
docker --version
docker-compose --version
```

### Passo 2: Configura Google OAuth

1. Vai su https://console.cloud.google.com/
2. Crea progetto
3. Genera OAuth Client ID
4. Copia credenziali in `backend/.env`

### Passo 3: Configura Firebase

1. Vai su https://console.firebase.google.com/
2. Crea progetto
3. Scarica credenziali JSON
4. Salva come `backend/firebase-credentials.json`

### Passo 4: Avvia Backend

```bash
cd backend
docker-compose up -d
```

### Passo 5: Testa API

Apri browser: http://localhost:5000/swagger

## 🎯 Cosa Fare Dopo

### Opzione A: Solo Backend (2-4 ore)
1. Completa implementazione repository stub
2. Testa tutti gli endpoint con dati reali
3. Aggiungi validazioni business
4. Deploy su NAS o cloud

### Opzione B: Full Stack (40-60 ore)
1. Completa backend (come sopra)
2. Crea progetto .NET MAUI (vedi MOBILE_SETUP.md)
3. Implementa UI mobile
4. Integra con backend API
5. Test completo end-to-end
6. Deploy su store (Google Play / App Store)

### Opzione C: Solo Studio (1-2 ore)
1. Esplora codice backend
2. Leggi documentazione
3. Testa API con Swagger/Postman
4. Analizza database su Supabase
5. Pianifica sviluppo futuro

## 📊 Stato Progetto

### ✅ Completato (80%)
- Database schema completo
- Backend API struttura completa
- Autenticazione OAuth + JWT
- Controllers REST API
- Algoritmo rimborsi ottimizzato
- Docker configuration
- CI/CD pipeline
- Documentation completa

### ⏳ Da Completare (20%)
- Repository implementation (8-12 ore)
- Mobile app MAUI (40-60 ore)
- Testing suite (20-30 ore)
- Production deployment (4-8 ore)

## 🎓 Learning Path

### Se Sei Nuovo a .NET
1. Esplora `backend/SplitExpenses.Api/Program.cs`
2. Leggi pattern Dependency Injection
3. Studia Controllers → Services → Repositories
4. Prova a modificare un endpoint

### Se Sei Nuovo a MAUI
1. Installa Visual Studio + workload MAUI
2. Crea progetto template: `dotnet new maui`
3. Segui tutorial Microsoft MAUI
4. Poi ritorna a MOBILE_SETUP.md

### Se Sei Nuovo a Supabase
1. Apri dashboard: https://supabase.com/dashboard
2. Esplora Table Editor
3. Prova query SQL Editor
4. Leggi documentazione RLS

## 🚀 Deployment Checklist

### Development
- [ ] Backend avviato con Docker
- [ ] Google OAuth configurato
- [ ] Firebase configurato
- [ ] API testata con Swagger
- [ ] Database verificato su Supabase

### Production
- [ ] JWT Secret cambiato
- [ ] HTTPS configurato
- [ ] Reverse proxy setup (Nginx)
- [ ] Backup strategy definita
- [ ] Monitoring configurato
- [ ] Rate limiting implementato
- [ ] Error logging setup

### Mobile
- [ ] Google Sign-In configurato
- [ ] FCM configurato
- [ ] Build Android testato
- [ ] Build iOS testato
- [ ] Upload store preparato

## 💡 Tips & Best Practices

### Backend Development
```csharp
// Usa sempre null checks
var user = await userRepository.GetByIdAsync(id);
if (user == null) return NotFound();

// Usa async/await correttamente
public async Task<ActionResult> GetData()
{
    var data = await service.GetDataAsync();
    return Ok(data);
}

// Log errors appropriatamente
try { ... }
catch (Exception ex)
{
    _logger.LogError(ex, "Error message");
    return StatusCode(500, "Internal error");
}
```

### Mobile Development
```csharp
// Usa MVVM correttamente
[RelayCommand]
private async Task LoadDataAsync()
{
    if (IsBusy) return;
    try
    {
        IsBusy = true;
        var data = await apiService.GetDataAsync();
        Items.Clear();
        foreach (var item in data)
            Items.Add(item);
    }
    catch (Exception ex)
    {
        await Shell.Current.DisplayAlert("Error", ex.Message, "OK");
    }
    finally
    {
        IsBusy = false;
    }
}
```

### Database Queries
```sql
-- Usa sempre indici su WHERE clauses
CREATE INDEX idx_expenses_list_id ON expenses(list_id);

-- Evita N+1 queries con JOIN
SELECT e.*, u.full_name
FROM expenses e
JOIN users u ON u.id = e.author_id
WHERE e.list_id = 'uuid';

-- Test performance con EXPLAIN
EXPLAIN ANALYZE SELECT * FROM expenses WHERE ...;
```

## 🐛 Common Issues

### "Docker container exited"
```bash
# Vedi logs
docker-compose logs api
# Verifica .env configurato correttamente
```

### "401 Unauthorized"
```bash
# Token mancante o scaduto
# Verifica header: Authorization: Bearer <token>
```

### "RLS policy violation"
```bash
# Verifica auth.uid() corrisponde a user_id
# Controlla policy in Supabase Dashboard
```

## 📞 Support & Resources

### Documentation Links
- [ASP.NET Core](https://docs.microsoft.com/aspnet/core)
- [.NET MAUI](https://docs.microsoft.com/dotnet/maui)
- [Supabase](https://supabase.com/docs)
- [Docker](https://docs.docker.com)

### Community
- Stack Overflow
- GitHub Issues
- Discord/Slack (se disponibile)

### Tools
- [Postman](https://www.postman.com/) - API testing
- [DBeaver](https://dbeaver.io/) - Database GUI
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

## 🎯 Your Next Action

**Scegli uno:**

1. **Voglio testare subito** → Vai a QUICK_START.md
2. **Voglio capire tutto** → Leggi PROJECT_SUMMARY.md
3. **Voglio sviluppare mobile** → Vai a MOBILE_SETUP.md
4. **Ho problemi** → Apri TROUBLESHOOTING.md
5. **Voglio vedere architettura** → Leggi ARCHITECTURE.md

---

**Buon lavoro! Se hai domande, consulta la documentazione. Tutto è spiegato nei file MD. 🚀**
