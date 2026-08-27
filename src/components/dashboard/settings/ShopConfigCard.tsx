'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSettings, useUpdateSettings } from '@/features/shop/hooks';

function TagEditor({ label, tags, onChange }: { label: string; tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim().toUpperCase();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput('');
  };
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-700">{label}</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {t}
            <button onClick={() => onChange(tags.filter((x) => x !== t))} className="text-slate-400 hover:text-red-500" aria-label={`Remove ${t}`}>
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Add…"
          className="h-8 flex-1 rounded-lg border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <Button type="button" size="sm" variant="outline" onClick={add}>Add</Button>
      </div>
    </div>
  );
}

export function ShopConfigCard() {
  const { data: settings, isLoading } = useSettings();
  const update = useUpdateSettings();
  const [methods, setMethods] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);

  useEffect(() => {
    if (settings) {
      setMethods(settings.paymentMethods);
      setTypes(settings.customerTypes);
    }
  }, [settings]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment methods & customer types</CardTitle>
      </CardHeader>
      <CardBody className="space-y-6">
        {isLoading ? (
          <div className="h-32 animate-pulse rounded-lg bg-slate-100" />
        ) : (
          <>
            <TagEditor label="Payment methods" tags={methods} onChange={setMethods} />
            <TagEditor label="Customer types" tags={types} onChange={setTypes} />
            <Button
              onClick={() => update.mutate({ paymentMethods: methods, customerTypes: types })}
              loading={update.isPending}
              disabled={methods.length === 0 || types.length === 0}
            >
              Save configuration
            </Button>
          </>
        )}
      </CardBody>
    </Card>
  );
}
