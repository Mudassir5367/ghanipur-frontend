import Link from 'next/link';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  tone?: 'default' | 'green' | 'amber' | 'red' | 'blue';
  icon?: React.ReactNode;
  /** When set, the whole card becomes a link to this route. */
  href?: string;
}

const tones: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'text-slate-900',
  green: 'text-brand-700',
  amber: 'text-amber-600',
  red: 'text-red-600',
  blue: 'text-blue-600',
};

/** KPI tile for dashboards (§28, §57). Optionally links to a detail view. */
export function StatCard({ label, value, sublabel, tone = 'default', icon, href }: StatCardProps) {
  const inner = (
    <>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {href ? <span className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500">→</span> : icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <p className={cn('mt-2 text-2xl font-bold tracking-tight', tones[tone])}>{value}</p>
      {sublabel && <p className="mt-1 text-xs text-slate-400">{sublabel}</p>}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
      >
        {inner}
      </Link>
    );
  }

  return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">{inner}</div>;
}
