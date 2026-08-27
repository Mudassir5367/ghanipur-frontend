import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serverFetch } from '@/lib/server-api';
import { StoreHeader } from '@/components/public/StoreHeader';
import { StorefrontProducts } from '@/components/public/StorefrontProducts';
import type { PublicShop, PublicCategory, PublicProduct } from '@/types/public';

export const dynamic = 'force-dynamic';

interface ShopData { shop: PublicShop; categories: PublicCategory[] }
interface ProductsData { shop: { name: string }; products: PublicProduct[] }

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await serverFetch<ShopData>(`/public/shops/${params.slug}`);
  if (!data) return { title: 'Shop not found' };
  const { shop } = data;
  const title = shop.name;
  const description = shop.description || `Fresh milk, dahi and ghee from ${shop.name} on Ghanipur.`;
  return {
    title,
    description,
    alternates: { canonical: `/shop/${shop.slug}` },
    openGraph: { title, description, url: `${appUrl}/shop/${shop.slug}`, type: 'website' },
  };
}

export default async function ShopPage({ params }: { params: { slug: string } }) {
  const [data, productsData] = await Promise.all([
    // revalidate: 0 so newly added products/categories show immediately.
    serverFetch<ShopData>(`/public/shops/${params.slug}`, 0),
    serverFetch<ProductsData>(`/public/shops/${params.slug}/products?limit=100`, 0),
  ]);
  if (!data) notFound();
  const { shop } = data;
  const products = productsData?.products ?? [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: shop.name,
    description: shop.description,
    telephone: shop.phone,
    address: shop.address?.city ? { '@type': 'PostalAddress', addressLocality: shop.address.city } : undefined,
    url: `${appUrl}/shop/${shop.slug}`,
  };

  return (
    <main className="min-h-screen bg-cream">
      <StoreHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Banner */}
      <div className="h-40 bg-gradient-to-br from-brand-200 to-brand-50" />
      <div className="mx-auto max-w-6xl px-6">
        <div className="-mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">{shop.name}</h1>
          {shop.description && <p className="mt-1 text-slate-600">{shop.description}</p>}
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
            {shop.address?.city && <span>📍 {shop.address.city}</span>}
            {shop.phone && <span>📞 {shop.phone}</span>}
            {shop.whatsapp && <a href={`https://wa.me/${shop.whatsapp.replace(/\D/g, '')}`} className="text-brand-700 hover:underline">WhatsApp</a>}
          </div>
        </div>

        {/* Products, grouped by category */}
        {products.length === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">No products listed yet.</p>
        ) : (
          <StorefrontProducts shopId={shop._id} slug={shop.slug} products={products} />
        )}
      </div>
    </main>
  );
}
