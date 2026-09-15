'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as sales from './api';
import { apiErrorMessage } from '@/lib/api';
import { toast } from '@/components/ui/toast';

const onError = (err: unknown) => toast.error(apiErrorMessage(err));
const invalidateMoney = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['customers'] });
  qc.invalidateQueries({ queryKey: ['customer'] });
  qc.invalidateQueries({ queryKey: ['ledger'] });
  qc.invalidateQueries({ queryKey: ['sales'] });
  qc.invalidateQueries({ queryKey: ['payments'] });
  qc.invalidateQueries({ queryKey: ['products'] });
};

// ---- Customers ----
export function useCustomers(filters: sales.CustomerFilters) {
  return useQuery({ queryKey: ['customers', filters], queryFn: () => sales.listCustomers(filters) });
}
/** All customers for pickers. Keyed under 'customers' so customer mutations refresh it. */
export function useAllCustomers() {
  return useQuery({ queryKey: ['customers', 'all'], queryFn: sales.listAllCustomers });
}
export function useCustomer(id: string | null) {
  return useQuery({ queryKey: ['customer', id], queryFn: () => sales.getCustomer(id!), enabled: !!id });
}
export function useCustomerLedger(id: string | null, range: { from?: string; to?: string } = {}) {
  return useQuery({ queryKey: ['ledger', id, range], queryFn: () => sales.getCustomerLedger(id!, range), enabled: !!id });
}
export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sales.createCustomer,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); toast.success('Customer added'); },
    onError,
  });
}

// ---- Sales ----
export function useSales(filters: sales.SaleFilters) {
  return useQuery({ queryKey: ['sales', filters], queryFn: () => sales.listSales(filters) });
}
export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sales.createSale,
    onSuccess: (sale) => { invalidateMoney(qc); toast.success(`Sale ${sale.code} recorded`); },
    onError,
  });
}
export function useUpdateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: sales.CreateSalePayload }) => sales.updateSale(id, payload),
    onSuccess: (sale) => {
      invalidateMoney(qc);
      // An edit can change cash/credit split, outstanding, quantities and profit —
      // refresh every dashboard/report figure, not just the money lists.
      for (const key of ['report-dashboard', 'report-daily', 'report-monthly', 'report-daily-milk', 'profit-loss']) {
        qc.invalidateQueries({ queryKey: [key] });
      }
      toast.success(`Sale ${sale.code} updated`);
    },
    onError,
  });
}
export function useReverseSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sales.reverseSale,
    onSuccess: () => { invalidateMoney(qc); toast.success('Sale reversed'); },
    onError,
  });
}

// ---- Payments ----
export function usePayments(filters: sales.PaymentFilters) {
  return useQuery({ queryKey: ['payments', filters], queryFn: () => sales.listPayments(filters) });
}
export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sales.recordPayment,
    onSuccess: () => { invalidateMoney(qc); toast.success('Payment recorded'); },
    onError,
  });
}
