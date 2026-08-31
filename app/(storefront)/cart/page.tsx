import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CartPage } from "@/components/cart/cart-page";

export const metadata: Metadata = {
  title: "Cart",
  description: "What you have chosen so far.",
  robots: { index: false },
};

export default function Cart() {
  return (
    <div className="shell py-6">
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Cart" }]} />
      <h1 className="mt-3 mb-6 text-[28px] sm:text-[34px]">Cart</h1>
      <CartPage />
    </div>
  );
}
