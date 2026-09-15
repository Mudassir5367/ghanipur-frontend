'use client';

import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useRecordInventory, useLedger, useSuppliers } from '@/features/catalog/hooks';
import { formatPKR } from '@/lib/utils';
import { refSymbol, type Product } from '@/types/catalog';

const TYPES = [
  { value: 'STOCK_IN', label: 'Stock in (add)' },
  { value: 'WASTAGE', label: 'Wastage (remove)' },
  { value: 'RETURN', label: 'Return (add)' },
  { value: 'ADJUSTMENT', label: 'Adjustment (+/-)' },
];

const typeTone: Record<string, 'green' | 'red' | 'amber' | 'slate'> = {
  STOCK_IN: 'green', RETURN: 'green', WASTAGE: 'red', SALE: 'red', DELIVERY: 'red', ADJUSTMENT: 'amber',
};

export function StockModal({ open, onClose, product }: { open: boolean; onClose: () => void; product: Product | null }) {
  const record = useRecordInventory();
  const { data: ledger, isLoading } = useLedger(open ? product?._id ?? null : null);
  const { data: suppliers } = useSuppliers();
  const [type, setType] = useState('STOCK_IN');
  const [quantity, setQuantity] = useState('');
  const [supplier, setSupplier] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [note, setNote] = useState('');
  const symbol = refSymbol(product?.unitId);
  // Stock In is a purchase: who it came from and what it cost. No sale price here.
  const isPurchase = type === 'STOCK_IN';

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!product) return;
    record.mutate(
      {
        productId: product._id,
        payload: {
          type,
          quantity: Number(quantity),
          note: note || undefined,
          ...(isPurchase ? { supplier: supplier.trim(), unitCost: Number(unitCost) } : {}),
        },
      },
      { onSuccess: () => { setQuantity(''); setUnitCost(''); setNote(''); } },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title={`Stock · ${product?.name ?? ''}`}>
      <div className="mb-4 flex justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
        <span>Current stock: <span className="font-semibold text-slate-900">{product?.currentStock} {symbol}</span></span>
        {product?.avgCostMinor !== undefined && (
          <span>Avg cost: <span className="font-semibold text-slate-900">{formatPKR(product.avgCostMinor)}</span></span>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <Select label="Movement" value={type} onChange={(e) => setType(e.target.value)} options={TYPES} />
        {isPurchase && (
          <>
            <Input label="Supplier / Vendor" value={supplier} onChange={(e) => setSupplier(e.target.value)} list="stock-suppliers" required placeholder="e.g. Rehman Dairy Farm" />
            <datalist id="stock-suppliers">{(suppliers ?? []).map((s) => <option key={s} value={s} />)}</datalist>
          </>
        )}
        <div className={isPurchase ? 'grid grid-cols-2 gap-3' : ''}>
          <Input
            label={`Quantity (${symbol})`}
            type="number"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            hint={type === 'ADJUSTMENT' ? 'Use a negative value to reduce stock' : undefined}
          />
          {isPurchase && (
            <Input label={`Cost price (Rs / ${symbol || 'unit'})`} type="number" step="0.01" min="0" value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)} required />
          )}
        </div>
        {isPurchase && (
          <p className="-mt-1 text-xs text-slate-500">The product&apos;s average cost is recalculated from all purchases, weighted by quantity.</p>
        )}
        <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button type="submit" className="w-full" loading={record.isPending}>Record movement</Button>
      </form>

      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Recent movements</p>
        {isLoading ? (
          <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
        ) : ledger && ledger.length > 0 ? (
          <div className="max-h-48 space-y-1.5 overflow-y-auto">
            {ledger.map((t) => (
              <div key={t._id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-1.5 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <Badge tone={typeTone[t.type] ?? 'slate'}>{t.type}</Badge>
                  <span className={t.quantity < 0 ? 'text-red-600' : 'text-brand-700'}>
                    {t.quantity > 0 ? '+' : ''}{t.quantity} {symbol}
                  </span>
                  {t.unitCostMinor !== undefined && t.type === 'STOCK_IN' && (
                    <span className="truncate text-xs text-slate-500">@ {formatPKR(t.unitCostMinor)}{t.supplier ? ` · ${t.supplier}` : ''}</span>
                  )}
                </div>
                <span className="shrink-0 text-xs text-slate-400">bal {t.balanceAfter} · {new Date(t.occurredAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No movements yet.</p>
        )}
      </div>
    </Modal>
  );
}
