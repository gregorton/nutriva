"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { submitOrder, type CheckoutState } from "@/app/actions/checkout";
import { useAccount } from "@/components/account/account-store";
import { useCart } from "@/components/cart/cart-context";
import { DeliveryEstimate } from "@/components/pdp/delivery-estimate";
import { CheckIcon } from "@/components/ui/icons";
import { CUTOFF_HOUR, FREE_DELIVERY_THRESHOLD, METHODS, deliveryFee } from "@/lib/delivery";
import { price } from "@/lib/format";
import { BANGKOK_PROVINCE, PROVINCES, isMetro } from "@/lib/thailand";
import type { DeliveryMethod } from "@/lib/delivery";
import type { PaymentMethod } from "@/lib/payment";
import { Field, Step, Tile } from "@/components/checkout/parts";
import { OrderSummaryPanel } from "@/components/checkout/order-summary-panel";

/*
  Checkout: one page, three numbered sections, one submit.

  Deliberately not a wizard with the step in the URL, which is how the rest of this site carries
  state. Carrying a half-finished checkout between steps would mean either putting a name, phone
  number and address in the query string — where it lands in history and in any log — or keeping a
  draft of it in localStorage. Neither is worth it for three short sections that fit on one page.

  What crosses the wire is slugs and quantities, never prices: `item` fields hold "slug:qty" and
  app/actions/checkout.ts recomputes every figure from the catalogue. The totals here are for the
  shopper, and the server does not read them.

  Delivery method and province are React state so the summary can show a live total and the right
  arrival window. Both are real form controls, so the whole thing submits without JavaScript and
  the server reaches the same numbers from the posted values.
*/
export function CheckoutForm({
  methods,
  awaitingBank,
}: {
  methods: PaymentMethod[];
  /** True while no bank account is configured — said plainly rather than shown as an empty panel. */
  awaitingBank: boolean;
}) {
  const { lines, subtotal } = useCart();
  const { user } = useAccount();
  const [state, action, pending] = useActionState<CheckoutState, FormData>(submitOrder, {});

  const [delivery, setDelivery] = useState<DeliveryMethod>(METHODS[0].id);
  const [province, setProvince] = useState<string>(BANGKOK_PROVINCE);
  const [payment, setPayment] = useState<string>(methods[0]?.id ?? "");

  const fee = deliveryFee(delivery, subtotal);
  const zone = isMetro(province) ? "metro" : "upcountry";
  const errors = state.errors ?? {};
  const held = state.values ?? {};
  const chosenPayment = methods.find((method) => method.id === payment);

  if (lines.length === 0) {
    return (
      <div className="rounded-tile border border-line bg-paper px-6 py-20 text-center">
        <p className="font-display text-xl">There is nothing to check out</p>
        <p className="mt-2 text-sm text-muted">Your cart is empty.</p>
        <Link
          href="/c/vitamins"
          className="mt-6 inline-flex h-10 items-center rounded-[7px] bg-plum-800 px-5 text-sm font-semibold text-white transition-colors hover:bg-plum-700"
        >
          Browse the shelves
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      {lines.map((line) => (
        <input
          key={line.product.slug}
          type="hidden"
          name="item"
          value={`${line.product.slug}:${line.qty}`}
        />
      ))}

      <div className="space-y-10">
        <Step n={1} heading="Where it goes">
          {user && (
            <p className="facts mb-4 flex items-center gap-1.5 font-medium text-pandan-700">
              <CheckIcon className="h-3.5 w-3.5" />
              Signed in as {user.displayName}. This order will appear under your account.
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              name="name"
              error={errors.name}
              defaultValue={held.name ?? user?.displayName}
              autoComplete="name"
              className="sm:col-span-2"
            />
            <Field
              label="Email"
              name="email"
              type="email"
              error={errors.email}
              defaultValue={held.email}
              autoComplete="email"
              hint="Where the confirmation goes."
            />
            <Field
              label="Phone"
              name="phone"
              type="tel"
              error={errors.phone}
              defaultValue={held.phone}
              autoComplete="tel"
              hint="The courier calls this on the day."
            />
            <Field
              label="House number and street"
              name="line"
              error={errors.line}
              defaultValue={held.line}
              autoComplete="address-line1"
              className="sm:col-span-2"
            />
            <Field
              label="Sub-district (tambon)"
              name="subdistrict"
              error={errors.subdistrict}
              defaultValue={held.subdistrict}
              autoComplete="address-level3"
            />
            <Field
              label="District (amphoe)"
              name="district"
              error={errors.district}
              defaultValue={held.district}
              autoComplete="address-level2"
            />

            <label className="block">
              <span className="text-[13px] font-semibold text-ink">Province</span>
              <select
                name="province"
                value={province}
                onChange={(event) => setProvince(event.target.value)}
                autoComplete="address-level1"
                className="mt-1.5 h-11 w-full rounded-[7px] border border-line-strong bg-white px-3 text-sm text-ink focus:border-plum-600 focus:outline-none"
              >
                {PROVINCES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              {errors.province && (
                <span className="facts mt-1 block text-sale-600">{errors.province}</span>
              )}
            </label>

            <Field
              label="Postcode"
              name="postcode"
              error={errors.postcode}
              defaultValue={held.postcode}
              autoComplete="postal-code"
              inputMode="numeric"
            />
          </div>
        </Step>

        <Step n={2} heading="How it gets there">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {METHODS.map((method) => (
              <Tile
                key={method.id}
                name="delivery"
                value={method.id}
                checked={delivery === method.id}
                onChange={(value) => setDelivery(value as DeliveryMethod)}
                label={method.label}
                blurb={method.blurb}
                aside={
                  deliveryFee(method.id, subtotal) === 0 ? (
                    <span className="font-semibold text-pandan-700">Free</span>
                  ) : (
                    <span className="font-semibold text-ink" data-num>
                      {price(method.fee)}
                    </span>
                  )
                }
                foot={<DeliveryEstimate method={method.id} zone={zone} />}
              />
            ))}
          </div>
          {errors.delivery && <p className="facts mt-2 text-sale-600">{errors.delivery}</p>}
          <p className="facts mt-3">
            Standard is free over <span data-num>{price(FREE_DELIVERY_THRESHOLD)}</span>. Cutoff for
            same-day picking is <span data-num>{CUTOFF_HOUR}:00</span> Bangkok time.
          </p>
        </Step>

        <Step n={3} heading="How you pay">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {methods.map((method) => (
              <Tile
                key={method.id}
                name="payment"
                value={method.id}
                checked={payment === method.id}
                onChange={setPayment}
                label={method.label}
                blurb={method.blurb}
              />
            ))}
          </div>
          {errors.payment && <p className="facts mt-2 text-sale-600">{errors.payment}</p>}

          {chosenPayment && chosenPayment.details.length > 0 && (
            <dl className="mt-4 divide-y divide-line rounded-card border border-line bg-paper">
              {chosenPayment.details.map((detail) => (
                <div key={detail.term} className="flex flex-wrap gap-x-4 px-4 py-2.5">
                  <dt className="w-40 text-[13px] font-semibold text-ink">{detail.term}</dt>
                  <dd className="facts flex-1 text-[13px] text-ink" data-num>
                    {detail.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {awaitingBank && (
            <p className="facts mt-4 rounded-card border border-line bg-paper-warm px-4 py-3 leading-relaxed text-plum-800">
              Bank transfer and PromptPay are not switched on yet — those account details are still
              to come from the shop. There are no card fields here because nothing behind this site
              can take a card.
            </p>
          )}
        </Step>
      </div>

      <OrderSummaryPanel
        lines={lines}
        subtotal={subtotal}
        fee={fee}
        delivery={delivery}
        zone={zone}
        pending={pending}
        cartError={errors.cart}
        payment={chosenPayment}
      />
    </form>
  );
}
