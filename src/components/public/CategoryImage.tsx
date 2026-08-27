import { cn } from '@/lib/utils';

/**
 * Original, hand-drawn SVG illustrations used when a product has no uploaded photo.
 * Keyword-matched on the category/product name so each product gets a fitting,
 * polished picture (milk → glass of milk, ghee → jar, etc.) on a soft themed
 * gradient. These are original vector art — no external or copyrighted images.
 */
type Kind = 'milk' | 'yogurt' | 'ghee' | 'butter' | 'cheese' | 'cream' | 'lassi';

const RULES: { match: RegExp; kind: Kind }[] = [
  { match: /ghee|desi|butter oil/i, kind: 'ghee' },
  { match: /butter/i, kind: 'butter' },
  { match: /cheese|paneer/i, kind: 'cheese' },
  { match: /yogurt|dahi|curd/i, kind: 'yogurt' },
  { match: /lassi|shake|drink|juice/i, kind: 'lassi' },
  { match: /cream|ice/i, kind: 'cream' },
  { match: /milk/i, kind: 'milk' },
];

const GRADIENT: Record<Kind, string> = {
  milk: 'from-sky-100 via-blue-50 to-white',
  yogurt: 'from-slate-100 via-sky-50 to-white',
  ghee: 'from-amber-200 via-amber-100 to-yellow-50',
  butter: 'from-yellow-200 via-amber-100 to-yellow-50',
  cheese: 'from-amber-200 via-orange-100 to-yellow-50',
  cream: 'from-rose-100 via-amber-50 to-white',
  lassi: 'from-rose-100 via-pink-50 to-white',
};

function kindOf(name?: string | null): Kind {
  if (name) for (const r of RULES) if (r.match.test(name)) return r.kind;
  return 'milk';
}

