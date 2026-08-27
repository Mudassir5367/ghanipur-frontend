import type { MetadataRoute } from 'next';
import { serverFetch } from '@/lib/server-api';
import type { PublicShop } from '@/types/public';

export const dynamic = 'force-dynamic';

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

/** Dynamic sitemap including every active shop (§43). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const shops = (await serverFetch<PublicShop[]>('/public/shops')) ?? [];
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: appUrl, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${appUrl}/shops`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
  ];

  const shopRoutes: MetadataRoute.Sitemap = shops.map((s) => ({
    url: `${appUrl}/shop/${s.slug}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  return [...staticRoutes, ...shopRoutes];
}
