import { api } from '@/lib/api';
import type { ApiSuccess, PageMeta } from '@/types/api';
import type { Customer, Sale, SaleItem, Payment, LedgerEntry, LedgerSummary, LedgerPeriod } from '@/types/sales';

// ---- Customers ----
export interface CustomerFilters { status?: string; type?: string; hasDue?: string; search?: string; page?: number }
export interface CustomerPayload { name: string; phone?: string; address?: string; type?: string; creditLimit?: number; openingBalance?: number; notes?: string }

export async function listCustomers(filters: CustomerFilters = {}): Promise<{ customers: Customer[]; meta: PageMeta }> {
  const { data } = await api.get<ApiSuccess<Customer[]>>('/customers', { params: { limit: 20, ...filters } });
  return { customers: data.data, meta: data.meta! };
}
export async function getCustomer(id: string): Promise<Customer> {
  const { data } = await api.get<ApiSuccess<{ customer: Customer }>>(`/customers/${id}`);
  return data.data.customer;
}
export async function createCustomer(payload: CustomerPayload): Promise<Customer> {
  const { data } = await api.post<ApiSuccess<{ customer: Customer }>>('/customers', payload);
  return data.data.customer;
}
export async function updateCustomer(id: string, payload: Partial<CustomerPayload>): Promise<Customer> {
  const { data } = await api.patch<ApiSuccess<{ customer: Customer }>>(`/customers/${id}`, payload);
  return data.data.customer;
}
export async function getCustomerLedger(id: string, range: { from?: string; to?: string } = {}): Promise<{ customer: Customer; entries: LedgerEntry[]; summary: LedgerSummary; period: LedgerPeriod }> {
  const { data } = await api.get<ApiSuccess<{ customer: Customer; entries: LedgerEntry[]; summary: LedgerSummary; period: LedgerPeriod }>>(`/customers/${id}/ledger`, { params: { limit: 100, ...range } });
  return data.data;
}

// ---- Sales ----
// Either quantity or amount (rupees) per line; amount lets the backend derive qty.
export interface SaleItemInput { productId: string; quantity?: number; amount?: number; unitPrice?: number }
export interface CreateSalePayload { type: 'CASH' | 'CREDIT'; customerId?: string; customerPhone?: string; items: SaleItemInput[]; paymentMethod?: string; note?: string }
export interface SaleFilters { type?: string; status?: string; customerId?: string; from?: string; to?: string; page?: number }

export async function listSales(filters: SaleFilters = {}): Promise<{ sales: Sale[]; meta: PageMeta }> {
  const { data } = await api.get<ApiSuccess<Sale[]>>('/sales', { params: { limit: 20, ...filters } });
  return { sales: data.data, meta: data.meta! };
}
export async function getSale(id: string): Promise<{ sale: Sale; items: SaleItem[] }> {
  const { data } = await api.get<ApiSuccess<{ sale: Sale; items: SaleItem[] }>>(`/sales/${id}`);
  return data.data;
}
export async function createSale(payload: CreateSalePayload): Promise<Sale> {
  const { data } = await api.post<ApiSuccess<{ sale: Sale }>>('/sales', payload);
  return data.data.sale;
}
export async function reverseSale(id: string): Promise<Sale> {
  const { data } = await api.post<ApiSuccess<{ sale: Sale }>>(`/sales/${id}/reverse`);
  return data.data.sale;
}

// ---- Payments ----
export interface PaymentFilters { customerId?: string; from?: string; to?: string; page?: number }
export async function listPayments(filters: PaymentFilters = {}): Promise<{ payments: Payment[]; meta: PageMeta }> {
  const { data } = await api.get<ApiSuccess<Payment[]>>('/payments', { params: { limit: 20, ...filters } });
  return { payments: data.data, meta: data.meta! };
}
export async function recordPayment(payload: { customerId: string; amount: number; method?: string; reference?: string; note?: string }): Promise<{ balanceAfterMinor: number }> {
  const { data } = await api.post<ApiSuccess<{ balanceAfterMinor: number }>>('/payments', payload);
  return data.data;
}