/** The illustration for a kind, drawn in a 96×96 viewBox and scaled by the parent. */
function Art({ kind }: { kind: Kind }) {
  switch (kind) {
    case 'ghee':
      return (
        <svg viewBox="0 0 96 96" className="h-3/5 w-3/5 drop-shadow-sm" aria-hidden="true">
          <defs>
            <linearGradient id="ci-ghee" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffe9a8" /><stop offset="1" stopColor="#f2b937" />
            </linearGradient>
          </defs>
          <rect x="28" y="34" width="40" height="42" rx="8" fill="url(#ci-ghee)" stroke="#d99e28" strokeWidth="2.5" />
          <rect x="24" y="22" width="48" height="14" rx="5" fill="#c8922f" />
          <rect x="30" y="26" width="36" height="5" rx="2.5" fill="#e6b653" />
          <rect x="34" y="42" width="5" height="26" rx="2.5" fill="#fff" opacity="0.55" />
        </svg>
      );
    case 'butter':
      return (
        <svg viewBox="0 0 96 96" className="h-3/5 w-3/5 drop-shadow-sm" aria-hidden="true">
          <defs>
            <linearGradient id="ci-butter" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff0ac" /><stop offset="1" stopColor="#ffd94a" />
            </linearGradient>
          </defs>
          <path d="M22 46 L58 34 L74 40 L38 52 Z" fill="#ffe680" />
          <path d="M22 46 L38 52 V70 L22 64 Z" fill="#f5c93b" />
          <path d="M38 52 L74 40 V58 L38 70 Z" fill="url(#ci-butter)" stroke="#e6bd3a" strokeWidth="2" strokeLinejoin="round" />
          <path d="M16 72 H80 L72 78 H24 Z" fill="#dbe3ee" />
        </svg>
      );
    case 'cheese':
      return (
        <svg viewBox="0 0 96 96" className="h-3/5 w-3/5 drop-shadow-sm" aria-hidden="true">
          <defs>
            <linearGradient id="ci-cheese" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffe08a" /><stop offset="1" stopColor="#ffbf3a" />
            </linearGradient>
          </defs>
          <path d="M20 60 L64 38 L78 46 V58 L20 72 Z" fill="url(#ci-cheese)" stroke="#e6a52e" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M20 60 L64 38 L78 46 L34 62 Z" fill="#ffe9a6" />
          <circle cx="44" cy="56" r="3.5" fill="#f6c34a" />
          <circle cx="58" cy="54" r="2.6" fill="#f6c34a" />
          <circle cx="30" cy="62" r="2.2" fill="#f6c34a" />
        </svg>
      );
    case 'yogurt':
      return (
        <svg viewBox="0 0 96 96" className="h-3/5 w-3/5 drop-shadow-sm" aria-hidden="true">
          <defs>
            <linearGradient id="ci-yog" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#eef4ff" />
            </linearGradient>
          </defs>
          <path d="M20 50 A28 14 0 0 0 76 50 Z" fill="url(#ci-yog)" stroke="#c9d7ec" strokeWidth="2.5" />
          <ellipse cx="48" cy="50" rx="28" ry="12" fill="#fbfdff" stroke="#d7e3f4" strokeWidth="2" />
          <ellipse cx="48" cy="49" rx="20" ry="7.5" fill="#eef5ff" />
          <path d="M60 26 L74 18" stroke="#b7c4d8" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="58" cy="29" rx="6" ry="9" transform="rotate(28 58 29)" fill="#cdd9ec" />
        </svg>
      );
    case 'lassi':
      return (
        <svg viewBox="0 0 96 96" className="h-3/5 w-3/5 drop-shadow-sm" aria-hidden="true">
          <defs>
            <linearGradient id="ci-lassi" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#ffe3ec" />
            </linearGradient>
          </defs>
          <path d="M32 26 H64 L59 74 A6 6 0 0 1 53 80 H43 A6 6 0 0 1 37 74 Z" fill="url(#ci-lassi)" stroke="#efc2d0" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M33 34 H63 L62 42 H34 Z" fill="#ffd7e3" />
          <path d="M58 16 L48 60" stroke="#ef9bb4" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'cream':
      return (
        <svg viewBox="0 0 96 96" className="h-3/5 w-3/5 drop-shadow-sm" aria-hidden="true">
          <defs>
            <linearGradient id="ci-cream" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#ffe9d6" />
            </linearGradient>
          </defs>
          <path d="M34 44 L48 82 L62 44 Z" fill="#f7d7ad" stroke="#e6b98a" strokeWidth="2" strokeLinejoin="round" />
          <path d="M30 44 A18 12 0 0 1 66 44 Z" fill="url(#ci-cream)" stroke="#f0cba6" strokeWidth="2" />
          <path d="M36 34 a8 8 0 0 1 16 0 a7 7 0 0 1 12 4 H30 a7 7 0 0 1 6 -4 Z" fill="#fff" stroke="#f0cba6" strokeWidth="2" />
        </svg>
      );
    default: // milk
      return (
        <svg viewBox="0 0 96 96" className="h-3/5 w-3/5 drop-shadow-sm" aria-hidden="true">
          <defs>
            <linearGradient id="ci-milk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#dbe8ff" />
            </linearGradient>
          </defs>
          <path d="M32 20 H64 L59 74 A6 6 0 0 1 53 80 H43 A6 6 0 0 1 37 74 Z" fill="url(#ci-milk)" stroke="#b9cdf0" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M33 30 H63 L62 40 H34 Z" fill="#eef4ff" />
          <rect x="41" y="44" width="5" height="28" rx="2.5" fill="#ffffff" opacity="0.85" />
        </svg>
      );
  }
}

export function CategoryImage({ name, className }: { name?: string | null; className?: string }) {
  const kind = kindOf(name);
  return (
    <div className={cn('flex items-center justify-center overflow-hidden bg-gradient-to-br', GRADIENT[kind], className)}>
      <Art kind={kind} />
    </div>
  );
}
