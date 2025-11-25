# Pubblicazione API su NAS Synology con Traefik + HTTPS

Sintesi della configurazione usata per esporre l'API Docker sul NAS DS224+ con dominio `sharedexpenseapi.loreappe.work`.

## Topologia Docker

- Cartella `sharedExpenseApp` contenente: Postgres, API (`loreappe/shared-expense-api`), Traefik, `letsencrypt/acme.json`, `.env`.
- Porte interne: API **5000**, Traefik **80/443** (web/websecure), Postgres non esposto.
- Porte esterne mappate nel `docker-compose-nas.yml`:
  ```yaml
  ports:
    - "8080:80"      # HTTP per Let's Encrypt
    - "10443:443"    # HTTPS pubblico
  ```

## Rete & DNS

- NAT Fastweb: WAN `80 -> 8080`, `10443 -> 10443` verso `192.168.1.66` (solo TCP). La porta WAN 443 resta occupata dal modem.
- Cloudflare DNS: record **A** `sharedexpenseapi.loreappe.work` → `93.41.237.121`, proxy disattivato (Solo DNS).

## Certificati Let's Encrypt

- Challenge HTTP-01 tramite porta 80.
- File `letsencrypt/acme.json` con permessi 600.
- Rigenera periodicamente i segreti in `.env`: `SUPABASE_KEY`, `JWT_SECRET_KEY`, token `CF_DNS_API_TOKEN` per eventuale DNS-01.

## URL finali

- API: `https://sharedexpenseapi.loreappe.work:10443`
- Swagger: `https://sharedexpenseapi.loreappe.work:10443/swagger`
- LAN alternativa: `https://192.168.1.66:10443/swagger`

## Comandi utili

```bash
docker restart traefik
docker logs traefik --tail 100
curl -vk http://localhost:8080 -H "Host: sharedexpenseapi.loreappe.work"
curl -vk https://localhost:10443 -H "Host: sharedexpenseapi.loreappe.work"
```

Note: la porta 443 del modem non è inoltrabile, usa sempre la 10443 per l'esterno.
