'use client';

import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useProducts } from '@/features/catalog/hooks';
import { useConversions, useCreateConversion } from '@/features/conversion/hooks';
import { previewConversion, CONVERSION_RATE, type Conversion } from '@/features/conversion/api';
import { formatPKR } from '@/lib/utils';
import { refSymbol } from '@/types/catalog';

export default function ConversionsPage() {
  const { data: productData } = useProducts({});
  const [page, setPage] = useState(1);
  const { data: history, isLoading } = useConversions(page);
  const convert = useCreateConversion();

  const products = useMemo(() => productData?.products ?? [], [productData]);
  const productMap = useMemo(() => new Map(products.map((p) => [p._id, p])), [products]);

  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [qty, setQty] = useState('');

  const source = productMap.get(sourceId);
  const target = productMap.get(targetId);
  const quantity = Number(qty);
  const preview = source && quantity > 0 ? previewConversion(quantity, source.sellingPriceMinor) : null;

  const canSubmit = !!source && !!target && sourceId !== targetId && quantity > 0;

  const submit = () => {
    if (!canSubmit) return;
    convert.mutate(
      { sourceProductId: sourceId, targetProductId: targetId, quantity },
      { onSuccess: () => { setQty(''); } },
    );
  };

  const columns: Column<Conversion>[] = [
    { key: 'date', header: 'Date', render: (c) => new Date(c.createdAt).toLocaleString() },
    { key: 'from', header: 'From', render: (c) => <span className="font-medium text-slate-800">{c.sourceQuantity} {c.unitSymbol} {c.sourceName}</span> },
    { key: 'to', header: 'To', render: (c) => <span className="font-medium text-brand-700">{c.convertedQuantity} {c.unitSymbol} {c.targetName}</span> },
    { key: 'rate', header: 'Yield', align: 'right', render: (c) => `${Math.round(c.rate * 100)}%` },
    { key: 'price', header: 'New unit price', align: 'right', render: (c) => formatPKR(c.convertedUnitPriceMinor) },
    { key: 'value', header: 'Value', align: 'right', render: (c) => formatPKR(c.totalValueMinor) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Conversions</h1>
        <p className="text-sm text-slate-500">
          Convert milk into products like Sweet Milk or Yogurt. Yield is {Math.round(CONVERSION_RATE * 100)}% —
          100 {`L/kg`} of milk makes {Math.round(CONVERSION_RATE * 100)} {`L/kg`} of the converted product.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>New conversion</CardTitle></CardHeader>
            <CardBody className="space-y-4">
              <Select
                label="From (source, e.g. Milk)" placeholder="Select product…" value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                options={products.map((p) => ({ value: p._id, label: `${p.name} — ${formatPKR(p.sellingPriceMinor)}${p.trackInventory ? ` (${p.currentStock} ${refSymbol(p.unitId)})` : ''}` }))}
              />
              <Select
                label="To (converted, e.g. Sweet Milk / Yogurt)" placeholder="Select product…" value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                options={products.filter((p) => p._id !== sourceId).map((p) => ({ value: p._id, label: `${p.name} (${p.trackInventory ? `${p.currentStock} ${refSymbol(p.unitId)}` : 'untracked'})` }))}
              />
              <Input
                label={`Quantity of ${source?.name ?? 'source'} to convert`} type="text" inputMode="decimal"
                placeholder="e.g. 100" value={qty}
                onChange={(e) => { const v = e.target.value; if (v === '' || /^\d*\.?\d*$/.test(v)) setQty(v); }}
              />

              {preview && source && (
                <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Converted quantity</span>
                    <span className="font-semibold text-brand-700">{preview.convertedQuantity} {refSymbol(source.unitId)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Converted unit price</span>
                    <span className="font-semibold text-slate-800">{formatPKR(preview.convertedUnitPriceMinor)} / {refSymbol(source.unitId)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                    <span className="text-slate-500">Total value (preserved)</span>
                    <span className="font-semibold text-slate-800">{formatPKR(preview.totalValueMinor)}</span>
                  </div>
                  {target && <p className="pt-1 text-xs text-slate-400">{target.name}&apos;s price will be set to {formatPKR(preview.convertedUnitPriceMinor)} and its stock increased by {preview.convertedQuantity} {refSymbol(source.unitId)}.</p>}
                </div>
              )}

              <Button className="w-full" size="lg" disabled={!canSubmit} loading={convert.isPending} onClick={submit}>
                Convert
              </Button>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader><CardTitle>Conversion history</CardTitle></CardHeader>
            <CardBody className="p-0">
              <DataTable columns={columns} data={history?.conversions} isLoading={isLoading} rowKey={(c) => c._id} empty="No conversions yet." pagination={{ meta: history?.meta, onPageChange: setPage }} />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
