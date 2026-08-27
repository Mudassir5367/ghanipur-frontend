import { cn } from '@/lib/utils';

/** Deterministic gradient from a name so each user gets a stable, distinct avatar. */
const GRADIENTS = [
  'from-brand-500 to-brand-700',
  'from-amber-500 to-orange-600',
  'from-sky-500 to-blue-600',
  'from-emerald-500 to-green-600',
  'from-rose-500 to-pink-600',
  'from-violet-500 to-purple-600',
];
const initialsOf = (name: string) =>
  name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || '?';
const gradientFor = (seed: string) => GRADIENTS[[...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length];

/**
 * User profile picture. Uses the uploaded image when present, otherwise a colored
 * initials avatar derived from the name (stable per user).
 */
export function Avatar({ name, src, className }: { name?: string | null; src?: string | null; className?: string }) {
  const label = name || 'User';
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={label} className={cn('rounded-full object-cover', className)} />;
  }
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white',
        gradientFor(label),
        className,
      )}
      aria-hidden="true"
    >
      {initialsOf(label)}
    </span>
  );
}
