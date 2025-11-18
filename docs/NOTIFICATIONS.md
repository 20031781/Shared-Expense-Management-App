# Notifiche push

Questa pagina riepiloga come personalizzare e testare le notifiche push tra app mobile e API.

## Preferenze lato app

1. Apri **Impostazioni → Notifiche** nell'app mobile.
2. Abilita/disabilita i toggle per:
    - **Nuova spesa**
    - **Spesa eliminata**
    - **Nuovo membro**
    - **Richiesta di validazione**
    - **Esito validazione**
    - **Rimborsi**
3. Le preferenze vengono salvate tramite `PUT /api/auth/profile` e sono applicate a tutte le notifiche successive
   inviate dal backend.

> Suggerimento: i toggle sono disponibili anche per nuovi utenti grazie ai valori di default impostati lato server.

## Registrare il device

L'app mobile ora richiede automaticamente i permessi di notifica e registra il token FCM tramite
`/api/auth/device-token`
ogni volta che effettui il login (o riapri l'app dopo un logout). Dopo il primo avvio puoi già trovare i token associati
nella tabella `device_tokens` del database (colonne `token` e `platform`). Non è necessario generare manualmente un token
dal portale Firebase: l'app ottiene il valore direttamente da Firebase Cloud Messaging e lo salva per te.

Se vuoi forzare o testare la registrazione manuale puoi comunque usare:

```powershell
curl -X POST http://localhost:5000/api/auth/device-token `
  -H "Authorization: Bearer <ACCESS_TOKEN>" `
  -H "Content-Type: application/json" `
  -d '{"token":"<FCM_TOKEN>","platform":"android"}'
```

> Nota: Sostituisci `<FCM_TOKEN>` con il token reale generato da Firebase Cloud Messaging e visibile nella tabella
> `device_tokens` (vedi sezione successiva). Imposta `platform` a `ios` se stai testando su iPhone/iPad.

### Expo Go vs build reali

- Dalla SDK 53 Expo Go ha **rimosso** il supporto alle notifiche remote Android/iOS. I permessi vengono comunque richiesti,
  ma nessun token viene restituito e il backend non potrà mai inviare notifiche.
- Usa una development build o il dev client Expo (`npx expo run:android --variant development`, `npx expo run:ios`) per
  ottenere un vero token FCM/APNS. In alternativa, crea un build EAS con `eas build --profile development`.
- Le build native (development/preview/production) create con `npx expo run:* --variant release` oppure `eas build --profile`
  `preview|production` hanno il supporto completo a FCM/APNS: l'app registra automaticamente il token dopo il login e il
  backend può inviare notifiche anche nelle versioni pubblicate sugli store senza dover cambiare codice.
- In Expo Go o nel browser la registrazione viene saltata appositamente per evitare errori e log inutili: passa a una build
  dedicata quando vuoi verificare le push.

## Recuperare i token per gli endpoint di test

Gli endpoint descritti sotto richiedono sia un access token JWT valido sia almeno un token FCM registrato. Puoi
recuperarli
così:

### Access token

1. Usa le stesse credenziali dell'app mobile per autenticarti via REST (`POST /api/auth/login`).
2. Esempio:

   ```powershell
   curl -X POST "http://localhost:5000/api/auth/login" `
   -H "Content-Type: application/json" `
   -d '{"email":"lorenzoappetito@gmail.com","password":"Daicazzo22"}'
   ```

3. Copia il campo `accessToken` dalla risposta e riutilizzalo come `Bearer <ACCESS_TOKEN>` negli esempi.

### Token FCM

1. Avvia l'app (Android o iOS) e accedi con il tuo account.
2. Verifica che in Postgres esista un record nella tabella `device_tokens` per il tuo `user_id`:

   ```sql
   select token, platform, created_at from device_tokens where user_id = '<USER_ID>' order by created_at desc limit 5;
   ```

3. Copia il valore `token` (è quello da inserire in `<FCM_TOKEN>` negli esempi cURL oppure da usare per i test su
   Firebase`).
4. In alternativa puoi leggere il token direttamente dalla risposta di `POST /api/auth/device-token` se decidi di
   registrarlo manualmente.

> Se la tabella rimane vuota significa che il dispositivo non ha concesso i permessi di notifica oppure non ha
> completato il
> login. Apri Impostazioni → Notifiche nell'app, abilita i toggle e riavvia l'app per forzare una nuova registrazione.

## Endpoint di test

Gli endpoint di test richiedono autenticazione JWT e permettono di simulare ogni tipologia di notifica senza dover
riprodurre l'intero flusso applicativo.

| Evento                | Endpoint                                                                    | Note                                                           |
|-----------------------|-----------------------------------------------------------------------------|----------------------------------------------------------------|
| Nuova spesa           | `POST /api/notifications/test/new-expense/{expenseId}`                      | Richiede un `expenseId` valido.                                |
| Nuovo membro          | `POST /api/notifications/test/member-added/{listId}/{memberId}`             | Usa l'`id` del membro appena creato.                           |
| Richiesta validazione | `POST /api/notifications/test/validation-request/{expenseId}/{validatorId}` | `validatorId` è l'`id` utente del validatore.                  |
| Esito validazione     | `POST /api/notifications/test/validation-result/{expenseId}?approved=true`  | Imposta `approved=false` per simulare un rifiuto.              |
| Rimborso              | `POST /api/notifications/test/reimbursement/{reimbursementId}`              | Notifica sia debitore che creditore (in base alle preferenze). |

