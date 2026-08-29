import { api } from '@/lib/api';
import type { ApiSuccess, PageMeta } from '@/types/api';

interface Populated { _id: string; name: string; phone?: string; address?: string }

export type DeliveryStatus = 'PENDING' | 'CONFIRMED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
export type PaymentType = 'CASH' | 'CREDIT';
export type PaymentStatus = 'PAID' | 'PARTIALLY_PAID' | 'DUE';

export interface DeliveryLine {
  productId: string;
  name: string;
  sku: string;
  category: string;
  imageUrl?: string | null;
  quantity: number;
  unitSymbol: string;
  unitPriceMinor: number;
  costPriceMinor?: number;
  lineTotalMinor: number;
  stockBefore?: number | null;
  stockAfter?: number | null;
}

export interface DeliveryPayment {
  _id: string;
  amountMinor: number;
  method: string;
  note?: string;
  remainingAfterMinor: number;
  receivedAt: string;
}

export interface Delivery {
  _id: string;
  code: string;
  customerId: string | Populated | null;
  customerName?: string;
  customerPhone?: string;
  address?: string;
  lines: DeliveryLine[];
  subtotalMinor: number;
  discountMinor: number;
  deliveryChargeMinor: number;
  grandTotalMinor: number;
  paidMinor: number;
  remainingMinor: number;
  paymentType: PaymentType;
  paymentStatus: PaymentStatus;
  payments: DeliveryPayment[];
  status: DeliveryStatus;
  inventoryDeducted: boolean;
  assignedToName?: string;
  note?: string;
  scheduledFor?: string | null;
  confirmedAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
}

export interface CreateDeliveryPayload {
  customerId?: string;
  lines: { productId: string; quantity: number; unitPrice?: number; costPrice?: number }[];
  discount?: number;
  deliveryCharge?: number;
  paymentType: PaymentType;
  paidAmount?: number;
  assignedToName?: string;
  address?: string;
  note?: string;
}

export interface DeliveryFilters {
  status?: DeliveryStatus;
  paymentStatus?: PaymentStatus;
  customerId?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
}

export async function listDeliveries(filters: DeliveryFilters = {}): Promise<{ deliveries: Delivery[]; meta: PageMeta }> {
  const { data } = await api.get<ApiSuccess<Delivery[]>>('/deliveries', { params: { limit: 20, ...filters } });
  return { deliveries: data.data, meta: data.meta! };
}
export async function getDelivery(id: string): Promise<Delivery> {
  const { data } = await api.get<ApiSuccess<{ delivery: Delivery }>>(`/deliveries/${id}`);
  return data.data.delivery;
}
export async function createDelivery(payload: CreateDeliveryPayload): Promise<Delivery> {
  const { data } = await api.post<ApiSuccess<{ delivery: Delivery }>>('/deliveries', payload);
  return data.data.delivery;
}
export async function setDeliveryStatus(id: string, status: DeliveryStatus): Promise<Delivery> {
  const { data } = await api.patch<ApiSuccess<{ delivery: Delivery }>>(`/deliveries/${id}/status`, { status });
  return data.data.delivery;
}
export async function addDeliveryPayment(id: string, payload: { amount: number; method?: string; note?: string }): Promise<Delivery> {
  const { data } = await api.post<ApiSuccess<{ delivery: Delivery }>>(`/deliveries/${id}/payments`, payload);
  return data.data.delivery;
}

export interface CustomerDeliverySummary {
  totalPurchasesMinor: number;
  totalPaidMinor: number;
  outstandingMinor: number;
  deliveryCount: number;
  deliveries: Delivery[];
}
export async function getCustomerDeliverySummary(customerId: string): Promise<CustomerDeliverySummary> {
  const { data } = await api.get<ApiSuccess<CustomerDeliverySummary>>(`/deliveries/customer/${customerId}`);
  return data.data;
}
