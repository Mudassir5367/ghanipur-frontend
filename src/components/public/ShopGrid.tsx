'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import type { PublicShop } from '@/types/public';

/** Deterministic gradient per shop so cards feel distinct without stored images. */
const GRADIENTS = [
  'from-brand-200 to-brand-50',
  'from-amber-200 to-amber-50',
  'from-sky-200 to-sky-50',
  'from-emerald-200 to-emerald-50',
  'from-rose-200 to-rose-50',
  'from-violet-200 to-violet-50',
];
const gradientFor = (seed: string) => GRADIENTS[[...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length];
const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');

/**
 * Renders the storefront grid. When the viewer is a logged-in shop owner/staff,
 * their own shop is floated to the front (index 0) and badged, so they always see
 * their store first. Ordering happens on the client because the SSR page can't
 * know who is signed in (the token lives in memory).
 */
export function ShopGrid({ shops }: { shops: PublicShop[] }) {
  const { status, user } = useAuthStore();
  const myShopId = status === 'authenticated' && user?.shopId ? user.shopId : null;

  const ordered = useMemo(() => {
    if (!myShopId) return shops;
    const mine = shops.filter((s) => s._id === myShopId);
    if (mine.length === 0) return shops; // owner's shop isn't public (e.g. not active)
    return [...mine, ...shops.filter((s) => s._id !== myShopId)];
  }, [shops, myShopId]);

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {ordered.map((shop) => {
        const isMine = shop._id === myShopId;
        return (
          <Link
            key={shop._id}
            href={`/shop/${shop.slug}`}
            className={`group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
              isMine ? 'border-brand-400 ring-2 ring-brand-200' : 'border-slate-200'
            }`}
          >
            <div className={`relative h-32 bg-gradient-to-br ${gradientFor(shop.slug)}`}>
              {isMine && (
                <span className="absolute right-3 top-3 rounded-full bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                  Your shop
                </span>
              )}
              <div className="absolute -bottom-6 left-5 flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white bg-white shadow-sm">
                {shop.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shop.logo} alt={shop.name} className="h-full w-full rounded-xl object-cover" />
                ) : (
                  <span className="text-lg font-bold text-brand-700">{initials(shop.name)}</span>
                )}
              </div>
            </div>
            <div className="flex flex-1 flex-col p-5 pt-9">
              <h2 className="font-semibold text-slate-900 group-hover:text-brand-700">{shop.name}</h2>
              <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500">{shop.description || 'Fresh dairy products, delivered.'}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                {shop.address?.city && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">📍 {shop.address.city}</span>
                )}
                {shop.phone && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">📞 {shop.phone}</span>
                )}
                <span className="ml-auto font-semibold text-brand-600 group-hover:underline">Visit store →</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
