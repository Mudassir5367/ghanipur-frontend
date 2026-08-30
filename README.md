# Ghanipur — Frontend

Next.js 14 (App Router) + TypeScript + Tailwind + TanStack Query frontend for the
Ghanipur dairy management platform. It provides the shop dashboard (sales, inventory,
conversions, deliveries, payments, reports, profit & loss, settings), the super-admin
console, and the public storefront.

## Requirements
- Node 20+
- A running Ghanipur backend API (see the `ghanipur-backend` repo).

## Local setup
```bash
npm install
cp .env.example .env      # then edit values
npm run dev               # http://localhost:3000
```

## Environment
| Var | Read at | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | build | Browser API base. Keep `/api/v1` (same-origin, proxied) so the auth cookie stays first-party. |
| `NEXT_PUBLIC_APP_URL` | build | Public origin, used for SEO metadata, `sitemap.xml`, `robots.txt`. |
| `API_PROXY_TARGET` | build | Backend the Next server proxies `/api/v1` + `/uploads` to. Baked in because Next evaluates `rewrites()` during `next build`. |
| `INTERNAL_API_URL` | runtime | Backend base URL for SSR fetches from inside the container. |
| `FRONTEND_PORT` | compose | Host port published for the container's 3000. |

Because three of these are baked into the build, **changing them requires
`docker compose up -d --build`, not just a restart.**

## Build
```bash
npm run build && npm start
```

## Deploy with Docker Compose

The frontend and backend are separate repos and separate compose stacks. They
share the external Docker network `ghanipur-net`, which is what lets the Next
server resolve the backend by its service name (`backend`).

```bash
# once per machine
docker network create ghanipur-net

git clone https://github.com/Mudassir5367/ghanipur-frontend.git
cd ghanipur-frontend
cp .env.production.example .env      # set NEXT_PUBLIC_APP_URL to your public URL
docker compose up -d --build
```

Check it:
```bash
docker compose ps
curl -f http://localhost:3000/api/health
```

`/api/health` is a liveness probe for this server only — it never calls the
backend, so a backend outage won't restart-loop the frontend container. API
requests return 502 until the backend stack is up on the same network.

Building Next needs roughly 2 GB of RAM. On a 1 GB EC2 instance add swap first,
or the build will be OOM-killed.
