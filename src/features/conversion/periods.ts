export type Period = 'DAILY' | 'WEEKLY' | 'MONTHLY';

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

/**
 * Local calendar range for a period containing `anchor`: the day, the week
 * (Monday–Sunday) or the month. Returned as ISO strings for the API.
 */
export function periodRange(period: Period, anchor: Date): { from: string; to: string; start: Date; end: Date } {
  let start: Date;
  let end: Date;
  if (period === 'DAILY') {
    start = startOfDay(anchor);
    end = endOfDay(anchor);
  } else if (period === 'WEEKLY') {
    start = startOfDay(anchor);
    const mondayOffset = (start.getDay() + 6) % 7; // Sun=0 → 6 days back to Monday
    start.setDate(start.getDate() - mondayOffset);
    end = endOfDay(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6));
  } else {
    start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    end = endOfDay(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0));
  }
  return { from: start.toISOString(), to: end.toISOString(), start, end };
}

/** Move the anchor one period back (-1) or forward (+1). */
export function shiftPeriod(period: Period, anchor: Date, step: number): Date {
  const d = new Date(anchor);
  if (period === 'DAILY') d.setDate(d.getDate() + step);
  else if (period === 'WEEKLY') d.setDate(d.getDate() + 7 * step);
  else d.setMonth(d.getMonth() + step, 1);
  return d;
}

export function periodLabel(period: Period, anchor: Date): string {
  const { start, end } = periodRange(period, anchor);
  if (period === 'DAILY') return start.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  if (period === 'MONTHLY') return start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`;
}
