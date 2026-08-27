import { Badge } from '@/components/ui/Badge';
import type { DeliveryStatus, PaymentStatus } from '@/features/delivery/api';

const deliveryTone: Record<DeliveryStatus, 'slate' | 'amber' | 'blue' | 'green'> = {
  PENDING: 'amber', CONFIRMED: 'blue', OUT_FOR_DELIVERY: 'blue', DELIVERED: 'green', CANCELLED: 'slate',
};
// Two states only: fully Paid, or Due (a partially-paid delivery still owes money,
// so it reads as Due — the exact amount shows in the Outstanding column).
const payTone: Record<PaymentStatus, 'green' | 'red'> = {
  PAID: 'green', PARTIALLY_PAID: 'red', DUE: 'red',
};
const payLabel: Record<PaymentStatus, string> = { PAID: 'Paid', PARTIALLY_PAID: 'Due', DUE: 'Due' };

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  return <Badge tone={deliveryTone[status]}>{status.replace(/_/g, ' ')}</Badge>;
}
export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge tone={payTone[status]}>{payLabel[status]}</Badge>;
}

/** Next allowed action for the delivery status flow. */
export function nextDeliveryAction(status: DeliveryStatus): { label: string; status: DeliveryStatus } | null {
  switch (status) {
    case 'PENDING': return { label: 'Confirm Delivery', status: 'CONFIRMED' };
    case 'CONFIRMED': return { label: 'Out for Delivery', status: 'OUT_FOR_DELIVERY' };
    case 'OUT_FOR_DELIVERY': return { label: 'Mark Delivered', status: 'DELIVERED' };
    default: return null;
  }
}
