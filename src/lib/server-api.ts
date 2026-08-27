import 'server-only';

// Server-side (SSR) calls run inside the frontend container, where the browser's
// NEXT_PUBLIC_API_URL (localhost) would point at the frontend itself. Prefer an
// internal URL (e.g. http://backend:5000/api/v1 in Docker), read at runtime.
const API_URL =
  process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

/**
 * Server-side fetch for public storefront data (SSR + SEO). Returns null on any
 * failure so pages degrade gracefully instead of crashing the render. Public
 * catalog can be cached/revalidated aggressively (§35).
 */
export async function serverFetch<T>(path: string, revalidate = 60): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    const json = (await res.json()) as { success: boolean; data: T };
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}
