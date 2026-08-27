'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { formatPKR } from '@/lib/utils';
import { CategoryImage } from '@/components/public/CategoryImage';
import type { PublicProduct } from '@/types/public';

/**
 * Storefront product grid — a single flat grid of all products, up to 5 per row.
 * Category is shown as a small label on each card (no section headings). Products
 * are ordered so the same category stays together.
 *
 * A normal visitor's card opens the public product page; the shop OWNER's card
 * jumps to the dashboard Sales screen with the product pre-selected.
 */
export function StorefrontProducts({ shopId, slug, products }: { shopId: string; slug: string; products: PublicProduct[] }) {
  const { status, user } = useAuthStore();
  const isOwner = status === 'authenticated' && !!user?.shopId && user.shopId === shopId;

  // Keep same-category products adjacent without breaking the flat grid.
  const ordered = [...products].sort((a, b) => (a.categoryId?.name ?? 'zz').localeCompare(b.categoryId?.name ?? 'zz'));

  return (
    <div className="mt-6 grid grid-cols-2 gap-4 pb-16 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {ordered.map((p) => {
        const href = isOwner ? `/dashboard/sales?add=${p._id}` : `/shop/${slug}/${p.slug}`;
        return (
          <Link key={p._id} href={href} className="group flex flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            {p.images?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.images[0]} alt={p.name} className="mb-2 aspect-square w-full rounded-lg object-cover" />
            ) : (
              <CategoryImage name={p.categoryId?.name ?? p.name} className="mb-2 aspect-square w-full rounded-lg" />
            )}
            <h3 className="truncate text-sm font-semibold text-slate-900 group-hover:text-brand-700">{p.name}</h3>
            <p className="truncate text-xs text-slate-400">{p.categoryId?.name ?? 'Other'}</p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-bold text-brand-700">{formatPKR(p.sellingPriceMinor)}</span>
              <span className="text-xs text-slate-400">/ {p.unitId?.symbol}</span>
            </div>
            {isOwner && (
              <span className="mt-2 block rounded-lg bg-brand-50 py-1.5 text-center text-xs font-semibold text-brand-700 group-hover:bg-brand-100">
                + Add to sale
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
