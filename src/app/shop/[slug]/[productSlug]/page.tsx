import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serverFetch } from '@/lib/server-api';
import { StoreHeader } from '@/components/public/StoreHeader';
import { Button } from '@/components/ui/Button';
import { formatPKR } from '@/lib/utils';
import { CategoryImage } from '@/components/public/CategoryImage';
import type { PublicProduct } from '@/types/public';

export const dynamic = 'force-dynamic';

interface Data { shop: { name: string; slug: string; phone?: string; whatsapp?: string }; product: PublicProduct }

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function generateMetadata({ params }: { params: { slug: string; productSlug: string } }): Promise<Metadata> {
  const data = await serverFetch<Data>(`/public/shops/${params.slug}/products/${params.productSlug}`);
  if (!data) return { title: 'Product not found' };
  const { product, shop } = data;
  const title = `${product.name} — ${shop.name}`;
  const description = product.description || `${product.name} available at ${shop.name} for ${formatPKR(product.sellingPriceMinor)}.`;
  return {
    title,
    description,
    alternates: { canonical: `/shop/${params.slug}/${product.slug}` },
    openGraph: { title, description, url: `${appUrl}/shop/${params.slug}/${product.slug}`, type: 'website' },
  };
}

export default async function ProductPage({ params }: { params: { slug: string; productSlug: string } }) {
  const data = await serverFetch<Data>(`/public/shops/${params.slug}/products/${params.productSlug}`);
  if (!data) notFound();
  const { shop, product } = data;
  const inStock = !product.trackInventory || product.currentStock > 0;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    offers: {
      '@type': 'Offer',
      price: (product.sellingPriceMinor / 100).toFixed(2),
      priceCurrency: 'PKR',
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <main className="min-h-screen bg-cream">
      <StoreHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-5xl px-6 py-8">
        <Link href={`/shop/${shop.slug}`} className="text-sm text-slate-500 hover:text-slate-800">← {shop.name}</Link>
        <div className="mt-4 grid gap-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
          {product.images?.[0]
            ? // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[0]} alt={product.name} className="h-64 w-full rounded-lg object-cover" />
            : <CategoryImage name={product.categoryId?.name ?? product.name} className="h-64 w-full rounded-lg" />}
          <div>
            <p className="text-sm text-brand-700">{product.categoryId?.name}</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{product.name}</h1>
            <p className="mt-3 text-3xl font-bold text-brand-700">{formatPKR(product.sellingPriceMinor)}<span className="text-base font-normal text-slate-400"> / {product.unitId?.symbol}</span></p>
            {product.description && <p className="mt-4 text-slate-600">{product.description}</p>}
            <p className="mt-4">
              {inStock ? <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">In stock</span>
                : <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-600">Out of stock</span>}
            </p>
            <div className="mt-6 flex gap-3">
              {shop.whatsapp && (
                <a href={`https://wa.me/${shop.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`I want to order ${product.name}`)}`} target="_blank" rel="noopener noreferrer">
                  <Button>Order on WhatsApp</Button>
                </a>
              )}
              {shop.phone && <a href={`tel:${shop.phone}`}><Button variant="outline">Call shop</Button></a>}
            </div>
            <p className="mt-4 text-xs text-slate-400">Online cart &amp; checkout coming soon.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
