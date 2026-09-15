'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as expenses from './api';
import { apiErrorMessage } from '@/lib/api';
import { toast } from '@/components/ui/toast';

const onError = (err: unknown) => toast.error(apiErrorMessage(err));

/** Expenditure feeds Net Profit, so every change refreshes the dashboard and breakdowns. */
const refresh = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['expenses'] });
  qc.invalidateQueries({ queryKey: ['report-dashboard'] });
  qc.invalidateQueries({ queryKey: ['net-profit'] });
};

export function useExpenses(range: { from: string; to: string }) {
  return useQuery({ queryKey: ['expenses', range], queryFn: () => expenses.listExpenses(range) });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: expenses.createExpense, onSuccess: () => { refresh(qc); toast.success('Expense recorded'); }, onError });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<expenses.ExpensePayload> }) => expenses.updateExpense(id, payload),
    onSuccess: () => { refresh(qc); toast.success('Expense updated'); },
    onError,
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: expenses.deleteExpense, onSuccess: () => { refresh(qc); toast.success('Expense deleted'); }, onError });
}
