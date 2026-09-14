'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ProductForm } from '@/components/dashboard/products/ProductForm';
import { StockModal } from '@/components/dashboard/products/StockModal';
import { useProducts, useCategories, useDeleteProduct } from '@/features/catalog/hooks';
import { formatPKR } from '@/lib/utils';
import { refName, refSymbol, type Product } from '@/types/catalog';

export default function ProductsPage() {
  const { data: categories } = useCategories();
  const [filters, setFilters] = useState<{ categoryId?: string; lowStock?: string; search?: string }>({});
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [filters]);
  const { data, isLoading } = useProducts({ ...filters, page });
  const del = useDeleteProduct();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [stockFor, setStockFor] = useState<Product | null>(null);
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setFormOpen(true); };

  const columns: Column<Product>[] = [
    { key: 'name', header: 'Product', render: (p) => (
      <div className="flex items-center gap-3">
        {p.images?.[0]
          ? // eslint-disable-next-line @next/next/no-img-element
            <img src={p.images[0]} alt={p.name} className="h-9 w-9 rounded-lg object-cover" />
          : <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm">📦</div>}
        <div><p className="font-medium text-slate-800">{p.name}</p><p className="text-xs text-slate-400">{p.sku}</p></div>
      </div>
    ) },
    { key: 'category', header: 'Category', render: (p) => refName(p.categoryId) || '—' },
    { key: 'supplier', header: 'Supplier', render: (p) => p.supplier ? <span className="text-slate-600">{p.supplier}</span> : <span className="text-slate-300">—</span> },
    { key: 'price', header: 'Sale price', align: 'right', render: (p) => formatPKR(p.sellingPriceMinor) },
    { key: 'avgCost', header: 'Avg cost', align: 'right', render: (p) => <span className="text-slate-600">{formatPKR(p.avgCostMinor ?? p.purchaseCostMinor)}</span> },
    { key: 'stock', header: 'Stock', align: 'right', render: (p) => (
      <span className="inline-flex items-center gap-2">
        {p.trackInventory ? `${p.currentStock} ${refSymbol(p.unitId)}` : '—'}
        {p.trackInventory && p.currentStock <= p.minStock && <Badge tone="amber">Low</Badge>}
      </span>
    ) },
    { key: 'status', header: 'Status', render: (p) => <Badge tone={p.isAvailable ? 'green' : 'slate'}>{p.isAvailable ? 'Available' : 'Hidden'}</Badge> },
    { key: 'actions', header: '', align: 'right', render: (p) => (
      <div className="flex justify-end gap-1">
        {p.trackInventory && <Button size="sm" variant="outline" onClick={() => setStockFor(p)}>Stock</Button>}
        <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>Edit</Button>
        <Button size="sm" variant="ghost" onClick={() => setToDelete(p)}>Archive</Button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500">Manage your products, prices and stock.</p>
        </div>
        <Button onClick={openCreate}>Add product</Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Input placeholder="Search name or SKU…" className="max-w-xs" value={filters.search ?? ''} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined }))} />
        <Select
          className="max-w-xs" placeholder="All categories" value={filters.categoryId ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value || undefined }))}
          options={(categories ?? []).map((c) => ({ value: c._id, label: c.name }))}
        />
        <label className="flex h-10 items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={filters.lowStock === 'true'} onChange={(e) => setFilters((f) => ({ ...f, lowStock: e.target.checked ? 'true' : undefined }))} />
          Low stock only
        </label>
      </div>

      <Card><CardBody className="p-0">
        <DataTable columns={columns} data={data?.products} isLoading={isLoading} rowKey={(p) => p._id} empty="No products yet. Add your first product." pagination={{ meta: data?.meta, onPageChange: setPage }} />
      </CardBody></Card>

      <ProductForm open={formOpen} onClose={() => setFormOpen(false)} product={editing} />
      <StockModal open={!!stockFor} onClose={() => setStockFor(null)} product={stockFor} />
      <ConfirmDialog
        open={!!toDelete}
        title="Archive product"
        message={`Archive "${toDelete?.name}"? It will be hidden and removed from sale.`}
        confirmLabel="Archive" danger loading={del.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && del.mutate(toDelete._id, { onSuccess: () => setToDelete(null) })}
      />
    </div>
  );
}
