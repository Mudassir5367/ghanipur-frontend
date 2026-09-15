'use client';

import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useAllProducts } from '@/features/catalog/hooks';
import { useAllCustomers, useUpdateSale } from '@/features/sales/hooks';
import { formatPKR } from '@/lib/utils';
import { refSymbol } from '@/types/catalog';
import type { Sale } from '@/types/sales';
import type { SaleItemInput } from '@/features/sales/api';

interface Line {
  key: string;
  productId: string;
  name: string;
  qtyText: string;
  priceText: string;
  /** Sold "by amount": the stored total is the exact amount and qty was derived. */
  byAmount: boolean;
  /** Once qty/price is touched the line is resent as a plain quantity line. */
  dirty: boolean;
  origLineTotalMinor: number;
}

const decimalOk = (v: string) => v === '' || /^\d*\.?\d*$/.test(v);
const toMinor = (text: string) => Math.round((Number(text) || 0) * 100);
let seq = 0;

/**
 * Correct a confirmed sale: payment type (Cash ↔ Credit), customer, phone, lines,
 * quantities, unit prices and note. The server reconciles stock, the customer's
 * balance and every dashboard total from the saved result.
 */
export function SaleEditModal({ sale, onClose }: { sale: Sale | null; onClose: () => void }) {
  const { data: productData } = useAllProducts();
  const { data: customerData } = useAllCustomers();
  const update = useUpdateSale();

  const products = useMemo(() => productData ?? [], [productData]);
  const productMap = useMemo(() => new Map(products.map((p) => [p._id, p])), [products]);

  const [type, setType] = useState<'CASH' | 'CREDIT'>('CASH');
  const [customerId, setCustomerId] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [pick, setPick] = useState('');
  const [addQty, setAddQty] = useState('1');

  // Load the sale being edited each time the dialog opens for one.
  useEffect(() => {
    if (!sale) return;
    setType(sale.type);
    setCustomerId(typeof sale.customerId === 'object' && sale.customerId ? sale.customerId._id : (sale.customerId ?? ''));
    setPhone(sale.customerPhone ?? '');
    setNote(sale.note ?? '');
    setLines((sale.items ?? []).map((i) => ({
      key: `l${seq++}`,
      productId: i.productId,
      name: i.name,
      qtyText: String(i.quantity),
      priceText: String(i.unitPriceMinor / 100),
      byAmount: Math.round(i.unitPriceMinor * i.quantity) !== i.lineTotalMinor,
      dirty: false,
      origLineTotalMinor: i.lineTotalMinor,
    })));
    setPick('');
    setAddQty('1');
  }, [sale]);

  const lineTotal = (l: Line) => (l.byAmount && !l.dirty ? l.origLineTotalMinor : Math.round(toMinor(l.priceText) * Number(l.qtyText || 0)));
  const total = lines.reduce((s, l) => s + lineTotal(l), 0);
  const invalid = lines.length === 0 || lines.some((l) => !(Number(l.qtyText) > 0) || l.priceText.trim() === '');

  const patchLine = (key: string, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch, dirty: true } : l)));

  const addLine = () => {
    const p = productMap.get(pick);
    if (!p || !(Number(addQty) > 0)) return;
    setLines((prev) => [...prev, {
      key: `l${seq++}`, productId: p._id, name: p.name, qtyText: addQty, priceText: String(p.sellingPriceMinor / 100),
      byAmount: false, dirty: true, origLineTotalMinor: 0,
    }]);
    setPick('');
    setAddQty('1');
  };

  const save = () => {
    if (!sale || invalid) return;
    const items: SaleItemInput[] = lines.map((l) =>
      l.byAmount && !l.dirty
        // Untouched "by amount" line: resend the exact amount and price so the
        // total can't drift by rounding on an unrelated edit.
        ? { productId: l.productId, amount: l.origLineTotalMinor / 100, unitPrice: toMinor(l.priceText) / 100 }
        : { productId: l.productId, quantity: Number(l.qtyText), unitPrice: toMinor(l.priceText) / 100 },
    );
    update.mutate(
      {
        id: sale._id,
        payload: {
          type,
          customerId: customerId || undefined,
          customerPhone: customerId ? undefined : phone.trim() || undefined,
          items,
          note: note.trim(),
        },
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal open={!!sale} onClose={onClose} title={sale ? `Edit sale ${sale.code}` : 'Edit sale'}>
      <div className="space-y-4">
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Saving updates stock, the customer&apos;s balance and all dashboard totals for this sale.
        </p>

        <div className="flex gap-2">
          {(['CASH', 'CREDIT'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setType(t)}
              className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium ${type === t ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'}`}>
              {t === 'CASH' ? 'Cash' : 'Credit'}
            </button>
          ))}
        </div>

        <Select label="Customer (optional)" placeholder="Walk-in — no customer" value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          options={(customerData?.customers ?? []).map((c) => ({ value: c._id, label: c.name }))} />
        {type === 'CREDIT' && !customerId && (
          <p className="-mt-2 text-xs text-amber-600">No customer selected — this credit will be recorded as an unassigned due.</p>
        )}
        {!customerId && (
          <Input label="Phone (optional)" type="text" inputMode="tel" value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d+\- ]/g, ''))} />
        )}

        <div className="space-y-2">
          {lines.map((l) => {
            const p = productMap.get(l.productId);
            return (
              <div key={l.key} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">
                    {l.name}
                    {l.byAmount && !l.dirty && <span className="ml-1 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">by amount</span>}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="font-medium">{formatPKR(lineTotal(l))}</span>
                    <button type="button" onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))} className="text-slate-400 hover:text-red-500" aria-label={`Remove ${l.name}`}>✕</button>
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Input label={`Qty${p ? ` (${refSymbol(p.unitId)})` : ''}`} type="text" inputMode="decimal" value={l.qtyText}
                    onChange={(e) => decimalOk(e.target.value) && patchLine(l.key, { qtyText: e.target.value })} />
                  <Input label="Unit price (Rs)" type="text" inputMode="decimal" value={l.priceText}
                    onChange={(e) => decimalOk(e.target.value) && patchLine(l.key, { priceText: e.target.value })} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Select label="Add product" placeholder="Select product…" value={pick} onChange={(e) => setPick(e.target.value)}
              options={products.map((p) => ({ value: p._id, label: `${p.name} — ${formatPKR(p.sellingPriceMinor)}` }))} />
          </div>
          <Input label="Qty" type="text" inputMode="decimal" className="w-20" value={addQty}
            onChange={(e) => decimalOk(e.target.value) && setAddQty(e.target.value)} />
          <Button type="button" variant="outline" onClick={addLine} disabled={!pick}>Add</Button>
        </div>

        <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-base font-semibold">
          <span>Total</span>
          <span className="text-brand-700">{formatPKR(total)}</span>
        </div>

        <Button className="w-full" size="lg" onClick={save} loading={update.isPending} disabled={invalid}>
          Save changes
        </Button>
      </div>
    </Modal>
  );
}
