# 🚀 Full Stack Quick Start

## Avvia Backend + Mobile App in 10 Minuti

---

## Prerequisiti

Prima di iniziare, assicurati di avere:

- ✅ Node.js 18+ e npm
- ✅ Docker e Docker Compose
- ✅ Expo Go app sul telefono
- ✅ Account Google Cloud (per OAuth)
- ✅ Account Supabase (già configurato)

---

## Step 1: Backend Setup (5 minuti)

### 1.1 Configura Environment

```bash
cd backend
cp .env.example .env
```

Verifica che `.env` contenga:
```env
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
JWT_SECRET_KEY=your-super-secret-key-change-me
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 1.2 Avvia Backend

```bash
docker-compose up -d
```

### 1.3 Verifica

```bash
# Backend dovrebbe rispondere
curl http://localhost:5000/health

# Output: {"status":"healthy"}
```

✅ **Backend Running on http://localhost:5000**

---

## Step 2: Mobile Setup (5 minuti)

### 2.1 Installa Dipendenze

```bash
cd ../mobile
npm install
```

### 2.2 Configura Environment

```bash
cp .env.example .env
```

**IMPORTANTE**: Usa il tuo IP locale, NON localhost!

```bash
# Mac/Linux - Trova il tuo IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

Edita `.env`:
```env
# Usa il TUO IP locale!
EXPO_PUBLIC_API_URL=http://192.168.1.100:5000/api

# Google OAuth (configurare dopo)
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=xxx.apps.googleusercontent.com
```

### 2.3 Avvia Mobile App

```bash
npm start
```

### 2.4 Apri su Telefono

1. Apri **Expo Go** sul telefono
2. Scansiona il **QR code** dal terminale
3. Aspetta che l'app si carichi
4. ✅ **App Running!**

---

## Step 3: Google OAuth Setup (Opzionale)

Se vuoi il login funzionante, configura Google OAuth:

### 3.1 Google Cloud Console

1. Vai su https://console.cloud.google.com/
2. Crea nuovo progetto o seleziona esistente
3. Abilita **Google Sign-In API**
4. Vai a **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**

### 3.2 Crea Client IDs

**Per Web** (Backend):
- Application Type: **Web Application**
- Authorized redirect URIs: `http://localhost:5000/auth/google/callback`
- Copia **Client ID** e **Client Secret**

**Per iOS** (Mobile):
- Application Type: **iOS**
- Bundle ID: `com.splitexpenses.app`
- Copia **Client ID**

**Per Android** (Mobile):
- Application Type: **Android**
- Package name: `com.splitexpenses.app`
- SHA-1 certificate: Ottieni con `expo credentials:manager -p android`
- Copia **Client ID**

### 3.3 Aggiorna .env Files

**Backend** (`backend/.env`):
```env
GOOGLE_CLIENT_ID=your-web-client-id
GOOGLE_CLIENT_SECRET=your-web-client-secret
```

**Mobile** (`mobile/.env`):
```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=your-ios-client-id
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=your-android-client-id
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=your-web-client-id
```

### 3.4 Riavvia

```bash
# Backend
cd backend
docker-compose restart

# Mobile (nessun riavvio necessario, hot reload)
```

---

## 🎉 You're Done!

Ora hai:
- ✅ Backend API running su http://localhost:5000
- ✅ Swagger docs su http://localhost:5000/swagger
- ✅ Mobile app sul tuo telefono
- ✅ Database Supabase configurato
- ✅ Google OAuth (opzionale)

---

## 🧪 Test the Stack

### Test 1: Backend Health
```bash
curl http://localhost:5000/health
```

### Test 2: Backend API
```bash
# Swagger UI
open http://localhost:5000/swagger
```

### Test 3: Mobile App
1. Apri app su telefono
2. Prova a creare una lista
3. Aggiungi una spesa
4. ✅ Funziona!

---

## 🐛 Troubleshooting

### Mobile: "Network Request Failed"

**Problema**: App non raggiunge backend

**Soluzione**:
```bash
# Verifica che backend sia running
curl http://localhost:5000/health

# Verifica IP in mobile/.env
# DEVE essere il TUO IP locale, non localhost!
EXPO_PUBLIC_API_URL=http://192.168.1.X:5000/api

# Riavvia mobile app
npm start
```

