'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as delivery from './api';
import { apiErrorMessage } from '@/lib/api';
import { toast } from '@/components/ui/toast';

const onError = (err: unknown) => toast.error(apiErrorMessage(err));

const invalidate = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['deliveries'] });
  qc.invalidateQueries({ queryKey: ['delivery'] });
  qc.invalidateQueries({ queryKey: ['delivery-customer-summary'] }); // customer outstanding
  qc.invalidateQueries({ queryKey: ['customers'] }); // list outstanding column
  qc.invalidateQueries({ queryKey: ['customer'] });
  qc.invalidateQueries({ queryKey: ['products'] }); // stock changed on confirm/cancel
};

export function useDeliveries(filters: delivery.DeliveryFilters) {
  return useQuery({ queryKey: ['deliveries', filters], queryFn: () => delivery.listDeliveries(filters) });
}

export function useDelivery(id: string | null) {
  return useQuery({ queryKey: ['delivery', id], queryFn: () => delivery.getDelivery(id!), enabled: !!id });
}

export function useCustomerDeliverySummary(customerId: string | null) {
  return useQuery({ queryKey: ['delivery-customer-summary', customerId], queryFn: () => delivery.getCustomerDeliverySummary(customerId!), enabled: !!customerId });
}

export function useDeliveryRoster() {
  return useQuery({ queryKey: ['delivery-roster'], queryFn: delivery.getDeliveryRoster });
}

const invalidateRoster = (qc: ReturnType<typeof useQueryClient>) => qc.invalidateQueries({ queryKey: ['delivery-roster'] });

export function useCreateDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: delivery.createDelivery,
    onSuccess: (d) => { invalidate(qc); invalidateRoster(qc); toast.success(`Delivery ${d.code} created`); },
    onError,
  });
}

export function useUpdateDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: delivery.CreateDeliveryPayload }) => delivery.updateDelivery(id, payload),
    onSuccess: (d) => { invalidate(qc); invalidateRoster(qc); toast.success(`Delivery ${d.code} updated`); },
    onError,
  });
}

export function useSetDeliveryStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: delivery.DeliveryStatus }) => delivery.setDeliveryStatus(id, status),
    onSuccess: () => { invalidate(qc); toast.success('Delivery updated'); },
    onError,
  });
}

export function useAddDeliveryPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { amount: number; method?: string; note?: string } }) => delivery.addDeliveryPayment(id, payload),
    onSuccess: () => { invalidate(qc); toast.success('Payment recorded'); },
    onError,
  });
}
