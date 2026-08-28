import { api } from '@/lib/api';
import type { ApiSuccess } from '@/types/api';

export interface SalesSplit { cashMinor: number; creditMinor: number; totalMinor: number; count: number }
export interface ProductStat { _id: string; name: string; qty: number; revenueMinor: number; unit?: string }
export interface UnitQty { unit: string; qty: number }

export interface DashboardReport {
  range: string;
  sales: SalesSplit;
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
