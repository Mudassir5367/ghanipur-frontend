'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useConversionOptions, useConversions, useCreateConversion } from '@/features/conversion/hooks';
import { previewConversion, CONVERSION_RATE, OUTPUT_LABEL, type Conversion, type ConversionOutputKind } from '@/features/conversion/api';
import { periodRange } from '@/features/conversion/periods';
import { useCategories, useUnits } from '@/features/catalog/hooks';
import { createCategory, createProduct } from '@/features/catalog/api';
import { useAuthStore } from '@/store/auth';
import { apiErrorMessage } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { formatPKR } from '@/lib/utils';

const OUTPUTS: ConversionOutputKind[] = ['SWEET_MILK', 'YOGURT'];

export default function ConversionsPage() {
  const { data: options, isLoading: optionsLoading } = useConversionOptions();
  const convert = useCreateConversion();

  const [milkId, setMilkId] = useState('');
  const [outputKind, setOutputKind] = useState<ConversionOutputKind | ''>('');
  const [targetId, setTargetId] = useState('');
  const [qty, setQty] = useState('');

  const milkList = useMemo(() => options?.milk ?? [], [options]);
  const outputList = useMemo(() => (outputKind && options ? options.outputs[outputKind] : []), [options, outputKind]);
  const milk = milkList.find((m) => m._id === milkId);
  const target = outputList.find((o) => o._id === targetId);

  // Keep a still-valid choice (stock refreshes after each conversion); otherwise
  // pre-select when there is exactly one product — the usual case.
  useEffect(() => {
    setMilkId((cur) => (milkList.some((m) => m._id === cur) ? cur : milkList.length === 1 ? milkList[0]!._id : ''));
  }, [milkList]);
  useEffect(() => {
    setTargetId((cur) => (outputList.some((o) => o._id === cur) ? cur : outputList.length === 1 ? outputList[0]!._id : ''));
  }, [outputList]);

  const quantity = Number(qty);
  const preview = milk && quantity > 0 ? previewConversion(quantity, milk.sellingPriceMinor) : null;
  const overStock = !!milk && quantity > milk.currentStock;
  const canSubmit = !!milk && !!target && quantity > 0 && !overStock;

  // The output product (Yogurt / Sweet Milk) must exist to receive stock. If it
  // doesn't, create it here — with prices the user enters, since a conversion
  // never sets prices.
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canCreateProduct = user?.role === 'SUPER_ADMIN' || !!user?.permissions?.includes('PRODUCT_CREATE');
  const { data: categories } = useCategories();
  const { data: units } = useUnits();
  const missingOutput = !!outputKind && !!options && outputList.length === 0;
  const [newSell, setNewSell] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newUnitId, setNewUnitId] = useState('');
  useEffect(() => {
    // Yield is quoted in kg ("92 kg per 100"), so default the new output to kg.
    if (!newUnitId && units?.length) setNewUnitId((units.find((u) => u.symbol === 'kg') ?? units[0]!)._id);
  }, [units, newUnitId]);
  const createOutput = useMutation({
    mutationFn: async () => {
      const kind = outputKind as ConversionOutputKind;
      const categoryName = kind === 'YOGURT' ? 'Yogurt' : 'Milk';
      const category = categories?.find((c) => c.name.toLowerCase() === categoryName.toLowerCase())
        ?? (await createCategory({ name: categoryName }));
      return createProduct({
        name: OUTPUT_LABEL[kind]!,
        categoryId: category._id,
        unitId: newUnitId,
        sellingPrice: Number(newSell),
        purchaseCost: Number(newCost),
        openingStock: 0,
      });
    },
    onSuccess: async (product) => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      await qc.invalidateQueries({ queryKey: ['conversion-options'] });
      setTargetId(product._id);
      setNewSell('');
      setNewCost('');
      toast.success(`${product.name} product created`);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });
  const newPriceOk = (v: string) => v.trim() !== '' && Number(v) >= 0;

  // Say why Convert is disabled instead of leaving a silent grey button.
  const blocker = !milk ? 'Select Milk.'
    : !outputKind ? 'Choose Sweet Milk or Yogurt.'
    : missingOutput ? `Create the ${OUTPUT_LABEL[outputKind]} product above first.`
    : !target ? `Select the ${OUTPUT_LABEL[outputKind]} product.`
    : !(quantity > 0) ? 'Enter the Milk quantity.'
    : overStock ? 'Not enough Milk in stock.'
    : null;

  const submit = () => {
    if (!canSubmit) return;
    convert.mutate({ sourceProductId: milk!._id, targetProductId: target!._id, quantity }, { onSuccess: () => setQty('') });
  };

  // Today's conversions under the form; the full daily/weekly/monthly view is its own page.
  const today = useMemo(() => periodRange('DAILY', new Date()), []);
  const [page, setPage] = useState(1);
  const { data: todays, isLoading } = useConversions({ from: today.from, to: today.to, page });

  const columns: Column<Conversion>[] = [
    { key: 'time', header: 'Time', render: (c) => new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    { key: 'milk', header: 'Milk used', render: (c) => <span className="font-medium text-slate-800">{c.sourceQuantity} {c.unitSymbol} {c.sourceName}</span> },
    { key: 'out', header: 'Output', render: (c) => <span className="font-medium text-brand-700">{c.convertedQuantity} {c.targetUnitSymbol ?? c.unitSymbol} {c.targetName}</span> },
    { key: 'cost', header: 'Cost price / unit', align: 'right', render: (c) => <span className="text-slate-500">{formatPKR(c.convertedUnitPriceMinor)}</span> },
  ];

  const pct = Math.round(CONVERSION_RATE * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Conversions</h1>
          <p className="text-sm text-slate-500">Convert Milk into Sweet Milk or Yogurt. Every 100 of Milk gives {pct} of output.</p>
        </div>
        <Link href="/dashboard/conversions/history"><Button variant="outline">Conversion history</Button></Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>New conversion</CardTitle></CardHeader>
            <CardBody className="space-y-4">
              {!optionsLoading && milkList.length === 0 && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  No Milk product found. Add a product named “Milk” (or in the Milk category) that tracks stock.
                </p>
              )}

              {/* 1. Milk */}
              <Select label="1. Milk" placeholder="Select Milk…" value={milkId} onChange={(e) => setMilkId(e.target.value)}
                options={milkList.map((m) => ({ value: m._id, label: `${m.name} (${m.currentStock} ${m.unitSymbol} in stock)` }))} />

              {/* 2. Output */}
              <div>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">2. Convert into</span>
                <div className="flex gap-2">
                  {OUTPUTS.map((k) => (
                    <button key={k} type="button" onClick={() => setOutputKind(k)}
                      className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium ${outputKind === k ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'}`}>
                      {OUTPUT_LABEL[k]}
                    </button>
                  ))}
                </div>
                {missingOutput && (canCreateProduct ? (
                  <div className="mt-2 space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm text-amber-800">
                      You don&apos;t have a <span className="font-medium">{OUTPUT_LABEL[outputKind]}</span> product yet. Create it to receive the converted stock:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="Selling price (Rs)" type="text" inputMode="decimal" value={newSell}
                        onChange={(e) => { const v = e.target.value; if (v === '' || /^\d*\.?\d*$/.test(v)) setNewSell(v); }} />
                      <Input label="Cost price (Rs)" type="text" inputMode="decimal" value={newCost}
                        onChange={(e) => { const v = e.target.value; if (v === '' || /^\d*\.?\d*$/.test(v)) setNewCost(v); }} />
                    </div>
                    <Select label="Unit" value={newUnitId} onChange={(e) => setNewUnitId(e.target.value)}
                      options={(units ?? []).map((u) => ({ value: u._id, label: `${u.name} (${u.symbol})` }))} />
                    <Button type="button" className="w-full" loading={createOutput.isPending}
                      disabled={!newPriceOk(newSell) || !newPriceOk(newCost) || !newUnitId || !categories}
                      onClick={() => createOutput.mutate()}>
                      Create {OUTPUT_LABEL[outputKind]} product
                    </Button>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-amber-700">No {OUTPUT_LABEL[outputKind]} product yet. Ask a shop admin to add one named “{OUTPUT_LABEL[outputKind]}”.</p>
                ))}
                {outputList.length > 1 && (
                  <div className="mt-2">
                    <Select placeholder={`Select ${OUTPUT_LABEL[outputKind]} product…`} value={targetId} onChange={(e) => setTargetId(e.target.value)}
                      options={outputList.map((o) => ({ value: o._id, label: `${o.name} (${o.currentStock} ${o.unitSymbol})` }))} />
                  </div>
                )}
              </div>

              {/* 3. Milk quantity */}
              <Input
                label={`3. Milk quantity${milk ? ` (${milk.unitSymbol})` : ''}`} type="text" inputMode="decimal" placeholder="e.g. 100" value={qty}
                onChange={(e) => { const v = e.target.value; if (v === '' || /^\d*\.?\d*$/.test(v)) setQty(v); }}
              />
              {overStock && <p className="-mt-2 text-xs text-red-600">Only {milk!.currentStock} {milk!.unitSymbol} of {milk!.name} in stock.</p>}

              {preview && milk && (
                <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Milk deducted</span>
                    <span className="font-semibold text-slate-800">− {quantity} {milk.unitSymbol}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{target ? target.name : 'Output'} added ({pct}%)</span>
                    <span className="font-semibold text-brand-700">+ {preview.convertedQuantity} {target?.unitSymbol ?? ''}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                    <span className="text-slate-500">Cost price / unit (reference)</span>
                    <span className="font-medium text-slate-700">{formatPKR(preview.convertedUnitPriceMinor)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Total cost (reference)</span>
                    <span className="font-medium text-slate-700">{formatPKR(preview.totalValueMinor)}</span>
                  </div>
                  <p className="pt-1 text-xs text-slate-400">Cost is for reference only — product selling prices are not changed.</p>
                </div>
              )}

              <Button className="w-full" size="lg" disabled={!canSubmit} loading={convert.isPending} onClick={submit}>
                Convert
              </Button>
              {blocker && !optionsLoading && <p className="-mt-2 text-center text-xs text-slate-500">{blocker}</p>}
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Today&apos;s conversions</CardTitle>
                <Link href="/dashboard/conversions/history" className="text-sm font-medium text-brand-700 hover:underline">Daily · weekly · monthly →</Link>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <DataTable columns={columns} data={todays?.conversions} isLoading={isLoading} rowKey={(c) => c._id}
                empty="No conversions yet today." pagination={{ meta: todays?.meta, onPageChange: setPage }} />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
