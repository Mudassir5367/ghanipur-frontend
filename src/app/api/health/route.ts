import { NextResponse } from 'next/server';

/**
 * Liveness probe for the container healthcheck / load balancer.
 * Deliberately does NOT touch the backend: it reports whether THIS Next server
 * is serving, so a backend outage can't restart-loop the frontend.
 * Note: /api/health sits outside the /api/v1 rewrite, so it is never proxied.
 */
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({ status: 'ok', uptime: Math.round(process.uptime()) });
}
