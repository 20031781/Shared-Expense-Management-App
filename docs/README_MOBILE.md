# Split Expenses - App mobile

Applicazione mobile React Native + Expo per gestire le spese condivise.

## Aggiornamenti rapidi

- Corrette le animazioni dei grafici Insights per evitare errori runtime legati a domini non validi.
- Ridimensionati i pulsanti delle azioni swipe nelle liste spese per una presentazione più compatta.

## Prerequisiti

- Node.js 18+ e npm
- Expo CLI: `npm install -g expo-cli`
- App Expo Go sul telefono (per i test)

## Configurazione

### 1. Installare le dipendenze

```bash
cd mobile
npm install
```

### 2. Configurare l'ambiente

```bash
cp .env.example .env
```

Modifica `.env` e configura:

- `EXPO_PUBLIC_API_URL` - L'URL della tua API backend
- Gli ID client di Google OAuth (ottienili dalla Google Cloud Console)

### 3. Configurare Google OAuth

1. Vai alla [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuovo progetto o selezionane uno esistente
3. Abilita la Google Sign-In API
4. Crea le credenziali OAuth 2.0:
    - **iOS**: client ID iOS
    - **Android**: client ID Android (usa lo SHA-1 fornito da Expo)
    - **Web**: client ID Web

Per ottenere lo SHA-1 Android per Expo:

```bash
expo credentials:manager -p android
```

### 4. Avviare il server di sviluppo

```bash
npm start
```

Questo avvierà Expo Dev Tools. Puoi:

- Premere `i` per il simulatore iOS
- Premere `a` per l'emulatore Android
- Scansionare il QR code con l'app Expo Go

## Struttura del progetto

```
mobile/
├── src/
│   ├── components/      # Componenti UI riutilizzabili
│   ├── screens/         # Componenti di schermata
│   ├── services/        # API e logica di business
│   ├── store/           # Gestione stato con Zustand
│   ├── navigation/      # Configurazione della navigazione
│   ├── hooks/           # Custom React hooks
│   ├── types/           # Tipi TypeScript
│   └── utils/           # Funzioni di utilità
├── App.tsx              # Punto di ingresso principale dell'app
├── app.json             # Configurazione Expo
└── package.json         # Dipendenze
```

## Sviluppo

### Esecuzione su simulatore iOS

```bash
npm run ios
```

Richiede Xcode su macOS.

### Esecuzione su emulatore Android

```bash
npm run android
```

Richiede Android Studio.

### Controllo dei tipi

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Build per la produzione

### 1. Configurare EAS (Expo Application Services)

```bash
npm install -g eas-cli
eas login
eas build:configure
```

### 2. Generare APK Android

```bash
eas build --platform android --profile preview
```

### 3. Generare IPA iOS

```bash
eas build --platform ios --profile preview
```

Richiede un account Apple Developer (99$/anno).

## API Backend

L'app si connette all'API del backend. Assicurati che:

1. Il backend sia in esecuzione (vedi [README.md](../../../README.md))
2. L'URL del backend sia impostato correttamente in `.env`
3. Il backend sia raggiungibile dal tuo dispositivo (usa ngrok per i test locali)

### Uso di ngrok per i test locali

```bash
# In un altro terminale
ngrok http 5000

# Copia l'URL https in .env
EXPO_PUBLIC_API_URL=https://your-id.ngrok.io/api
```

## Risoluzione dei problemi

### Impossibile connettersi all'API

- Verifica che il backend sia in esecuzione
- Verifica l'URL dell'API in `.env`
- Per i test locali, usa l'IP del tuo computer o ngrok
- Controlla le impostazioni del firewall

### Accesso con Google non funzionante

- Verifica i Client ID in `.env`
- Controlla che la schermata di consenso OAuth sia configurata
- Su Android, verifica il certificato SHA-1
- Su iOS, verifica il bundle identifier

### Errori di risoluzione dei moduli

```bash
# Pulisci la cache e reinstalla
rm -rf node_modules
npm install
expo start -c
```

## Test su dispositivo reale

### Utilizzo di Expo Go (più semplice)

1. Installa Expo Go da App Store/Play Store
2. Esegui `npm start`
3. Scansiona il QR code con Expo Go

### Utilizzo di una build di sviluppo

Per funzionalità non supportate da Expo Go (come codice nativo personalizzato):

```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

## Roadmap delle funzionalità

- [x] Autenticazione con Google
- [x] Gestione delle liste
- [x] CRUD delle spese
- [x] Foto degli scontrini
- [x] Inviti ai membri
- [ ] Supporto offline con SQLite
- [ ] Notifiche push
- [ ] Flusso di validazione delle spese
- [ ] Vista rimborsi
- [ ] Impostazioni profilo
- [ ] Tema scuro
- [ ] Supporto multilingua

## Stack tecnologico

- **Framework**: React Native + Expo
- **Linguaggio**: TypeScript
- **Navigazione**: React Navigation
- **Gestione stato**: Zustand
- **Client API**: Axios
- **Data fetching**: React Query
- **Storage**: Expo SecureStore + AsyncStorage
- **Autenticazione**: Expo Auth Session (Google OAuth)
- **Componenti UI**: Componenti personalizzati
- **Icone**: @expo/vector-icons

## Licenza

Vedi LICENSE.md nella root del progetto
