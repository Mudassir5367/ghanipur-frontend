'use client';

import { useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { Input } from '@/components/ui/Input';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { StockModal } from '@/components/dashboard/products/StockModal';
import { useProducts } from '@/features/catalog/hooks';
import { formatPKR } from '@/lib/utils';
import { refName, refSymbol, type Product } from '@/types/catalog';

/** Central inventory for ALL products (§5, §6) — not limited to milk. */
export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useProducts(search ? { search } : {});
  const [stockFor, setStockFor] = useState<Product | null>(null);

  const tracked = useMemo(() => (data?.products ?? []).filter((p) => p.trackInventory), [data]);
  const lowCount = tracked.filter((p) => p.currentStock <= p.minStock).length;
  const stockValue = tracked.reduce((sum, p) => sum + p.currentStock * p.purchaseCostMinor, 0);

  const columns: Column<Product>[] = [
    {
      key: 'product', header: 'Product',
      render: (p) => (
        <div className="flex items-center gap-3">
          {p.images?.[0]
            ? // eslint-disable-next-line @next/next/no-img-element
              <img src={p.images[0]} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
            : <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-lg">📦</div>}
          <div>
            <p className="font-medium text-slate-800">{p.name}</p>
            <p className="text-xs text-slate-400">{p.sku}</p>
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (p) => refName(p.categoryId) || '—' },
    { key: 'stock', header: 'Current stock', align: 'right', render: (p) => `${p.currentStock} ${refSymbol(p.unitId)}` },
    { key: 'min', header: 'Min', align: 'right', render: (p) => p.minStock },
    { key: 'flag', header: 'Status', render: (p) => p.currentStock <= p.minStock ? <Badge tone="amber">Low stock</Badge> : <Badge tone="green">In stock</Badge> },
    { key: 'actions', header: '', align: 'right', render: (p) => <Button size="sm" variant="outline" onClick={() => setStockFor(p)}>Add / Reduce</Button> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
        <p className="text-sm text-slate-500">Manage stock for all products. Sales deduct stock automatically.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Tracked products" value={String(tracked.length)} />
        <StatCard label="Low stock" value={String(lowCount)} tone={lowCount > 0 ? 'amber' : 'green'} />
        <StatCard label="Stock value (at cost)" value={formatPKR(stockValue)} tone="blue" />
      </div>

      <Input placeholder="Search product or SKU…" className="max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} />

      <Card>
        <CardHeader><CardTitle>Stock levels</CardTitle></CardHeader>
        <CardBody className="p-0">
          <DataTable columns={columns} data={tracked} isLoading={isLoading} rowKey={(p) => p._id} empty="No tracked products yet. Add products to manage inventory." />
        </CardBody>
      </Card>

      <StockModal open={!!stockFor} onClose={() => setStockFor(null)} product={stockFor} />
    </div>
  );
}
