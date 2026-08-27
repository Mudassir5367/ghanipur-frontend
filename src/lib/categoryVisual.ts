/**
 * Maps a category (or product) name to a themed placeholder used when a product has
 * no uploaded photo — a representative emoji on a soft, product-appropriate gradient
 * so milk looks like milk, yogurt like yogurt, ghee like ghee, etc. Keyword-matched
 * so custom category names ("Buffalo Milk", "Fresh Dahi") still resolve correctly.
 */
export interface CategoryVisual {
  emoji: string;
  /** Tailwind gradient classes for the card background. */
  gradient: string;
}

const RULES: { match: RegExp; visual: CategoryVisual }[] = [
  { match: /ghee|butter oil|desi/i, visual: { emoji: '🫙', gradient: 'from-amber-100 to-yellow-50' } },
  { match: /butter/i, visual: { emoji: '🧈', gradient: 'from-yellow-100 to-amber-50' } },
  { match: /cheese|paneer/i, visual: { emoji: '🧀', gradient: 'from-yellow-100 to-orange-50' } },
  { match: /yogurt|dahi|curd/i, visual: { emoji: '🥣', gradient: 'from-sky-50 to-slate-50' } },
  { match: /lassi|shake|drink/i, visual: { emoji: '🥤', gradient: 'from-rose-50 to-pink-50' } },
  { match: /cream/i, visual: { emoji: '🍦', gradient: 'from-amber-50 to-white' } },
  { match: /milk/i, visual: { emoji: '🥛', gradient: 'from-sky-50 to-blue-50' } },
];

const DEFAULT: CategoryVisual = { emoji: '🥛', gradient: 'from-slate-100 to-slate-50' };

export function categoryVisual(name?: string | null): CategoryVisual {
  if (!name) return DEFAULT;
  for (const r of RULES) if (r.match.test(name)) return r.visual;
  return DEFAULT;
}