### Backend: "Connection Refused"

**Problema**: Docker non parte

**Soluzione**:
```bash
# Controlla logs
docker-compose logs

# Riavvia
docker-compose down
docker-compose up -d
```

### Google OAuth: "Invalid Client"

**Problema**: Client ID non valido

**Soluzione**:
- Verifica Client IDs in `.env`
- Controlla che OAuth consent screen sia configurato
- Per Android, verifica SHA-1 certificate

---

## 🔥 Pro Tips

### 1. Usa ngrok per Testing

Se hai problemi con IP locale:

```bash
# Installa ngrok
brew install ngrok  # Mac
# oppure scarica da ngrok.com

# Avvia tunnel
ngrok http 5000

# Usa URL ngrok in mobile/.env
EXPO_PUBLIC_API_URL=https://abc123.ngrok.io/api
```

### 2. Hot Reload

Mobile app si ricarica automaticamente quando salvi file!

```bash
# Edita qualsiasi file in mobile/src/
# Salva
# App si aggiorna sul telefono!
```

### 3. Debug Console

```typescript
// Aggiungi in qualsiasi component
console.log('Debug:', data);

// Logs appaiono nel terminal dove hai fatto npm start
```

### 4. Shake Device

Agita il telefono per aprire il **Dev Menu**:
- Reload
- Debug
- Performance Monitor

---

## 📊 Architecture Overview

```
┌─────────────┐
│   Mobile    │  React Native + Expo
│   App       │  TypeScript
└──────┬──────┘
       │ HTTP/REST
       │
┌──────▼──────┐
│   Backend   │  ASP.NET Core Web API
│   API       │  C#
└──────┬──────┘
       │
┌──────▼──────┐
│  Supabase   │  PostgreSQL + Auth + Storage
│  Database   │
└─────────────┘
```

---

## 📁 Project Structure

```
project/
├── backend/              # ASP.NET Core API ✅
│   ├── SplitExpenses.Api/
│   ├── docker-compose.yml
│   └── .env
│
├── mobile/              # React Native + Expo ✅
│   ├── src/
│   ├── App.tsx
│   ├── package.json
│   └── .env
│
├── supabase/            # Database migrations ✅
│   └── migrations/
│
└── *.md                 # Documentation ✅
```

---

## 🎯 Next Steps

### Immediate
1. ✅ Test creazione lista
2. ✅ Test creazione spesa
3. ✅ Test upload foto

### Short Term
1. Configure Google OAuth completamente
2. Invita altri utenti
3. Testa workflow validazione

### Medium Term
1. Deploy backend su server/NAS
2. Build mobile app per production
3. Publish su App Store/Play Store

---

## 📚 Detailed Documentation

- **Backend**: `backend/README.md`
- **Mobile**: `mobile/README.md`
- **Mobile Quick**: `mobile/QUICKSTART.md`
- **Architecture**: `ARCHITECTURE.md`
- **Troubleshooting**: `TROUBLESHOOTING.md`

---

## 💬 Common Questions

### Q: Posso usare iOS Simulator?
**A**: Sì! `cd mobile && npm run ios` (richiede Xcode su Mac)

### Q: Posso usare Android Emulator?
**A**: Sì! `cd mobile && npm run android` (richiede Android Studio)

### Q: Funziona su web?
**A**: Sì! `cd mobile && npm run web` (apre browser)

### Q: Devo avere Google OAuth?
**A**: No per testing. Sì per production.

### Q: Quanto costa?
**A**:
- Supabase: Free tier (500MB database, 2GB storage)
- Google OAuth: Gratis
- Expo: Gratis (EAS Build $29/mese per production)
- Apple Developer: $99/anno (solo per iOS)
- Google Play: $25 one-time (solo per Android)

---

## 🎉 Success!

Se sei arrivato qui, hai un'app full-stack funzionante!

**Prossimi passi**:
1. Gioca con l'app
2. Personalizza UI
3. Aggiungi features
4. Deploy in production

**Buon divertimento! 🚀**

---

**Generated**: 2025-10-10
**Version**: 1.0.0
**Status**: Full Stack Complete ✅
