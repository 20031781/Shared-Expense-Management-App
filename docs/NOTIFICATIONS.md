# Notifiche push

Questa pagina riepiloga come personalizzare e testare le notifiche push tra app mobile e API.

## Preferenze lato app

1. Apri **Impostazioni → Notifiche** nell'app mobile.
2. Abilita/disabilita i toggle per:
    - **Nuova spesa**
    - **Nuovo membro**
    - **Richiesta di validazione**
    - **Esito validazione**
    - **Rimborsi**
3. Le preferenze vengono salvate tramite `PUT /api/auth/profile` e sono applicate a tutte le notifiche successive
   inviate dal backend.

> Suggerimento: i toggle sono disponibili anche per nuovi utenti grazie ai valori di default impostati lato server.

## Registrare il device

Assicurati che il token FCM del dispositivo sia registrato con:

```bash
curl -X POST http://localhost:5000/api/auth/device-token \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"token":"<FCM_TOKEN>","platform":"ios"}'
```

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
