import { paymentMethods } from "@/lib/payment";
import { BankIcon, CashIcon, QrIcon } from "@/components/ui/icons";

const GLYPH = { transfer: BankIcon, promptpay: QrIcon, cod: CashIcon } as const;

/**
 * What this shop can actually take, drawn from lib/payment.ts rather than typed as copy, so the
 * marks in the footer and the cart cannot claim a method the checkout does not offer. A server
 * component: lib/payment.ts reads the environment and is `server-only`.
 */
export function PaymentMarks({ className = "" }: { className?: string }) {
  const methods = paymentMethods();
  if (methods.length === 0) return null;

  return (
    <ul className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 ${className}`}>
      {methods.map((method) => {
        const Glyph = GLYPH[method.id];
        return (
          <li key={method.id} className="facts flex items-center gap-1.5">
            <Glyph className="h-4 w-4 shrink-0" />
            {method.label}
          </li>
        );
      })}
    </ul>
  );
}
