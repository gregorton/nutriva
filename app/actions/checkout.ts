"use server";

import { redirect } from "next/navigation";
import { getProduct } from "@/lib/catalog";
import { getUser } from "@/lib/dal";
import { parsePostedLines } from "@/lib/cart";
import { METHODS, deliveryFee } from "@/lib/delivery";
import { placeOrder, type NewOrderItem } from "@/lib/orders";
import { paymentMethod } from "@/lib/payment";
import { PROVINCES } from "@/lib/thailand";
import { checkCheckout, type CheckoutDetails } from "@/lib/validate";

/*
  Placing an order.

  A Server Action is a POST endpoint anything can call, so nothing in the body is taken on trust.
  What the form sends is slugs, quantities, a delivery method, a payment method and an address. The
  cart lines are posted as `item` fields, not `line` — `line` is the street address, and one field
  name doing both jobs is how a cart line ends up in an address.
  Everything with money in it is recomputed here: each slug is resolved through `getProduct()`,
  out-of-stock lines are refused, quantities are clamped, and the subtotal, delivery fee and total
  are worked out from the catalogue's own prices. A posted price is never read — the form does not
  even send one.

  On success this redirects rather than returning, so the no-JavaScript path lands on the
  confirmation too. The cart is cleared by an island on that page, keyed on the order number, which
  is the one thing an action cannot do from the server.
*/

export type CheckoutState = {
  errors?: Partial<Record<keyof CheckoutDetails | "cart" | "payment" | "delivery", string>>;
  /** Held so a rejected form comes back filled in. */
  values?: Partial<CheckoutDetails>;
};

export async function submitOrder(_prev: CheckoutState, form: FormData): Promise<CheckoutState> {
  const posted = parsePostedLines(form.getAll("item").map(String));

  const items: NewOrderItem[] = [];
  for (const line of posted) {
    const product = getProduct(line.slug);
    // A line that went out of stock, or whose slug no longer exists, cannot be ordered. The cart
    // shows both cases and excludes them from its own total, so reaching here means a stale tab.
    if (!product?.inStock) continue;
    items.push({
      slug: product.slug,
      title: product.title,
      brand: product.brand,
      unitPrice: product.price,
      qty: line.qty,
    });
  }

  if (items.length === 0) {
    return { errors: { cart: "There is nothing in your cart that we can still ship." } };
  }

  const checked = checkCheckout(form, PROVINCES);
  const raw: Partial<CheckoutDetails> = {
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? ""),
    phone: String(form.get("phone") ?? ""),
    line: String(form.get("line") ?? ""),
    subdistrict: String(form.get("subdistrict") ?? ""),
    district: String(form.get("district") ?? ""),
    province: String(form.get("province") ?? ""),
    postcode: String(form.get("postcode") ?? ""),
  };

  const deliveryId = String(form.get("delivery") ?? "");
  const delivery = METHODS.find((method) => method.id === deliveryId);
  const payment = paymentMethod(String(form.get("payment") ?? ""));

  if (!checked.ok || !delivery || !payment) {
    return {
      values: raw,
      errors: {
        ...(checked.ok ? {} : checked.errors),
        ...(delivery ? {} : { delivery: "Choose a delivery method." }),
        ...(payment ? {} : { payment: "Choose how you would like to pay." }),
      },
    };
  }

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const fee = deliveryFee(delivery.id, subtotal);

  // getUser() re-verifies the session against the database; the cookie alone proves nothing.
  const user = await getUser();

  const orderNo = await placeOrder({
    userId: user?.id ?? null,
    email: checked.value.email,
    name: checked.value.name,
    phone: checked.value.phone,
    address: {
      line: checked.value.line,
      subdistrict: checked.value.subdistrict,
      district: checked.value.district,
      province: checked.value.province,
      postcode: checked.value.postcode,
    },
    deliveryMethod: delivery.id,
    paymentMethod: payment.id,
    subtotal,
    deliveryFee: fee,
    total: subtotal + fee,
    items,
  });

  redirect(`/checkout/confirmation/${orderNo}`);
}
