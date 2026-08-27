import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { StoreHeader } from '@/components/public/StoreHeader';

const features = [
  { title: 'Daily Milk Tracking', body: 'Opening stock, new stock, cash & credit sales, wastage and closing — calculated automatically.' },
  { title: 'Credit Ledger', body: 'Per-customer ledgers that never drift. Record sales and payments; outstanding balances update themselves.' },
  { title: 'Cash & Credit Sales', body: 'Fast sale entry. Walk-in cash needs no customer; credit posts straight to the ledger.' },
  { title: 'Inventory that Balances', body: 'Every movement is a transaction. Stock is derived, not guessed — accurate under concurrent sales.' },
  { title: 'Deliveries', body: 'Assign, track and complete deliveries with full history per customer.' },
  { title: 'Reports & Dashboard', body: 'Daily and monthly revenue, product and customer breakdowns, outstanding credit at a glance.' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-cream">
      <StoreHeader />

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 text-center">
        <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
          For dairy shops, hotels &amp; households
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Run your dairy business the modern way.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          Ghanipur helps dairy shops manage milk, yogurt and ghee — sales, credit, customers,
          deliveries and daily accounts — all in one place. Customers can browse and order online.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/create-shop"><Button size="lg">Create your shop</Button></Link>
          <Link href="/shops"><Button size="lg" variant="outline">Explore shops</Button></Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-slate-500 sm:flex-row">
          <span>© {new Date().getFullYear()} Ghanipur. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/shops" className="hover:text-slate-800">Shops</Link>
            <Link href="/login" className="hover:text-slate-800">Log in</Link>
            <Link href="/register" className="hover:text-slate-800">Sign up</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
