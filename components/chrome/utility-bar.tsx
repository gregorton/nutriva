import { FlaskIcon, TruckIcon } from "@/components/ui/icons";
import { FREE_DELIVERY_THRESHOLD } from "@/lib/format";

/**
 * Thin utility strip: the three facts a shopper checks before browsing —
 * what delivery costs, whether the goods are tested, and which market they're in.
 */
export function UtilityBar() {
  return (
    <div className="bg-plum-900 text-plum-200">
      <div className="shell flex h-9 items-center justify-between gap-6">
        <p className="facts flex items-center gap-2 text-plum-200">
          <TruckIcon className="h-3.5 w-3.5 text-turmeric-500" />
          <span>
            Free delivery over ฿{FREE_DELIVERY_THRESHOLD.toLocaleString("en-US")}
          </span>
        </p>

        <p className="facts hidden items-center gap-2 text-plum-200 md:flex">
          <FlaskIcon className="h-3.5 w-3.5 text-turmeric-500" />
          <span>Third-party tested — every lot, every batch</span>
        </p>

        <p className="facts flex items-center gap-3 text-plum-200">
          <span className="hidden sm:inline">Ships from Bangkok</span>
          <span className="hidden h-3 w-px bg-plum-700 sm:inline-block" aria-hidden />
          <span>TH · EN · ฿ THB</span>
        </p>
      </div>
    </div>
  );
}
