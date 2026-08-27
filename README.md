# Ghanipur — Frontend

Next.js 14 (App Router) + TypeScript + Tailwind + TanStack Query frontend for the
Ghanipur dairy management platform. It provides the shop dashboard (sales, inventory,
conversions, deliveries, payments, reports, profit & loss, settings), the super-admin
console, and the public storefront.

## Requirements
- Node 20+
- A running Ghanipur backend API (see the `ghanipur-backend` repo).

## Setup
```bash
npm install
cp .env.example .env      # then edit values
npm run dev               # http://localhost:3000
```

## Environment
See `.env.example`. Key vars:
- `NEXT_PUBLIC_API_URL` — browser API base. Use `/api/v1` (same-origin, proxied) or an absolute URL.
- `API_PROXY_TARGET` / `INTERNAL_API_URL` — where the Next server proxies API/uploads and does SSR fetches (the backend URL).

## Build
```bash
npm run build && npm start
```
A `Dockerfile` is included for containerized builds. For running the full stack
(backend + frontend + Mongo) together, use the `docker-compose.yml` in the backend repo.
