# Split Expenses - Mobile

Client React Native + Expo (TypeScript) per liste spese, validazione e rimborsi.

## Requisiti

- Node.js 18+ e npm
- Expo CLI (inclusa in `npm start`), Expo Go sul dispositivo oppure emulatori iOS/Android
- Backend API raggiungibile (porta 5000 di default); il backend supporta Google OAuth ma la UI non espone il login.

## Setup rapido

```bash
cp docs/.env.example.mobile mobile/.env    # imposta l'URL dell'API
cd mobile
npm install
npm start                                   # apre Metro bundler + QR code
```

- Premi `a` o `i` per avviare l'emulatore, oppure scansiona il QR con Expo Go.
- Per le notifiche push genera un **development build**: `npx expo run:android` oppure
  `npx expo run:ios --configuration Debug`.

## Variabili d'ambiente

`EXPO_PUBLIC_API_URL` deve puntare all'API (es. `http://192.168.1.60:5000/api`). Il backend deve esporre HTTPS o HTTP
raggiungibile dal dispositivo.

## Google OAuth

Il backend è predisposto per verificare ID token Google; l'app mobile attuale non include la schermata di accesso,
quindi il flusso non è utilizzabile da UI.

## Struttura del progetto

```
mobile/
├── App.tsx              # entrypoint
├── src/
│   ├── components/      # UI riutilizzabile
│   ├── screens/         # Home, Lists, Expenses, Insights, Settings
│   ├── services/        # api/auth/lists/expenses/reimbursements
│   ├── store/           # Zustand (auth, liste, spese, impostazioni)
│   ├── navigation/      # stack + tab navigator
│   ├── theme/           # light/dark tokens
│   ├── i18n/            # dizionari IT/EN
│   └── types/           # tipi condivisi
└── package.json
```

## Script utili

- `npm start` – avvia Metro/Expo.
- `npm run android` / `npm run ios` – apre emulatori con hot reload.
- `npm run lint` – ESLint con regole Expo.
- `npm run type-check` – TypeScript senza emissione.
- `npm run build:android-apk` – build EAS profilo `preview` (APK di test).

## Funzionalità principali

- Memorizzazione sicura di JWT/refresh token e logout rapido (login Google non presente in UI).
- Gestione liste con inviti, ruoli admin/validatore, quote di ripartizione e rename via swipe.
- Creazione/modifica spese con foto scontrino, beneficiari personalizzati, metodo di pagamento e data reale.
- Tab Insights con grafici Victory (barre, torta, trend) e filtri per lista/membro/periodo.
- Rimborsi ottimizzati e riepiloghi per pagatore/debitore, con preferenze notifiche granulari.
- Localizzazione IT/EN, tema chiaro/scuro e messaggi di errore coerenti offline/online.

## Risoluzione rapida

- **Network error:** controlla l'IP nel `.env` e che il backend sia su `0.0.0.0:5000`.
- **Accesso Google non visibile:** abilita il flusso solo tramite chiamate dirette all'API finché la UI non lo espone.
- **Cache corrotta:** `rm -rf node_modules && npm install && expo start -c`.
- **Errore JSX "Expected corresponding closing tag":** verifica la chiusura di tutti i componenti (es. `<View>`/`</View>`) nella
  schermata che fallisce il bundling.
- **Grafici Insights bloccati:** la schermata ora mostra un messaggio di fallback se Victory non riesce a renderizzare;
  ricarica (pull-to-refresh) per forzare il recupero dei dati e la nuova generazione dei grafici.
