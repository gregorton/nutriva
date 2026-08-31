import { FREE_DELIVERY_THRESHOLD } from "@/lib/delivery";
import { price } from "@/lib/format";
import { TruckIcon } from "@/components/ui/icons";

/*
  How far a subtotal is from free delivery, as a bar rather than a sentence.

  The drawer said this in words; a shopper deciding whether to add one more thing wants to see the
  gap. Two states only, and they are the two the site already words: short of the threshold, and
  met. The fill is turmeric on the warm paper band and turns pandan once it is met, which is the
  same trust-green the rest of the site reserves for a fact about an order.
*/
export function FreeDeliveryMeter({ subtotal, className = "" }: { subtotal: number; className?: string }) {
  const met = subtotal >= FREE_DELIVERY_THRESHOLD;
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const percent = Math.min(100, Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100));

  return (
    <div className={className}>
      <p
        className={`facts flex items-center gap-2 font-medium ${met ? "text-pandan-700" : "text-plum-800"}`}
      >
        <TruckIcon className={`h-4 w-4 shrink-0 ${met ? "" : "text-turmeric-600"}`} />
        {met ? (
          <span>Free delivery applied</span>
        ) : (
          <span data-num>{price(remaining)} more for free delivery</span>
        )}
      </p>

      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-warm"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={FREE_DELIVERY_THRESHOLD}
        aria-valuenow={Math.min(subtotal, FREE_DELIVERY_THRESHOLD)}
        aria-label="Progress towards free delivery"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${
            met ? "bg-pandan-600" : "bg-turmeric-500"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
