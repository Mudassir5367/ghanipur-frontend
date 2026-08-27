'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useDelivery, useSetDeliveryStatus, useAddDeliveryPayment } from '@/features/delivery/hooks';
import { DeliveryStatusBadge, PaymentStatusBadge, nextDeliveryAction } from './status';
import { formatPKR } from '@/lib/utils';

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? 'text-base font-semibold' : 'text-sm'}`}>
      <span className={strong ? 'text-slate-900' : 'text-slate-500'}>{label}</span>
      <span className={strong ? 'text-brand-700' : 'text-slate-800'}>{value}</span>
    </div>
  );
}

export function DeliveryDetail({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data: d, isLoading } = useDelivery(id);
  const setStatus = useSetDeliveryStatus();
  const addPayment = useAddDeliveryPayment();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [confirmCancel, setConfirmCancel] = useState(false);

  const action = d ? nextDeliveryAction(d.status) : null;

  const pay = () => {
    if (!d || !amount) return;
    addPayment.mutate({ id: d._id, payload: { amount: Number(amount), method } }, { onSuccess: () => setAmount('') });
  };

  return (
    <Modal open={!!id} onClose={onClose} title={d ? `Delivery ${d.code}` : 'Delivery'}>
      {isLoading || !d ? (
        <div className="h-40 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <div className="space-y-5">
          {/* Summary */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <DeliveryStatusBadge status={d.status} />
              <PaymentStatusBadge status={d.paymentStatus} />
            </div>
            <span className="text-xs text-slate-400">{new Date(d.createdAt).toLocaleString()}</span>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
            <p className="font-medium text-slate-800">{d.customerName || 'Walk-in customer'}</p>
            {d.customerPhone && <p className="text-slate-500">{d.customerPhone}</p>}
            {d.address && <p className="text-slate-500">{d.address}</p>}
            {d.assignedToName && <p className="text-slate-400">Delivery person: {d.assignedToName}</p>}
          </div>

          {/* Products */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Products</p>
            <div className="space-y-2">
              {d.lines.map((l, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  {l.imageUrl
                    ? // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.imageUrl} alt={l.name} className="h-10 w-10 rounded object-cover" />
                    : <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-100">📦</div>}
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{l.name}</p>
                    <p className="text-xs text-slate-400">{l.sku} · {l.category} · {l.quantity} {l.unitSymbol} × {formatPKR(l.unitPriceMinor)}</p>
                    {l.stockBefore != null && (
                      <p className="text-xs text-slate-400">Stock: {l.stockBefore} → {l.stockAfter} {l.unitSymbol}</p>
                    )}
                  </div>
                  <span className="font-medium">{formatPKR(l.lineTotalMinor)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Financials */}
          <div className="space-y-1 rounded-lg border border-slate-200 px-4 py-3">
            <Row label="Subtotal" value={formatPKR(d.subtotalMinor)} />
            <Row label="Delivery charges" value={formatPKR(d.deliveryChargeMinor)} />
            <Row label="Discount" value={`- ${formatPKR(d.discountMinor)}`} />
            <Row label="Grand Total" value={formatPKR(d.grandTotalMinor)} strong />
            <Row label="Paid" value={formatPKR(d.paidMinor)} />
            <Row label="Remaining Balance" value={formatPKR(d.remainingMinor)} />
          </div>

          {/* Payment history */}
          {d.payments.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Payment History</p>
              <div className="overflow-hidden rounded-lg border border-slate-100">
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50 text-left text-xs text-slate-400">
                    <th className="px-3 py-1.5">Date</th><th className="px-3 py-1.5">Method</th>
                    <th className="px-3 py-1.5 text-right">Amount</th><th className="px-3 py-1.5 text-right">Remaining</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {d.payments.map((p) => (
                      <tr key={p._id}>
                        <td className="px-3 py-1.5">{new Date(p.receivedAt).toLocaleDateString()}</td>
                        <td className="px-3 py-1.5">{p.method}</td>
                        <td className="px-3 py-1.5 text-right text-brand-700">{formatPKR(p.amountMinor)}</td>
                        <td className="px-3 py-1.5 text-right text-slate-500">{formatPKR(p.remainingAfterMinor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Add payment */}
          {d.status !== 'CANCELLED' && d.remainingMinor > 0 && (
            <div className="flex items-end gap-2">
              <Input label="Add payment (Rs)" type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="flex-1" hint={`Remaining ${formatPKR(d.remainingMinor)}`} />
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="h-10 rounded-lg border border-slate-300 px-2 text-sm">
                {['CASH', 'BANK', 'EASYPAISA', 'JAZZCASH', 'CARD'].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <Button onClick={pay} loading={addPayment.isPending} disabled={!amount}>Pay</Button>
            </div>
          )}

          {/* Status actions */}
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            {action && (
              <Button onClick={() => setStatus.mutate({ id: d._id, status: action.status })} loading={setStatus.isPending}>{action.label}</Button>
            )}
            {d.status !== 'CANCELLED' && d.status !== 'DELIVERED' && (
              <Button variant="danger" onClick={() => setConfirmCancel(true)}>Cancel Delivery</Button>
            )}
          </div>

          <ConfirmDialog
            open={confirmCancel}
            title="Cancel delivery"
            message={d.inventoryDeducted ? 'This will restore the delivered stock to inventory. The delivery and its payment history are preserved.' : 'Cancel this delivery? The record is preserved.'}
            confirmLabel="Cancel Delivery" danger loading={setStatus.isPending}
            onClose={() => setConfirmCancel(false)}
            onConfirm={() => setStatus.mutate({ id: d._id, status: 'CANCELLED' }, { onSuccess: () => setConfirmCancel(false) })}
          />
        </div>
      )}
    </Modal>
  );
}
