import { api } from '@/lib/api';
import type { ApiSuccess } from '@/types/api';

export interface SalesSplit { cashMinor: number; creditMinor: number; totalMinor: number; count: number }
export interface ProductStat { _id: string; name: string; qty: number; revenueMinor: number; unit?: string }
export interface UnitQty { unit: string; qty: number }

/** Everything sold in the range (sales + deliveries), independent of payment. */
export interface SalesValue { totalMinor: number; salesMinor: number; deliveriesMinor: number; saleCount: number; deliveryCount: number }

export interface DashboardReport {
  range: string;
  sales: SalesSplit;
  salesValue?: SalesValue;
  /** Gross profit for the range (same as the Profit card). */
  profitMinor?: number;
  /** Expenditure in the range. */
  expenses?: { totalMinor: number; count: number };
  /** Net Profit = profit − expenditure. */
  netProfitMinor?: number;
  paymentsReceivedMinor: number;
  outstandingMinor: number;
  todayOutstandingMinor: number;
  qtySold: number;
  qtyByUnit: UnitQty[];
  topProducts: ProductStat[];
  stockValueMinor: number;
  stockSellValueMinor: number;
  stockByUnit: { unit: string; qty: number; products: number }[];
  trackedProducts: number;
  lowStockCount: number;
  deliveries: number;
}

export interface DailyReport {
  date: string;
  sales: SalesSplit;
  paymentsReceivedMinor: number;
  outstandingMinor: number;
  qtySold: number;
  qtyByUnit: UnitQty[];
  products: ProductStat[];
  wastageQty: number;
  deliveries: number;
}

export interface MonthlyReport {
  month: string;
  sales: SalesSplit;
  paymentsReceivedMinor: number;
  outstandingMinor: number;
  revenueMinor: number;
  products: ProductStat[];
}

export interface MilkRow {
  productId: string;
  name: string;
  unit: string;
  opening: number;
  stockIn: number;
  sold: number;
  wastage: number;
  adjustment: number;
  closing: number;
}
export interface DailyMilkReport { date: string; rows: MilkRow[] }

export interface PlatformOverview {
  totalShops: number;
  activeShops: number;
  pendingShops: number;
  suspendedShops: number;
  totalSales: number;
  totalRevenueMinor: number;
}

export interface NetProfitDay {
  date: string; // YYYY-MM-DD (shop timezone)
  revenueMinor: number;
  costMinor: number;
  profitMinor: number;
  expensesMinor: number;
  expenseCount: number;
  netProfitMinor: number;
}
export interface NetProfitReport {
  from: string;
  to: string;
  days: NetProfitDay[]; // newest first
  totals: { profitMinor: number; expensesMinor: number; netProfitMinor: number };
}
/** Daily-wise Net Profit (profit − expenditure) between two YYYY-MM-DD dates. */
export async function getNetProfit(from?: string, to?: string): Promise<NetProfitReport> {
  const { data } = await api.get<ApiSuccess<NetProfitReport>>('/reports/net-profit', { params: { from, to } });
  return data.data;
}

export async function getDashboard(range = 'today'): Promise<DashboardReport> {
  const { data } = await api.get<ApiSuccess<DashboardReport>>('/reports/dashboard', { params: { range } });
  return data.data;
}
export async function getDaily(date?: string): Promise<DailyReport> {
  const { data } = await api.get<ApiSuccess<DailyReport>>('/reports/daily', { params: { date } });
  return data.data;
}
export async function getMonthly(month?: string): Promise<MonthlyReport> {
  const { data } = await api.get<ApiSuccess<MonthlyReport>>('/reports/monthly', { params: { month } });
  return data.data;
}
export async function getDailyMilk(date?: string): Promise<DailyMilkReport> {
  const { data } = await api.get<ApiSuccess<DailyMilkReport>>('/reports/daily-milk', { params: { date } });
  return data.data;
}
export async function getPlatformOverview(): Promise<PlatformOverview> {
  const { data } = await api.get<ApiSuccess<PlatformOverview>>('/reports/platform/overview');
  return data.data;
}

export interface ProfitEntry { revenueMinor: number; costMinor: number; profitMinor: number }
export interface ProfitLoss { overall: ProfitEntry; daily: ProfitEntry; weekly: ProfitEntry; monthly: ProfitEntry }

export async function getProfitLoss(): Promise<ProfitLoss> {
  const { data } = await api.get<ApiSuccess<ProfitLoss>>('/reports/profit-loss');
  return data.data;
}
