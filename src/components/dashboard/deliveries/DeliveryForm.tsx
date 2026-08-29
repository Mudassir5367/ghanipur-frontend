'use client';

import { useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useProducts } from '@/features/catalog/hooks';
import { useCustomers } from '@/features/sales/hooks';
import { useCreateDelivery } from '@/features/delivery/hooks';
import { formatPKR } from '@/lib/utils';
import { refSymbol, type Product } from '@/types/catalog';
import type { PaymentType } from '@/features/delivery/api';

interface Line { productId: string; name: string; unitPriceMinor: number; costPriceMinor: number; quantity: number; symbol: string }

export function DeliveryForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: productData } = useProducts({});
  const { data: customerData } = useCustomers({});
  const create = useCreateDelivery();

  const [customerId, setCustomerId] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [pick, setPick] = useState('');
  const [qty, setQty] = useState('1');
  const [discount, setDiscount] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('CREDIT');
  const [paidAmount, setPaidAmount] = useState('');
  const [address, setAddress] = useState('');
  const [assignedToName, setAssignedToName] = useState('');

  const products = useMemo(() => productData?.products ?? [], [productData]);
  const productMap = useMemo(() => new Map(products.map((p) => [p._id, p])), [products]);

  const subtotal = lines.reduce((s, l) => s + Math.round(l.unitPriceMinor * l.quantity), 0);
  const discountMinor = Math.round((Number(discount) || 0) * 100);
  const chargeMinor = Math.round((Number(deliveryCharge) || 0) * 100);
  const grandTotal = Math.max(0, subtotal + chargeMinor - discountMinor);
  const paid = paymentType === 'CASH' ? grandTotal : Math.min(grandTotal, Math.round((Number(paidAmount) || 0) * 100));
  const remaining = grandTotal - paid;
  // Profit per delivery = Σ (selling/unit − cost/unit) × qty, reflected in the dashboard Profit card.
  const totalProfitMinor = lines.reduce((s, l) => s + Math.round((l.unitPriceMinor - l.costPriceMinor) * l.quantity), 0);

  const updateLine = (id: string, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l) => (l.productId === id ? { ...l, ...patch } : l)));

  const addLine = () => {
    const p: Product | undefined = productMap.get(pick);
    const q = Number(qty);
    if (!p || !q || q <= 0) return;
    setLines((prev) => {
      const found = prev.find((l) => l.productId === p._id);
      if (found) return prev.map((l) => (l.productId === p._id ? { ...l, quantity: l.quantity + q } : l));
      return [...prev, { productId: p._id, name: p.name, unitPriceMinor: p.sellingPriceMinor, costPriceMinor: p.purchaseCostMinor ?? 0, quantity: q, symbol: refSymbol(p.unitId) }];
    });
    setPick(''); setQty('1');
  };

  const reset = () => {
    setCustomerId(''); setLines([]); setPick(''); setQty('1'); setDiscount(''); setDeliveryCharge('');
    setPaymentType('CREDIT'); setPaidAmount(''); setAddress(''); setAssignedToName('');
  };

  // Credit leaves a balance owed, so it must be tied to a customer who owes it.
  const needsCustomer = paymentType === 'CREDIT' && !customerId;

  const submit = () => {
    if (lines.length === 0 || needsCustomer) return;
    create.mutate(
      {
        customerId: customerId || undefined,
        lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitPrice: l.unitPriceMinor / 100, costPrice: l.costPriceMinor / 100 })),
        discount: Number(discount) || undefined,
        deliveryCharge: Number(deliveryCharge) || undefined,
        paymentType,
        paidAmount: paymentType === 'CREDIT' && paidAmount ? Number(paidAmount) : undefined,
        address: address || undefined,
        assignedToName: assignedToName || undefined,
      },
      { onSuccess: () => { reset(); onClose(); } },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title="New Delivery">
      <div className="space-y-4">
        <Select label="Customer (optional)" placeholder="Walk-in / none" value={customerId} onChange={(e) => setCustomerId(e.target.value)}
          options={(customerData?.customers ?? []).map((c) => ({ value: c._id, label: c.name }))} />

        {/* Add item */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Select label="Product" placeholder="Select product…" value={pick} onChange={(e) => setPick(e.target.value)}
              options={products.map((p) => ({ value: p._id, label: `${p.name} — ${formatPKR(p.sellingPriceMinor)}${p.trackInventory ? ` (${p.currentStock} ${refSymbol(p.unitId)})` : ''}` }))} />
          </div>
          <Input label="Qty" type="number" step="any" min="0" className="w-20" value={qty} onChange={(e) => setQty(e.target.value)} />
          <Button variant="outline" type="button" onClick={addLine} disabled={!pick}>Add</Button>
        </div>

        {lines.length > 0 && (
          <div className="space-y-2 text-sm">
            {lines.map((l) => {
              const profit = Math.round((l.unitPriceMinor - l.costPriceMinor) * l.quantity);
              return (
                <div key={l.productId} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{l.name} · {l.quantity} {l.symbol}</span>
                    <span className="flex items-center gap-3">
                      <span className="text-slate-500">Total {formatPKR(Math.round(l.unitPriceMinor * l.quantity))}</span>
                      <button type="button" onClick={() => setLines((p) => p.filter((x) => x.productId !== l.productId))} className="text-slate-400 hover:text-red-500">✕</button>
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 items-end gap-2">
                    <Input label="Selling / unit (Rs)" type="number" step="0.01" min="0" value={l.unitPriceMinor / 100}
                      onChange={(e) => updateLine(l.productId, { unitPriceMinor: Math.round((Number(e.target.value) || 0) * 100) })} />
                    <Input label="Cost / unit (Rs)" type="number" step="0.01" min="0" value={l.costPriceMinor / 100}
                      onChange={(e) => updateLine(l.productId, { costPriceMinor: Math.round((Number(e.target.value) || 0) * 100) })} />
                    <div className="pb-2">
                      <div className="text-xs text-slate-500">Profit</div>
                      <div className={`font-semibold ${profit < 0 ? 'text-red-600' : 'text-green-600'}`}>{formatPKR(profit)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input label="Discount (Rs)" type="number" step="0.01" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          <Input label="Delivery charges (Rs)" type="number" step="0.01" min="0" value={deliveryCharge} onChange={(e) => setDeliveryCharge(e.target.value)} />
        </div>

        {/* Totals */}
        <div className="space-y-1 rounded-lg bg-slate-50 px-4 py-3 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatPKR(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Delivery charges</span><span>{formatPKR(chargeMinor)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Discount</span><span>- {formatPKR(discountMinor)}</span></div>
          <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-semibold"><span>Grand Total</span><span className="text-brand-700">{formatPKR(grandTotal)}</span></div>
          <div className="flex justify-between pt-1"><span className="text-slate-500">Est. profit (selling − cost)</span><span className={totalProfitMinor < 0 ? 'font-medium text-red-600' : 'font-medium text-green-600'}>{formatPKR(totalProfitMinor)}</span></div>
        </div>

        {/* Payment */}
        <div className="flex gap-2">
          {(['CASH', 'CREDIT'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setPaymentType(t)}
              className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium ${paymentType === t ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'}`}>
              {t === 'CASH' ? 'Cash (paid in full)' : 'Credit'}
            </button>
          ))}
        </div>
        {paymentType === 'CREDIT' && (
          <Input label="Amount paid now (Rs)" type="number" step="0.01" min="0" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} hint={`Remaining: ${formatPKR(remaining)}`} />
        )}

        <Input label="Delivery address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <Input label="Delivery person" value={assignedToName} onChange={(e) => setAssignedToName(e.target.value)} />

        {needsCustomer && (
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Select a customer above for a credit delivery, or choose <span className="font-medium">Cash</span>.
          </div>
        )}

        <Button className="w-full" size="lg" disabled={lines.length === 0 || needsCustomer} loading={create.isPending} onClick={submit}>
          Create Delivery — {formatPKR(grandTotal)}
        </Button>
      </div>
    </Modal>
  );
}
