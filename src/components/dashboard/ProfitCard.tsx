'use client';

import { StatCard } from '@/components/ui/StatCard';
import { useProfitLoss } from '@/features/reports/hooks';
import { formatPKR } from '@/lib/utils';

/**
 * Dashboard Profit & Loss card. Shows overall profit across all products and links
 * to the full breakdown page (daily / weekly / monthly). Profit = sales revenue −
 * cost of goods sold (quantity × product purchase cost).
 */
export function ProfitCard() {
  const { data, isLoading } = useProfitLoss();
  // Card shows TODAY's profit; the details page breaks down daily/weekly/monthly.
  const today = data?.daily.profitMinor ?? 0;
  const loss = today < 0;
  const value = isLoading ? '…' : loss ? `– ${formatPKR(Math.abs(today))}` : formatPKR(today);

  return (
    <StatCard
      label={loss ? "Today's Loss" : "Today's Profit"}
      value={value}
      tone={loss ? 'red' : 'green'}
      sublabel="Tap for weekly · monthly"
      href="/dashboard/profit"
    />
  );
}
