# Pubblicazione API su NAS Synology con Traefik + HTTPS

## 1. Obiettivo

Esporre in sicurezza le API Docker su NAS Synology DS224+ tramite
Traefik, con dominio: `sharedexpenseapi.loreappe.work` e certificati
HTTPS Let's Encrypt.

## 2. Struttura del progetto Docker

Cartella principale: `sharedExpenseApp`

### Contiene:

-   **Postgres**
-   **API** (`loreappe/shared-expense-api`)
-   **Traefik** (reverse proxy)
-   **letsencrypt/acme.json**
-   **.env**

### Porte interne:

-   API → **5000**
-   Traefik → **80** (web) / **443** (websecure)
-   Postgres → non esposto

## 3. Modifica porte esterne Traefik

Poiché il modem Fastweb usa la porta **443**, abbiamo cambiato la porta
esterna HTTPS.

Nel `docker-compose-nas.yml`:

    ports:
      - "8080:80"
      - "10443:443"

## 4. NAT / Port Mapping Fastweb

-   WAN **80** → LAN **8080**
-   WAN **10443** → LAN **10443**
-   IP interno NAS: `192.168.1.66`
-   Protocollo: TCP

La porta WAN **443** è usata dal modem, quindi non utilizzabile.

## 5. DNS Cloudflare

    A  sharedexpenseapi.loreappe.work → 93.41.237.121
    Proxy: OFF (Solo DNS)

## 6. Let's Encrypt

-   Metodo: HTTP-01
-   Usa la porta **80**
-   File: `letsencrypt/acme.json` (permessi 600)

## 7. Accesso alle API (Swagger)

### Esterno:

`https://sharedexpenseapi.loreappe.work:10443/swagger`

### LAN:

`https://192.168.1.66:10443/swagger`

## 8. Sicurezza (.env)

Rigenera: - `SUPABASE_KEY` - `JWT_SECRET_KEY`

## 9. Stato finale

-   Traefik ok
-   API interne ok
-   NAT ok (porte alternative)
-   HTTPS esposto su porta 10443
-   HTTP 80 disponibile per Let's Encrypt
-   DNS Cloudflare corretto

## 10. URL finali

-   API: `https://sharedexpenseapi.loreappe.work:10443`
-   Swagger: `https://sharedexpenseapi.loreappe.work:10443/swagger`

## 11. Comandi utili

    docker restart traefik
    docker logs traefik --tail 100

    curl -vk http://localhost:8080 -H "Host: sharedexpenseapi.loreappe.work"
    curl -vk https://localhost:8443 -H "Host: sharedexpenseapi.loreappe.work"

## 12. Note

-   Porta 443 del modem Fastweb NON inoltrabile.
-   Usare una porta esterna alternativa (10443).
