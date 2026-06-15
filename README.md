# MaxBurger – Distribuerat Ordersystem

Ett eventdrivet backend-system inspirerat av snabbmatskedjors ordersystem. Systemet består av mikrotjänster som kommunicerar via RabbitMQ, med PostgreSQL som databas och nginx som publik ingång.

## Snabbstart

```bash
docker compose up --build
```

Systemet startar alla tjänster, kör databas-DDL och seed-data automatiskt.

**Publik bas-URL:** `http://localhost` (port 80 via nginx)

Öppna i webbläsaren för att använda frontend-appen (meny, varukorg, orderstatus och kökspanel).

## Arkitektur

```
Klient (React) → nginx (:80) → /api/* → API Gateway → Mikrotjänster
                     ↓                        ↓
               Statisk frontend          RabbitMQ (events)
                                              ↓
                                     PostgreSQL (data)
```

## Projektstruktur

```
Maxburger/
├── frontend/              React-app (meny, varukorg, kök)
├── services/              Backend-mikrotjänster
│   ├── api-gateway/
│   ├── product-service/
│   ├── order-service/
│   ├── kitchen-service/
│   └── notification-service/
├── shared/                Delad kod (events, RabbitMQ)
├── infra/                 Docker-infrastruktur
│   ├── db/init.sql        Databasschema och seed-data
│   └── nginx/             Reverse proxy + statisk frontend
├── tests/e2e/             End-to-end-tester
├── docker-compose.yml
└── package.json
```

### Frontend

| Sida | URL | Beskrivning |
|------|-----|-------------|
| Meny | `/` | Bläddra produkter och lägg i varukorg |
| Varukorg | `/cart` | Granska och lägg beställning |
| Orderstatus | `/order/:id` | Följ order i realtid + notiser |
| Kökspanel | `/kitchen` | Personalhantering av beställningar |

### Tjänster

| Tjänst | Ansvar |
|--------|--------|
| **api-gateway** | Publikt HTTP-API, routar till interna tjänster |
| **product-service** | Produkter och menyer |
| **order-service** | Skapar och hanterar ordrar |
| **kitchen-service** | Köksbiljetter för restaurangpersonal |
| **notification-service** | Notiser till kund (simulerade) |

### Eventflöde

1. Kund lägger order → `order.created` → `order.confirmed`
2. Kitchen-service skapar köksbiljett
3. Personal markerar "preparing" → `order.preparing`
4. Personal markerar "ready" → `order.ready`
5. Kund hämtar → order markeras `completed` → `order.completed`
6. Notification-service skickar notis vid varje steg

## API (via http://localhost)

| Metod | Endpoint | Beskrivning |
|-------|----------|-------------|
| GET | `/api/products` | Lista produkter |
| GET | `/api/menus` | Lista menyer med produkter |
| POST | `/api/orders` | Skapa order |
| GET | `/api/orders/:id` | Hämta order |
| PATCH | `/api/orders/:id/cancel` | Avbryt order |
| PATCH | `/api/orders/:id/complete` | Slutför order |
| GET | `/api/kitchen?active=true` | Aktiva köksbiljetter |
| PATCH | `/api/kitchen/:id/status` | Uppdatera köksstatus (`preparing`/`ready`) |
| GET | `/api/notifications/order/:orderId` | Notiser för en order |

### Exempel: Lägg en order

```bash
curl -X POST http://localhost/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Anna",
    "customerEmail": "anna@example.com",
    "items": [
      { "productId": 1, "quantity": 1 },
      { "productId": 5, "quantity": 1 }
    ]
  }'
```

## Testa flödet manuellt

1. `docker compose up --build`
2. Hämta menyn: `curl http://localhost/api/menus`
3. Skapa en order (se exempel ovan)
4. Hämta köksbiljetter: `curl http://localhost/api/kitchen?active=true`
5. Markera som preparing: `curl -X PATCH http://localhost/api/kitchen/1/status -H "Content-Type: application/json" -d '{"status":"preparing"}'`
6. Markera som ready: `curl -X PATCH http://localhost/api/kitchen/1/status -H "Content-Type: application/json" -d '{"status":"ready"}'`
7. Slutför order: `curl -X PATCH http://localhost/api/orders/<order-id>/complete`
8. Hämta notiser: `curl http://localhost/api/notifications/order/<order-id>`

## Tester

Projektet har unit-tester för affärslogik i varje tjänst samt E2E-tester som går via den publika nginx-ingången (`http://localhost`).

| Nivå | Vad som testas |
|------|----------------|
| Unit | Order/kök/notis-logik, API gateway routing, events och RabbitMQ-hjälpare |
| E2E | Alla publika API:er, hela orderflödet, avbruten order, felscenario (400/409) och alla order-events via notiser |

```bash
# Unit-tester (alla tjänster)
npm run test:unit

# End-to-end (kräver att systemet körs)
docker compose up -d --build
npm run test:e2e
docker compose down
```

CI körs automatiskt via GitHub Actions vid push till alla brancher.

## Felscenario

Om en produkt inte finns eller är otillgänglig avvisas ordern med HTTP 400. Om en order redan är `completed` kan den inte avbrytas (HTTP 409). Ogiltiga statusövergångar i köket blockeras med HTTP 409.

## Teknikstack

- React / TypeScript / Vite (frontend)
- Node.js / TypeScript / Express (backend)
- PostgreSQL 16
- RabbitMQ 3
- nginx
- Docker Compose
- Jest (unit + e2e)
- GitHub Actions (CI)

### Frontend lokalt (valfritt)

```bash
cd frontend
npm install
npm run dev
```

Kräver att backend körs (`docker compose up`) — Vite proxar `/api` till localhost.
