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
| `SITE_DOMAIN` | compose | Hostname Caddy serves over https and gets a certificate for; `www` redirects to it. |

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
browser ──▶ :443 caddy ──▶ :3000 next ──▶ BACKEND_ORIGIN (other machine, :5000)
            (TLS)        (not published)   proxies /api/v1 + /uploads
```

Only this machine is public, and on it only Caddy is published. Caddy obtains a
free Let's Encrypt certificate for `SITE_DOMAIN` and renews it itself, redirects
`http://` and `www.` to `https://SITE_DOMAIN`, and closes connections for any
other host — so the site is not reachable by IP. The browser never contacts the
backend directly, which is what keeps the auth cookie first-party.

Before the first `up`:
- `A` records for `SITE_DOMAIN` and `www.SITE_DOMAIN` point at this machine's
  public IP — use an Elastic IP, or the address changes on stop/start.
- The security group allows inbound TCP 80 and 443 (UDP 443 for HTTP/3) from
  anywhere. Port 80 must stay open: it answers certificate challenges and
  redirects to https. Nothing listens on 3000 any more, so close it.

```bash
git clone https://github.com/Mudassir5367/ghanipur-frontend.git
cd ghanipur-frontend
cp .env.production.example .env      # set SITE_DOMAIN, NEXT_PUBLIC_APP_URL and BACKEND_ORIGIN
docker compose up -d --build
```

Certificates live in the `caddy_data` volume. Keep it across deploys — never
`docker compose down -v` — or every redeploy re-issues and runs into Let's
Encrypt's rate limits.

Use the backend's **private** IP in `BACKEND_ORIGIN` when both instances are in
the same VPC — otherwise API traffic, including bearer tokens, crosses the
public internet in plaintext. If they must talk over public IPs, restrict the
backend's security group to this machine's IP and put TLS in front of it.

Check it:
```bash
docker compose ps                         # frontend should be "healthy"
docker compose logs caddy | grep -i certificate
curl -fsS https://ghanipur.pk/api/health
curl -sI http://ghanipur.pk               # 308 -> https://ghanipur.pk/
```

`/api/health` is a liveness probe for this server only — it never calls the
backend, so a backend outage won't restart-loop the frontend container. API
requests return 502 until the backend stack is up on the same network.

Building Next needs roughly 2 GB of RAM. On a 1 GB EC2 instance add swap first,
or the build will be OOM-killed.
