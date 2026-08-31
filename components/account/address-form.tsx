"use client";

import { useActionState } from "react";
import { saveAddress, type AddressState } from "@/app/actions/profile";
import { Field } from "@/components/checkout/parts";
import { CheckIcon } from "@/components/ui/icons";
import { BANGKOK_PROVINCE, PROVINCES } from "@/lib/thailand";
import type { Address } from "@/lib/addresses";

/*
  One address, being written or edited. The same fields in the same order as the checkout's step one,
  through the same `Field`, so an entry saved here cannot be one the checkout would refuse.

  No open/close state anywhere: the page wraps each of these in a `<details>`, which is a disclosure
  the browser already implements, keyboard-operable and working before hydration. The only client
  state here is what `useActionState` holds for the errors.
*/
export function AddressForm({
  address,
  /** True for the first entry: it becomes the default whatever the box says, so the box is not offered. */
  first,
}: {
  address?: Address;
  first?: boolean;
}) {
  const [state, action, pending] = useActionState<AddressState, FormData>(saveAddress, undefined);
  const errors = (state && "errors" in state ? state.errors : undefined) ?? {};

  return (
    <form action={action} className="space-y-4">
      {address && <input type="hidden" name="id" value={address.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Label"
          name="label"
          defaultValue={address?.label ?? ""}
          error={errors.label}
          hint="Optional. Home, office, a friend's place."
          required={false}
          maxLength={30}
        />
        <Field
          label="Full name"
          name="name"
          defaultValue={address?.name ?? ""}
          error={errors.name}
          autoComplete="name"
        />
      </div>

      <Field
        label="Phone number"
        name="phone"
        type="tel"
        defaultValue={address?.phone ?? ""}
        error={errors.phone}
        hint="The courier calls this on the day."
        autoComplete="tel"
      />

      <Field
        label="House number and street"
        name="line"
        defaultValue={address?.line ?? ""}
        error={errors.line}
        autoComplete="street-address"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Sub-district (tambon)"
          name="subdistrict"
          defaultValue={address?.subdistrict ?? ""}
          error={errors.subdistrict}
        />
        <Field
          label="District (amphoe)"
          name="district"
          defaultValue={address?.district ?? ""}
          error={errors.district}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-[13px] font-semibold text-ink">Province</span>
          <select
            name="province"
            defaultValue={address?.province ?? BANGKOK_PROVINCE}
            aria-invalid={errors.province ? true : undefined}
            className="mt-1.5 h-11 w-full border border-line-strong bg-white px-3 text-sm text-ink focus:border-plum-600 focus:outline-none"
          >
            {PROVINCES.map((province) => (
              <option key={province} value={province}>
                {province}
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
          defaultValue={address?.postcode ?? ""}
          error={errors.postcode}
          inputMode="numeric"
          maxLength={5}
          autoComplete="postal-code"
        />
      </div>

      {!first && (
        <label className="flex items-center gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            name="makeDefault"
            defaultChecked={address?.isDefault ?? false}
            className="h-4 w-4 accent-plum-700"
          />
          Use this address by default
        </label>
      )}

      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-4">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center bg-plum-800 px-6 text-sm font-semibold text-white transition-colors hover:bg-plum-700 disabled:opacity-60"
        >
          {pending ? "Saving…" : address ? "Save changes" : "Add address"}
        </button>

        {state?.ok === true && (
          <p className="facts flex items-center gap-1.5 font-medium text-pandan-700" role="status">
            <CheckIcon className="h-3.5 w-3.5" />
            Saved.
          </p>
        )}
        {state && "message" in state && state.message && (
          <p className="facts text-sale-600" role="status">
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
