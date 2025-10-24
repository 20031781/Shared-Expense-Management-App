# 🚀 Setup Locale - Split Expenses

## Cosa Hai Bisogno
- ✅ Docker (già hai)
- ✅ Node.js 18+
- ✅ Il tuo telefono con Expo Go installato ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

---

## Step 1: Backend con Docker (2 minuti)

### Configurazione

```bash
# Crea il file .env per il backend
cd backend
```

```powershell
@"
Bolt Database_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
Bolt Database_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw
JWT_SECRET_KEY=questo_e_un_jwt_secret_molto_lungo_e_sicuro_di_almeno_32_caratteri
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FIREBASE_PROJECT_ID=
"@ | Out-File -FilePath .env -Encoding utf8
```

### Avvio

```bash
# Avvia il backend
docker-compose up -d

# Verifica che funziona
curl http://localhost:5000/health
```

Se vedi una risposta, **Backend OK** ✅

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

# Crea .env (sostituisci TUO_IP con quello trovato sopra)
cat > .env << 'EOF'
EXPO_PUBLIC_API_URL=http://TUO_IP:5000/api
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=
EOF
```

**Esempio .env:**
```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:5000/api
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

## ⚠️ Problema Login Google

L'app si aprirà ma il login Google **NON funzionerà** perché serve configurazione OAuth.

### Soluzione Rapida: Salta il Login

Modifica `mobile/App.tsx` (apri con WebStorm):

```typescript
// Trova questa riga (circa riga 30):
{isAuthenticated ? <MainNavigator /> : <AuthNavigator />}

// Sostituisci con:
<MainNavigator />
```

Salva → L'app si ricarica automaticamente → **Sei dentro!** ✅

**Nota:** Le chiamate API falliranno senza token, ma puoi vedere tutta l'UI.

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
