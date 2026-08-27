'use client';

import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useRecordInventory, useLedger } from '@/features/catalog/hooks';
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
  const [type, setType] = useState('STOCK_IN');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const symbol = refSymbol(product?.unitId);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!product) return;
    record.mutate(
      { productId: product._id, payload: { type, quantity: Number(quantity), note: note || undefined } },
      { onSuccess: () => { setQuantity(''); setNote(''); } },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title={`Stock · ${product?.name ?? ''}`}>
      <div className="mb-4 rounded-lg bg-slate-50 px-4 py-3 text-sm">
        Current stock: <span className="font-semibold text-slate-900">{product?.currentStock} {symbol}</span>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <Select label="Movement" value={type} onChange={(e) => setType(e.target.value)} options={TYPES} />
        <Input
          label={`Quantity (${symbol})`}
          type="number"
          step="any"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
          hint={type === 'ADJUSTMENT' ? 'Use a negative value to reduce stock' : undefined}
        />
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
                <div className="flex items-center gap-2">
                  <Badge tone={typeTone[t.type] ?? 'slate'}>{t.type}</Badge>
                  <span className={t.quantity < 0 ? 'text-red-600' : 'text-brand-700'}>
                    {t.quantity > 0 ? '+' : ''}{t.quantity} {symbol}
                  </span>
                </div>
                <span className="text-xs text-slate-400">bal {t.balanceAfter} · {new Date(t.occurredAt).toLocaleDateString()}</span>
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
