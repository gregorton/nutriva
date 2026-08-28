import { InfoIcon } from "@/components/ui/icons";

/**
 * The reference site hangs a popover off an info mark next to anything a shopper might
 * query — shipping thresholds, quantity limits, how a figure was derived. This is the same
 * affordance in CSS only: no client component, revealed on hover and on keyboard focus.
 *
 * The button carries the label so screen readers announce what the mark belongs to; the
 * panel itself is inert, so a pointer moving over it never traps the cursor.
 *
 * The closed panel is `hidden` rather than merely transparent. At `opacity-0` it was still in
 * layout, and a 230px panel hanging off a mark near the right-hand gutter pushed the document's
 * scrollable width past the viewport — an invisible tooltip was giving narrow phones a sideways
 * scroll on the product page. `transition-discrete` plus `starting:opacity-0` keeps the fade in
 * browsers that support discrete transitions, and drops to an instant reveal in ones that do not.
 */
export function Hint({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <span className={`group relative inline-flex align-middle ${className}`}>
      <button
        type="button"
        aria-label={label}
        className="inline-flex items-center text-faint transition-colors hover:text-plum-700"
      >
        <InfoIcon className="h-3.5 w-3.5" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-[230px] max-w-[calc(100vw-1.5rem)] -translate-x-1/2 rounded-card border border-line bg-white p-3 text-left text-[12px] leading-snug text-muted opacity-0 shadow-[0_14px_34px_-18px_rgba(43,15,32,0.55)] transition-discrete transition-[opacity,display] duration-150 starting:opacity-0 group-hover:block group-hover:opacity-100 group-focus-within:block group-focus-within:opacity-100"
      >
        {children}
      </span>
    </span>
  );
}
