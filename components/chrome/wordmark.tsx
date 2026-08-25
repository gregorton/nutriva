/**
 * Wordmark: a dotless "ı" with a drawn capsule in place of the tittle — the one spot
 * where the brand plays with the product form. Drawn rather than imported so it stays
 * crisp at any size and inherits the display face.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline ${className}`}>
      <span className="sr-only">Nutriva</span>
      <span
        aria-hidden
        className="font-display text-[27px] font-semibold leading-none tracking-[-0.02em] text-plum-800"
      >
        Nutr
        <span className="relative inline-block">
          ı
          <span className="absolute -top-[9px] left-1/2 h-[8px] w-[8px] -translate-x-1/2 overflow-hidden rounded-full bg-turmeric-500">
            <span className="absolute left-0 top-1/2 h-[1px] w-full -translate-y-1/2 bg-plum-800/60" />
          </span>
        </span>
        va
      </span>
    </span>
  );
}
