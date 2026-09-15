import { api } from '@/lib/api';
import type { ApiSuccess, PageMeta } from '@/types/api';

export interface Expense {
  _id: string;
  category: string;
  amountMinor: number;
  method: string;
  description?: string;
  incurredAt: string;
}

export interface ExpensePayload {
  category: string;
  amount: number; // rupees
  description?: string;
  incurredAt?: string; // ISO
}

/** Suggested categories; any other name can be typed as a custom expense. */
export const EXPENSE_CATEGORIES = ['Rent', 'Electricity Bill', 'Employee Pay', 'Transport', 'Packaging', 'Maintenance', 'Raw Material', 'Other'];

/** Every expense in a range (walks the API's 100-row pages), newest first. */
export async function listExpenses(range: { from: string; to: string }): Promise<Expense[]> {
  const all: Expense[] = [];
  for (let page = 1; ; page += 1) {
    const { data } = await api.get<ApiSuccess<Expense[]>>('/expenses', { params: { ...range, limit: 100, page } });
    all.push(...data.data);
    const meta: PageMeta | undefined = data.meta;
    if (!meta || page >= meta.totalPages) break;
  }
  return all;
}

export async function createExpense(payload: ExpensePayload): Promise<Expense> {
  const { data } = await api.post<ApiSuccess<{ expense: Expense }>>('/expenses', payload);
  return data.data.expense;
}

export async function updateExpense(id: string, payload: Partial<ExpensePayload>): Promise<Expense> {
  const { data } = await api.patch<ApiSuccess<{ expense: Expense }>>(`/expenses/${id}`, payload);
  return data.data.expense;
}

export async function deleteExpense(id: string): Promise<void> {
  await api.delete(`/expenses/${id}`);
}
