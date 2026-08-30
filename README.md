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
| `BACKEND_ORIGIN` | compose | Deployment shorthand that supplies both of the above. |
| `FRONTEND_PORT` | compose | Host port published for the container's 3000. |

Because three of these are baked into the build, **changing them requires
`docker compose up -d --build`, not just a restart.**

## Build
```bash
npm run build && npm start
```

## Deploy with Docker Compose

The frontend and backend are separate repos deployed to **separate machines**.
There is no shared Docker network across hosts, so this container reaches the
backend by address — `BACKEND_ORIGIN` in `.env`:

```
browser ──▶ :3000 this container ──▶ BACKEND_ORIGIN (other machine, :5000)
                   proxies /api/v1 + /uploads
```

Only this machine is public. The browser never contacts the backend directly,
which is what keeps the auth cookie first-party.

```bash
git clone https://github.com/Mudassir5367/ghanipur-frontend.git
cd ghanipur-frontend
cp .env.production.example .env      # set NEXT_PUBLIC_APP_URL and BACKEND_ORIGIN
docker compose up -d --build
```

Use the backend's **private** IP in `BACKEND_ORIGIN` when both instances are in
the same VPC — otherwise API traffic, including bearer tokens, crosses the
public internet in plaintext. If they must talk over public IPs, restrict the
backend's security group to this machine's IP and put TLS in front of it.

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