> La tabella `notifications` del database resta vuota finché non invii un evento di test: è normale se hai solo aperto
> l'app senza aver chiamato questi endpoint.

### Esempio completo

```bash
# Nuova spesa
curl -X POST http://localhost:5000/api/notifications/test/new-expense/00000000-0000-0000-0000-000000000000 \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# Nuovo membro
curl -X POST http://localhost:5000/api/notifications/test/member-added/<LIST_ID>/<MEMBER_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

In caso di errori controlla che gli `id` esistano nel database e che gli utenti destinatari abbiano almeno un device
token registrato.

## Flusso consigliato per i test manuali

1. Avvia backend (`cd backend && dotnet run`) e mobile (`cd mobile && npm start`).
2. Accedi dall'app, crea una lista e una spesa di esempio.
3. Registra il token del dispositivo tramite `/api/auth/device-token`.
4. Usa gli endpoint di test per generare notifiche dedicate al caso che vuoi verificare.
5. Modifica i toggle in Impostazioni → Notifiche per verificare che ciascun tipo venga rispettato.

---

# TEMPORANEO

Registrazione manuale con token FCM:

```powershell
curl -X POST http://localhost:5000/api/auth/device-token `
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMWZmMDRlMC0yYTA0LTQ0NTYtYTIxMi03NzkwYWMwZTQxYTEiLCJlbWFpbCI6ImxvcmVuem9hcHBldGl0b0BnbWFpbC5jb20iLCJuYW1lIjoibG9yZW56b2FwcGV0aXRvIiwianRpIjoiYmQxNmFmYTMtYzFjOC00YmZkLThjZGUtOWU2YmM5ZTk4ZjkxIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvZW1haWxhZGRyZXNzIjoibG9yZW56b2FwcGV0aXRvQGdtYWlsLmNvbSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFkbWluIiwiZXhwIjoxNzYzNDE5MzI5LCJpc3MiOiJTcGxpdEV4cGVuc2VzQXBpIiwiYXVkIjoiU3BsaXRFeHBlbnNlc0FwcCJ9.vKhuQuqHUNNBss5H-3IQW6r83V6geq2YIJKUOkUALZw" `
-H "Content-Type: application/json" `
-d '{"token":"e_octOePRqelKUUU-lU-PY:APA91bGgig6zHDeUS09-Tu7KAHpxzAyOijVeMDu6CwhzfFMdhZKlsUj4podIXiJVuqKbzQgY3ZnxJBjLYSpCMRhC0QvmzUFcjFqYGwqgLMQOwLjIQAH8Tx8","platform":"android"}'
```

Nuova spesa:

```powershell
curl -X POST http://localhost:5000/api/notifications/test/new-expense/de04c8c7-1f4d-4d05-a0ca-a3dc9043d9c7 `
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMWZmMDRlMC0yYTA0LTQ0NTYtYTIxMi03NzkwYWMwZTQxYTEiLCJlbWFpbCI6ImxvcmVuem9hcHBldGl0b0BnbWFpbC5jb20iLCJuYW1lIjoibG9yZW56b2FwcGV0aXRvIiwianRpIjoiYmQxNmFmYTMtYzFjOC00YmZkLThjZGUtOWU2YmM5ZTk4ZjkxIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvZW1haWxhZGRyZXNzIjoibG9yZW56b2FwcGV0aXRvQGdtYWlsLmNvbSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFkbWluIiwiZXhwIjoxNzYzNDE5MzI5LCJpc3MiOiJTcGxpdEV4cGVuc2VzQXBpIiwiYXVkIjoiU3BsaXRFeHBlbnNlc0FwcCJ9.vKhuQuqHUNNBss5H-3IQW6r83V6geq2YIJKUOkUALZw"
```

Nuovo membro:

```powershell
curl -X POST http://localhost:5000/api/notifications/test/member-added/<LIST_ID>/<MEMBER_ID> `
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMWZmMDRlMC0yYTA0LTQ0NTYtYTIxMi03NzkwYWMwZTQxYTEiLCJlbWFpbCI6ImxvcmVuem9hcHBldGl0b0BnbWFpbC5jb20iLCJuYW1lIjoibG9yZW56b2FwcGV0aXRvIiwianRpIjoiYmQxNmFmYTMtYzFjOC00YmZkLThjZGUtOWU2YmM5ZTk4ZjkxIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvZW1haWxhZGRyZXNzIjoibG9yZW56b2FwcGV0aXRvQGdtYWlsLmNvbSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFkbWluIiwiZXhwIjoxNzYzNDE5MzI5LCJpc3MiOiJTcGxpdEV4cGVuc2VzQXBpIiwiYXVkIjoiU3BsaXRFeHBlbnNlc0FwcCJ9.vKhuQuqHUNNBss5H-3IQW6r83V6geq2YIJKUOkUALZw"
```