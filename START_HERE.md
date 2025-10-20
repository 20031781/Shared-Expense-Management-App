# 🚀 START HERE - Split Expenses

## ⚡ Quick Start (5 minuti)

### Puoi Testare l'App SUBITO con Expo!

**Requisiti minimi:**
- ✅ Node.js 18+ installato
- ✅ Expo Go app sul telefono ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

**NON serve configurare nulla per il primo test!**

---

## 🎯 Avvio Rapido

### Step 1: Backend (2 minuti)

```bash
cd backend
docker-compose up -d
```

Backend running su http://localhost:5000 ✅

### Step 2: Mobile App (3 minuti)

```bash
cd mobile
npm install
```

Crea file `.env`:
```bash
# Trova il tuo IP locale
# Mac/Linux: ifconfig | grep "inet " | grep -v 127.0.0.1
# Windows: ipconfig

# Crea .env
cat > .env << EOF
EXPO_PUBLIC_API_URL=http://TUO_IP_QUI:5000/api

# Google OAuth (opzionale per ora)
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=
EOF
```

**Esempio .env:**
```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:5000/api
```

Avvia app:
```bash
npm start
```

Scansiona QR con Expo Go → **App funziona!** 🎉

---

## ⚠️ Limitazione: Google OAuth

**Problema:** Il login Google richiede configurazione OAuth.

**Soluzioni:**

### Opzione A: Testa Senza Login (Più Veloce)

Commenta il controllo auth in `mobile/App.tsx`:

```typescript
// Riga ~30
return (
  <NavigationContainer>
    {/* {isAuthenticated ? <MainNavigator /> : <AuthNavigator />} */}
    <MainNavigator />  {/* Mostra sempre l'app */}
  </NavigationContainer>
);
```

Riavvia app → Accesso diretto alle schermate! ✅

### Opzione B: Configura Google OAuth (15 minuti)

Vedi sezione "Google OAuth Setup" sotto.

---

## 📱 Cosa Puoi Testare SUBITO

Anche senza login puoi testare:
- ✅ UI e navigazione
- ✅ Schermate liste
- ✅ Form creazione spesa
- ✅ Upload foto
- ⚠️ API calls falliranno (serve autenticazione)

Con login OAuth configurato:
- ✅ Tutto funziona al 100%!

---

## 🔧 Configurazione Google OAuth (Opzionale)

### 1. Google Cloud Console

1. Vai su https://console.cloud.google.com/
2. Crea nuovo progetto: "Split Expenses"
3. Abilita **Google Sign-In API**
4. Vai a **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**

### 2. Crea Client IDs

**Web (Backend):**
- Type: Web Application
- Name: Split Expenses Backend
- Authorized redirect URIs: `http://localhost:5000/auth/google/callback`
- **Copia Client ID e Secret**

**iOS:**
- Type: iOS
- Bundle ID: `com.splitexpenses.app`
- **Copia Client ID**

**Android:**
- Type: Android
- Package name: `com.splitexpenses.app`
- SHA-1: Ottieni con `npx expo credentials:manager`
- **Copia Client ID**

### 3. Configura Backend

`backend/.env`:
```env
GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-web-client-secret
```

```bash
cd backend
docker-compose restart
```

### 4. Configura Mobile

`mobile/.env`:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:5000/api
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=your-ios-client-id
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=your-android-client-id
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=your-web-client-id
```

App si ricarica automaticamente → Login funziona! ✅

---

## 📚 Documentazione Utile

### Per Iniziare
- **START_HERE.md** ← Sei qui!
- **FULLSTACK_QUICKSTART.md** - Guida completa step-by-step

### Documentazione Tecnica
- **README.md** - Overview progetto
- **mobile/README.md** - Documentazione mobile dettagliata
- **backend/README.md** - Documentazione backend

### Reference
- **ARCHITECTURE.md** - Design e architettura
- **TROUBLESHOOTING.md** - Risoluzione problemi
- **PROJECT_SUMMARY.md** - Statistiche progetto
- **MOBILE_COMPLETION.md** - Report mobile app

### Archive (non servono)
- `docs/archive/` - File vecchi archiviati

---

## 🐛 Problemi Comuni

### "Network Request Failed"

**Causa:** App non raggiunge backend

**Soluzione:**
1. Verifica backend running: `curl http://localhost:5000/health`
2. Usa IP locale in `.env`, NON localhost
3. Verifica firewall permette porta 5000

### "Cannot connect to Expo"

**Soluzione:**
```bash
cd mobile
rm -rf node_modules .expo
npm install
expo start -c
```

### "Module not found"

**Soluzione:**
```bash
cd mobile
npm install
```

---

## 🎯 Percorsi Consigliati

### 1. Testing Veloce (ORA!)
```bash
# Backend
cd backend && docker-compose up -d

# Mobile
cd mobile && npm install
# Crea .env con il tuo IP
npm start
# Scansiona QR
```

### 2. Con Google OAuth (15 min)
- Segui "Configurazione Google OAuth" sopra
- Login funzionante
- Tutte le API calls funzionano

### 3. Development Completo
- OAuth configurato
- Leggi documentazione tecnica
- Sviluppa nuove features

---

## 💡 Tips

### Hot Reload
Modifica qualsiasi file in `mobile/src/` → App si aggiorna automaticamente!

### Debug
```typescript
console.log('Debug:', data);
// Logs appaiono nel terminal
```

### Dev Menu
Scuoti il telefono → Menu sviluppatore

### Reset App
```bash
expo start -c  # Clear cache
```

---

## ✅ Checklist Primo Avvio

- [ ] Node.js 18+ installato
- [ ] Docker installato
- [ ] Expo Go sul telefono
- [ ] Backend avviato (`docker-compose up -d`)
- [ ] Mobile installato (`npm install`)
- [ ] File `.env` creato con IP locale
- [ ] App avviata (`npm start`)
- [ ] QR scansionato con Expo Go
- [ ] App aperta sul telefono ✅

---

## 🚀 Prossimi Passi

Dopo il primo test:

1. **Configura OAuth** - Login funzionante
2. **Testa tutte le features** - Liste, spese, foto
3. **Personalizza** - Colori, logo, branding
4. **Sviluppa** - Aggiungi nuove schermate
5. **Deploy** - Production build

---

## 📞 Aiuto

**Non funziona qualcosa?**
- Controlla **TROUBLESHOOTING.md**
- Leggi **FULLSTACK_QUICKSTART.md**
- Verifica logs: `docker-compose logs` (backend)

**Vuoi saperne di più?**
- **ARCHITECTURE.md** - Design sistema
- **mobile/README.md** - Dettagli mobile
- **PROJECT_SUMMARY.md** - Statistiche

---

## 🎉 Successo!

Se vedi l'app sul telefono, **CE L'HAI FATTA!** 🎊

Hai un'app full-stack funzionante:
- ✅ Backend API
- ✅ Mobile React Native
- ✅ Database PostgreSQL
- ✅ Hot reload attivo
- ✅ Pronta per sviluppo

**Inizia a sviluppare! 🚀**

---

**Creato**: 2025-10-10
**Versione**: 1.0.0
**Tech**: React Native + Expo + ASP.NET Core + PostgreSQL
