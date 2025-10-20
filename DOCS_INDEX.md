# 📚 Indice Documentazione - Split Expenses

## 🎯 Cosa Leggere (in Ordine)

### 1️⃣ Primo Avvio - INIZIA QUI!
```
START_HERE.md ← LEGGI QUESTO SUBITO!
```
**Contenuto:**
- Setup in 5 minuti
- Come testare l'app con Expo
- Configurazione minima (solo IP)
- Google OAuth opzionale
- Problemi comuni

**Usa questo per:** Avviare l'app la prima volta

---

### 2️⃣ Guida Completa
```
FULLSTACK_QUICKSTART.md
```
**Contenuto:**
- Setup backend + mobile dettagliato
- Configurazione Google OAuth completa
- Testing step-by-step
- Troubleshooting avanzato

**Usa questo per:** Configurazione completa production-ready

---

### 3️⃣ Documentazione Mobile
```
mobile/README.md
mobile/QUICKSTART.md
```
**Contenuto:**
- Architettura React Native
- Struttura progetto dettagliata
- Dependencies spiegate
- Build per production (EAS)
- Testing avanzato

**Usa questo per:** Sviluppare la mobile app

---

### 4️⃣ Documentazione Backend
```
backend/README.md
```
**Contenuto:**
- API endpoints
- Architettura backend
- Database schema
- Docker configuration
- Deployment

**Usa questo per:** Sviluppare backend o fare deploy

---

### 5️⃣ Reference Tecnico
```
ARCHITECTURE.md - Design sistema
PROJECT_SUMMARY.md - Statistiche progetto
MOBILE_COMPLETION.md - Report mobile app
```
**Usa questi per:** Capire design e architettura

---

### 6️⃣ Supporto
```
TROUBLESHOOTING.md
```
**Contenuto:**
- Errori comuni
- Soluzioni step-by-step
- FAQ
- Contatti supporto

**Usa questo per:** Risolvere problemi

---

## 📁 Struttura File Documentazione

```
project/
├── START_HERE.md                    ← PRIMO FILE DA LEGGERE!
├── FULLSTACK_QUICKSTART.md          ← Guida completa
├── README.md                         ← Overview progetto
│
├── mobile/
│   ├── README.md                     ← Docs mobile dettagliate
│   └── QUICKSTART.md                 ← Mobile quick start
│
├── backend/
│   └── README.md                     ← Docs backend
│
├── ARCHITECTURE.md                   ← Design sistema
├── PROJECT_SUMMARY.md                ← Statistiche
├── MOBILE_COMPLETION.md              ← Report mobile
├── TROUBLESHOOTING.md                ← Risoluzione problemi
├── LICENSE.md                        ← Licenza
│
└── docs/archive/                     ← File vecchi (ignorabili)
    ├── GETTING_STARTED.md
    ├── QUICK_START.md
    ├── COMPLETION_REPORT.txt
    ├── FINAL_REPORT.txt
    └── ...
```

---

## 🎯 File per Scenario

### "Voglio testare subito l'app"
1. `START_HERE.md`
2. Fatto! ✅

### "Voglio configurare tutto per bene"
1. `START_HERE.md`
2. `FULLSTACK_QUICKSTART.md`
3. `mobile/README.md`

### "Voglio sviluppare features"
1. `mobile/README.md` (per mobile)
2. `backend/README.md` (per backend)
3. `ARCHITECTURE.md` (design)

### "Ho un problema"
1. `TROUBLESHOOTING.md`
2. `START_HERE.md` (sezione problemi)

### "Voglio capire il progetto"
1. `README.md` (overview)
2. `PROJECT_SUMMARY.md` (statistiche)
3. `ARCHITECTURE.md` (design)

### "Voglio fare deploy"
1. `backend/README.md` (deploy backend)
2. `mobile/README.md` (build app)

---

## ✅ File Importanti (Leggi Questi)

- ✅ **START_HERE.md** - Setup veloce
- ✅ **FULLSTACK_QUICKSTART.md** - Guida completa
- ✅ **mobile/README.md** - Docs mobile
- ✅ **TROUBLESHOOTING.md** - Problemi

## ⚠️ File Archive (Puoi Ignorare)

- ❌ `docs/archive/*` - File vecchi sostituiti

## 📊 File Reference (Leggi Se Serve)

- 📖 **ARCHITECTURE.md** - Design dettagliato
- 📖 **PROJECT_SUMMARY.md** - Statistiche
- 📖 **MOBILE_COMPLETION.md** - Report mobile

---

## 🚀 Path Veloce

```bash
# 1. Leggi
cat START_HERE.md

# 2. Configura
cd backend && docker-compose up -d
cd ../mobile && npm install

# 3. Crea .env
echo "EXPO_PUBLIC_API_URL=http://TUO_IP:5000/api" > mobile/.env

# 4. Avvia
cd mobile && npm start

# 5. Scansiona QR con Expo Go

# ✅ FATTO!
```

---

## 💡 Tips

- **Non sai da dove iniziare?** → `START_HERE.md`
- **App non funziona?** → `TROUBLESHOOTING.md`
- **Vuoi sviluppare?** → `mobile/README.md` + `backend/README.md`
- **Vuoi capire architettura?** → `ARCHITECTURE.md`
- **Hai dubbi?** → Cerca in `PROJECT_SUMMARY.md`

---

**Creato**: 2025-10-10
**Ultimo update**: 2025-10-10
**Versione**: 1.0.0
