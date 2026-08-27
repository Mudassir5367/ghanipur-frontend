/**
 * The Ghanipur brand lockup: the logo mark next to the wordmark. Used in every
 * app header so the logo is applied consistently. The logo file lives in
 * /public/logo.jpeg. Callers supply their own link/wrapper if the mark is clickable.
 */
export function BrandMark({
  suffix,
  textClassName = 'text-xl font-bold tracking-tight text-brand-700',
  imgClassName = 'h-12 w-12',
}: {
  suffix?: string;
  textClassName?: string;
  imgClassName?: string;
}) {
  return (
    <span className="flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.jpeg" alt="Ghanipur" className={`${imgClassName} rounded-md object-cover`} />
      <span className={textClassName}>
        Ghanipur{suffix && <span className="font-semibold text-slate-400"> {suffix}</span>}
      </span>
    </span>
  );
}
