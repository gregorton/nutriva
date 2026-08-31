import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { awaitingBankDetails, paymentMethods } from "@/lib/payment";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

/*
  Guests check out. `proxy.ts` matches /account and /admin only, so nothing redirects from here, and
  the action reads the session itself when there is one.

  Payment methods are resolved on the server — lib/payment.ts is `server-only`, so the env never
  reaches the client — and handed to the form as data.
*/
export default function CheckoutPage() {
  return (
    <div className="shell py-6">
      <Breadcrumbs
        trail={[{ label: "Home", href: "/" }, { label: "Cart", href: "/cart" }, { label: "Checkout" }]}
      />
      <h1 className="mt-3 mb-7 text-[28px] sm:text-[34px]">Checkout</h1>
      <CheckoutForm methods={paymentMethods()} awaitingBank={awaitingBankDetails()} />
    </div>
  );
}
