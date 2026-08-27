import Link from 'next/link';
import type { Metadata } from 'next';
import { serverFetch } from '@/lib/server-api';
import { StoreHeader } from '@/components/public/StoreHeader';
import { ShopGrid } from '@/components/public/ShopGrid';
import type { PublicShop } from '@/types/public';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Browse Dairy Shops',
  description: 'Discover dairy shops on Ghanipur and browse their milk, yogurt and ghee products.',
  alternates: { canonical: '/shops' },
};

export default async function ShopsPage() {
  // revalidate: 0 -> never cache the list, so a newly-activated shop shows up
  // immediately instead of waiting out a stale (possibly empty) cached response.
  const shops = (await serverFetch<PublicShop[]>('/public/shops', 0)) ?? [];

  return (
    <main className="min-h-screen bg-cream">
      <StoreHeader />

      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-white to-cream">
        <div className="mx-auto max-w-6xl px-6 py-14 text-center">
          <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
            {shops.length} {shops.length === 1 ? 'shop' : 'shops'} online
          </span>
          <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-bold tracking-tight text-slate-900">
            Fresh dairy from shops near you
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Browse milk, dahi, butter and ghee from local dairy shops — order online and pick your favourites.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        {shops.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
            <p className="text-lg font-medium text-slate-700">No shops are live yet</p>
            <p className="mt-1 text-sm text-slate-500">Be the first dairy shop on Ghanipur.</p>
            <Link href="/register" className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Open your shop →
            </Link>
          </div>
        ) : (
          <ShopGrid shops={shops} />
        )}
      </section>
    </main>
  );
}
