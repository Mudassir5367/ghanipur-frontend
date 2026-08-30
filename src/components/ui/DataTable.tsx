import { cn } from '@/lib/utils';
import type { PageMeta } from '@/types/api';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[] | undefined;
  isLoading?: boolean;
  rowKey: (row: T) => string;
  empty?: React.ReactNode;
  onRowClick?: (row: T) => void;
  /** Optional pager. Shows Prev/Next + page info when there is more than one page. */
  pagination?: { meta?: PageMeta; onPageChange: (page: number) => void };
}

/** Reusable table with loading/empty states (§57) and optional pagination. */
export function DataTable<T>({ columns, data, isLoading, rowKey, empty, onRowClick, pagination }: DataTableProps<T>) {
  const alignCls = { left: 'text-left', right: 'text-right', center: 'text-center' };
  const meta = pagination?.meta;

  const footer = pagination && meta && meta.totalPages > 1 ? (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
      <span>Page {meta.page} of {meta.totalPages} · {meta.total} total</span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={meta.page <= 1}
          onClick={() => pagination.onPageChange(meta.page - 1)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Prev
        </button>
        <button
          type="button"
          disabled={meta.page >= meta.totalPages}
          onClick={() => pagination.onPageChange(meta.page + 1)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  ) : null;

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div>
        <div className="p-10 text-center text-sm text-slate-400">{empty ?? 'No records found.'}</div>
        {footer}
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
              {columns.map((c) => (
                <th key={c.key} className={cn('px-5 py-3 font-medium', alignCls[c.align ?? 'left'])}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(onRowClick && 'cursor-pointer hover:bg-slate-50')}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn('px-5 py-3 text-slate-700', alignCls[c.align ?? 'left'], c.className)}>
                    {c.render ? c.render(row) : (row as Record<string, unknown>)[c.key] as React.ReactNode}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}
