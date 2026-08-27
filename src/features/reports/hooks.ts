'use client';

import { useQuery } from '@tanstack/react-query';
import * as reports from './api';

export function useDashboard(range: string) {
  return useQuery({ queryKey: ['report-dashboard', range], queryFn: () => reports.getDashboard(range) });
}
export function useDaily(date?: string) {
  return useQuery({ queryKey: ['report-daily', date], queryFn: () => reports.getDaily(date) });
}
export function useMonthly(month?: string) {
  return useQuery({ queryKey: ['report-monthly', month], queryFn: () => reports.getMonthly(month) });
}
export function useDailyMilk(date?: string) {
  return useQuery({ queryKey: ['report-daily-milk', date], queryFn: () => reports.getDailyMilk(date) });
}
export function usePlatformOverview() {
  return useQuery({ queryKey: ['platform-overview'], queryFn: reports.getPlatformOverview });
}
export function useProfitLoss() {
  return useQuery({ queryKey: ['profit-loss'], queryFn: reports.getProfitLoss });
}
