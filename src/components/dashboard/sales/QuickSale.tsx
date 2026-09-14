'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useAllProducts } from '@/features/catalog/hooks';
import { useAllCustomers, useCreateSale } from '@/features/sales/hooks';
import { formatPKR } from '@/lib/utils';
import { refSymbol, type Product } from '@/types/catalog';

type EntryMode = 'QTY' | 'AMOUNT';
interface Line { productId: string; name: string; unitPriceMinor: number; quantity: number; symbol: string; lineTotalMinor: number; byAmount: boolean }

const lineId = (l: Pick<Line, 'productId' | 'byAmount'>) => `${l.productId}:${l.byAmount ? 'a' : 'q'}`;
const round3 = (n: number) => Math.round(n * 1000) / 1000;

export function QuickSale() {
  const { data: productData } = useAllProducts(); // every product, not one page
  const { data: customerData } = useAllCustomers(); // every customer, not one page
  const createSale = useCreateSale();

  const [type, setType] = useState<'CASH' | 'CREDIT'>('CASH');
  const [customerId, setCustomerId] = useState('');
  const [phone, setPhone] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [pick, setPick] = useState('');
  const [entryMode, setEntryMode] = useState<EntryMode>('QTY');
  const [val, setVal] = useState('1');

  const products = useMemo(() => productData ?? [], [productData]);
  const productMap = useMemo(() => new Map(products.map((p) => [p._id, p])), [products]);
  const total = lines.reduce((s, l) => s + l.lineTotalMinor, 0);

  const picked = productMap.get(pick);
  // Live preview of the derived quantity when buying by amount.
  const previewQty =
    entryMode === 'AMOUNT' && picked && Number(val) > 0 && picked.sellingPriceMinor > 0
      ? round3((Math.round(Number(val) * 100)) / picked.sellingPriceMinor)
      : null;

  const addLine = () => {
    const p: Product | undefined = productMap.get(pick);
    const n = Number(val);
    if (!p || !n || n <= 0) return;
    const priceMinor = p.sellingPriceMinor;
    let quantity: number;
    let lineTotalMinor: number;
    if (entryMode === 'AMOUNT') {
      if (priceMinor <= 0) return; // can't derive qty without a price
      lineTotalMinor = Math.round(n * 100);
      quantity = round3(lineTotalMinor / priceMinor);
    } else {
      quantity = n;
      lineTotalMinor = Math.round(priceMinor * quantity);
    }
    const byAmount = entryMode === 'AMOUNT';
    setLines((prev) => {
      const id = `${p._id}:${byAmount ? 'a' : 'q'}`;
      const existing = prev.find((l) => lineId(l) === id);
      if (existing) {
        return prev.map((l) =>
          lineId(l) === id ? { ...l, quantity: round3(l.quantity + quantity), lineTotalMinor: l.lineTotalMinor + lineTotalMinor } : l,
        );
      }
      return [...prev, { productId: p._id, name: p.name, unitPriceMinor: priceMinor, quantity, symbol: refSymbol(p.unitId), lineTotalMinor, byAmount }];
    });
    setPick('');
    setVal(entryMode === 'AMOUNT' ? '' : '1');
  };

  const removeLine = (id: string) => setLines((prev) => prev.filter((l) => lineId(l) !== id));

  // Enter adds the line — exactly like clicking Add, and only when Add is enabled.
  const addOnEnter = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || !pick || !val) return;
    e.preventDefault();
    addLine();
  };

  // Pre-select a product in the dropdown when arriving from a storefront card
  // (/dashboard/sales?add=<id>). Waits for the catalogue to load, selects it once,
  // then cleans the URL so a refresh won't re-select it.
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || products.length === 0) return;
    prefilled.current = true;
    const addId = new URLSearchParams(window.location.search).get('add');
    if (!addId || !productMap.has(addId)) return;
    setPick(addId);
    window.history.replaceState(null, '', window.location.pathname);
  }, [products, productMap]);

  const submit = () => {
    if (lines.length === 0) return;
    createSale.mutate(
      {
        type,
        // Customer is optional for both cash and credit.
        customerId: customerId || undefined,
        // Optional walk-in phone (kept on the sale itself).
        customerPhone: phone.trim() || undefined,
        // Amount-based lines send the rupee amount; the backend derives the quantity.
        items: lines.map((l) => (l.byAmount ? { productId: l.productId, amount: l.lineTotalMinor / 100 } : { productId: l.productId, quantity: l.quantity })),
      },
      { onSuccess: () => { setLines([]); setCustomerId(''); setPhone(''); } },
    );
  };

  const canSubmit = lines.length > 0;

  return (
    <Card>
      <CardHeader><CardTitle>New Sale</CardTitle></CardHeader>
      <CardBody className="space-y-4">
        {/* Cash / Credit toggle */}
        <div className="flex gap-2">
          {(['CASH', 'CREDIT'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium ${type === t ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'}`}
            >
              {t === 'CASH' ? 'Cash' : 'Credit'}
            </button>
          ))}
        </div>

        {/* Customer is optional for both cash and credit (walk-ins need none). */}
        <Select
          label={type === 'CREDIT' ? 'Customer (optional)' : 'Customer (optional, for walk-in leave empty)'}
          placeholder="Walk-in — no customer" value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          options={(customerData?.customers ?? []).map((c) => ({ value: c._id, label: `${c.name}${c.currentBalanceMinor > 0 ? ` — owes ${formatPKR(c.currentBalanceMinor)}` : ''}` }))}
        />
        {type === 'CREDIT' && !customerId && (
          <p className="-mt-2 text-xs text-amber-600">No customer selected — this credit will be recorded as an unassigned due.</p>
        )}

        {/* Optional walk-in phone (only when no saved customer is chosen). */}
        {!customerId && (
          <Input
            label="Phone (optional)" type="text" inputMode="tel" placeholder="e.g. 03001234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d+\- ]/g, ''))}
          />
        )}

        {/* Sell by quantity or by rupee amount */}
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
          {([['QTY', 'By quantity'], ['AMOUNT', 'By amount (Rs)']] as const).map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => { setEntryMode(m); setVal(m === 'AMOUNT' ? '' : '1'); }}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${entryMode === m ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Add item row */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Select label="Product" placeholder="Select product…" value={pick} onChange={(e) => setPick(e.target.value)} onKeyDown={addOnEnter}
              options={products.map((p) => ({ value: p._id, label: `${p.name} — ${formatPKR(p.sellingPriceMinor)}${p.trackInventory ? ` (${p.currentStock} ${refSymbol(p.unitId)})` : ''}` }))} />
          </div>
          {/* Text + inputMode=decimal (not type=number): a number input reports an
              empty value mid-typing for "1.", which drops the decimal point. */}
          <Input
            label={entryMode === 'AMOUNT' ? 'Amount (Rs)' : 'Qty'}
            type="text"
            inputMode="decimal"
            className="w-28"
            placeholder={entryMode === 'AMOUNT' ? '100' : '1'}
            value={val}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '' || /^\d*\.?\d*$/.test(v)) setVal(v); // digits + one optional dot
            }}
            onKeyDown={addOnEnter}
          />
          <Button variant="outline" onClick={addLine} disabled={!pick || !val}>Add</Button>
        </div>
        {previewQty !== null && picked && (
          <p className="-mt-2 text-xs text-slate-500">
            ≈ <span className="font-medium text-slate-700">{previewQty} {refSymbol(picked.unitId)}</span> of {picked.name} for Rs {val}
          </p>
        )}

        {/* Cart */}
        {lines.length > 0 && (
          <div className="rounded-lg border border-slate-200">
            {lines.map((l) => (
              <div key={lineId(l)} className="flex items-center justify-between border-b border-slate-100 px-4 py-2 text-sm last:border-0">
                <div>
                  <span className="font-medium text-slate-800">{l.name}</span>
                  <span className="text-slate-400">
                    {' · '}{l.quantity} {l.symbol} × {formatPKR(l.unitPriceMinor)}
                    {l.byAmount && <span className="ml-1 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">by amount</span>}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{formatPKR(l.lineTotalMinor)}</span>
                  <button onClick={() => removeLine(lineId(l))} className="text-slate-400 hover:text-red-500">✕</button>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-3 text-base font-semibold">
              <span>Total</span>
              <span className="text-brand-700">{formatPKR(total)}</span>
            </div>
          </div>
        )}

        <Button className="w-full" size="lg" disabled={!canSubmit} loading={createSale.isPending} onClick={submit}>
          {type === 'CASH' ? 'Confirm cash sale' : 'Confirm credit sale'}
        </Button>
      </CardBody>
    </Card>
  );
}
