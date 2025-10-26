# 🚀 Setup Locale - Split Expenses

## Cosa Hai Bisogno
- ✅ Node.js 18+
- ✅ Il tuo telefono con Expo Go installato ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- ✅ Supabase account (gratuito)

---

## Step 1: Configurazione Supabase (5 minuti)

### Setup Database

Il progetto usa Supabase come database. Le migration sono già disponibili in `supabase/migrations/`.

1. **Crea un progetto Supabase** su [supabase.com](https://supabase.com)
2. **Applica le migrations**:
   - Vai su Supabase Dashboard → SQL Editor
   - Copia il contenuto dei file in `supabase/migrations/` (in ordine)
   - Esegui ogni migration
3. **Copia le credenziali**:
   - Project URL: `https://xxx.supabase.co`
   - Anon Key: dalla dashboard → Settings → API

---

## Step 2: App Mobile (3 minuti)

### Trova il tuo IP locale

**Windows:**
```bash
ipconfig
# Cerca "Indirizzo IPv4" (es: 192.168.1.100)
```

**Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# Prendi il primo IP (es: 192.168.1.100)
```

### Configurazione

```bash
cd mobile

# Installa dipendenze
npm install

# Crea .env con credenziali Supabase
cat > .env << 'EOF'
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
EOF
```

**Esempio .env:**
```env
EXPO_PUBLIC_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Avvio

```bash
npm start
```

Vedrai un **QR code** nel terminale.

### Sul telefono
1. Apri **Expo Go**
2. Scansiona il **QR code**
3. Aspetta che l'app si carichi

---

## 🔐 Autenticazione

L'app usa **Supabase Auth** con email/password (Google OAuth opzionale).

### Prima volta
1. Apri l'app
2. Registrati con email e password
3. Login automatico ✅

**Nota:** Puoi aggiungere Google OAuth dopo (vedi documentazione Supabase).

---

## 🔧 Tool da Usare

### WebStorm
- Apri la cartella `mobile/` per il codice React Native
- Hot reload automatico quando salvi

### Rider
- Apri la cartella `backend/` per il codice C#
- Utile se vuoi modificare le API

### DataGrip
- Connetti al database Supabase:
  - Host: `0ec90b57d6e95fcbda19832f.supabase.co`
  - Port: `5432`
  - Database: `postgres`
  - User: vedi Supabase dashboard
  - Password: vedi Supabase dashboard

### Android Studio
- Se vuoi creare un build Android reale
- **Non serve** per testare con Expo Go

### Docker
- Backend già configurato in `docker-compose.yml`
- Comandi utili:
  ```bash
  docker-compose up -d      # Avvia
  docker-compose logs -f    # Vedi logs
  docker-compose down       # Ferma
  docker-compose restart    # Riavvia
  ```

---

## 🐛 Problemi?

### "Cannot connect to backend"
- Verifica che Docker sia avviato: `docker ps`
- Controlla IP corretto nel `.env` mobile
- **NON usare** `localhost` nel mobile, usa IP locale

### "Module not found"
```bash
cd mobile
rm -rf node_modules
npm install
```

### "Expo error"
```bash
cd mobile
npm start -- --clear
```

---

## ✅ Checklist

- [ ] Backend avviato (`docker-compose up -d`)
- [ ] Backend risponde (`curl http://localhost:5000/health`)
- [ ] Mobile installato (`npm install`)
- [ ] File `.env` creato con IP corretto
- [ ] App avviata (`npm start`)
- [ ] QR scansionato con Expo Go
- [ ] App visibile sul telefono

---

## 🎉 Fatto!

Se vedi l'app sul telefono, **funziona!**

**Cosa puoi fare ora:**
- Modificare UI in `mobile/src/screens/`
- Modificare API in `backend/SplitExpenses.Api/Controllers/`
- Vedere il database con DataGrip
- Hot reload automatico su tutti i cambiamenti

**Vuoi configurare il login Google?**
- Leggi `FULLSTACK_QUICKSTART.md` sezione OAuth (15 minuti)

---

## 📝 File Utili

- **Questo file** - Setup locale
- **ARCHITECTURE.md** - Come funziona tutto
- **TROUBLESHOOTING.md** - Problemi comuni
- **mobile/src/** - Codice React Native
- **backend/SplitExpenses.Api/** - Codice API

**Ignora** tutti gli altri README, sono vecchi!
