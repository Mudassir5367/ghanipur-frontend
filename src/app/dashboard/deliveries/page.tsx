'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { DeliveryForm } from '@/components/dashboard/deliveries/DeliveryForm';
import { DeliveryDetail } from '@/components/dashboard/deliveries/DeliveryDetail';
import { useDeliveryRoster, useDelivery } from '@/features/delivery/hooks';
import { formatPKR } from '@/lib/utils';
import type { RosterRow } from '@/features/delivery/api';

type Filter = 'ALL' | 'PENDING' | 'DELIVERED';

export default function DeliveriesPage() {
  const { data, isLoading } = useDeliveryRoster();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');

  // Form state: one delivery per customer, opened either to create (preset customer) or edit.
  const [createCustomerId, setCreateCustomerId] = useState<string | null>(null);
  const [editDeliveryId, setEditDeliveryId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const { data: editDelivery } = useDelivery(editDeliveryId);

  const allRows = data?.rows ?? [];
  const pendingCount = allRows.filter((r) => r.status === 'PENDING').length;
  const deliveredCount = allRows.filter((r) => r.status === 'DELIVERED').length;

  const rows = useMemo(() => {
    let r = allRows;
    if (filter !== 'ALL') r = r.filter((x) => x.status === filter);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter((x) => x.name.toLowerCase().includes(q) || x.phone.includes(search));
    }
    return r;
  }, [allRows, filter, search]);

  // Client-side pagination (the roster returns every customer at once).
  const PAGE_SIZE = 15;
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [filter, search]);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const meta = { page: safePage, limit: PAGE_SIZE, total: rows.length, totalPages };

  const openCreate = (customerId: string) => { setEditDeliveryId(null); setCreateCustomerId(customerId); };
  const openEdit = (deliveryId: string) => { setCreateCustomerId(null); setEditDeliveryId(deliveryId); };
  const closeForm = () => { setCreateCustomerId(null); setEditDeliveryId(null); };

  const columns: Column<RosterRow>[] = [
    {
      key: 'name', header: 'Customer', render: (r) => (
        <div>
          <div className="font-medium text-slate-800">{r.name}</div>
          {r.phone && <div className="text-xs text-slate-400">{r.phone}</div>}
        </div>
      ),
    },
    {
      key: 'status', header: 'Status', render: (r) => r.status === 'PENDING' ? (
        <button onClick={() => openCreate(r.customerId)} title="Click to deliver"
          className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-200">
          PENDING
        </button>
      ) : (
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">DELIVERED</span>
      ),
    },
    {
      key: 'today', header: "Today's delivery", align: 'right',
      render: (r) => r.todayTotalMinor > 0 ? formatPKR(r.todayTotalMinor) : <span className="text-slate-400">—</span>,
    },
    {
      key: 'outstanding', header: 'Outstanding', align: 'right',
      render: (r) => r.outstandingMinor > 0 ? <span className="font-medium text-red-600">{formatPKR(r.outstandingMinor)}</span> : '—',
    },
    {
      key: 'actions', header: '', align: 'right', render: (r) => r.status === 'PENDING' ? (
        <Button size="sm" onClick={() => openCreate(r.customerId)}>Deliver</Button>
      ) : (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => r.deliveryId && setDetailId(r.deliveryId)}>View</Button>
          <Button size="sm" variant="outline" onClick={() => r.deliveryId && openEdit(r.deliveryId)}>Edit</Button>
        </div>
      ),
    },
  ];

  const formOpen = !!createCustomerId || (!!editDeliveryId && !!editDelivery);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Deliveries</h1>
          <p className="text-sm text-slate-500">Daily roster — every customer starts <span className="font-medium text-amber-700">PENDING</span> at midnight. Tap a PENDING badge to deliver.</p>
        </div>
        <div className="text-right text-sm text-slate-500">
          <span className="font-semibold text-amber-700">{pendingCount} pending</span> · <span className="font-semibold text-green-700">{deliveredCount} delivered</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {(['ALL', 'PENDING', 'DELIVERED'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${filter === f ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-800'}`}>
              {f}
            </button>
          ))}
        </div>
        <Input placeholder="Search customer…" className="max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card><CardBody className="p-0">
        <DataTable columns={columns} data={paged} isLoading={isLoading} rowKey={(r) => r.customerId} empty="No customers yet. Add customers and they'll appear here as PENDING." pagination={{ meta, onPageChange: setPage }} />
      </CardBody></Card>

      <DeliveryForm
        open={formOpen}
        onClose={closeForm}
        presetCustomerId={createCustomerId ?? undefined}
        deliverNow
        editDelivery={editDeliveryId ? editDelivery ?? null : null}
      />
      <DeliveryDetail id={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}
