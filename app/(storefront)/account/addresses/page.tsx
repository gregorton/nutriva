import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { addressesFor } from "@/lib/addresses";
import { Panel } from "@/components/account/account-panels";
import { AddressForm } from "@/components/account/address-form";
import { AddressRowActions } from "@/components/account/address-actions";

export const metadata: Metadata = { title: "Address book" };

/*
  Saved addresses. A convenience, not a record: an order snapshots the address it shipped to, so
  editing or deleting an entry here cannot rewrite where a past parcel went.

  Editing and adding both open a `<details>` — the browser's own disclosure, so there is no
  open/closed state to hold, it works before hydration, and it is keyboard-operable for free. The
  forms inside are client components because they carry field errors.
*/
export default async function AddressBookPage() {
  const user = await requireUser("/account/addresses");
  const addresses = await addressesFor(user.id);

  return (
    <>
      <Panel
        title="Address book"
        meta={
          addresses.length > 0
            ? `${addresses.length} ${addresses.length === 1 ? "address" : "addresses"}`
            : undefined
        }
        padded={addresses.length === 0}
      >
        {addresses.length === 0 ? (
          <p className="max-w-[52ch] text-sm leading-relaxed text-muted">
            Nothing saved yet. An address here is a convenience for later, and the checkout still
            asks for one every time, so nothing is lost by leaving this empty.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {addresses.map((address) => {
              const name = address.label ?? address.name;
              return (
                <li key={address.id} className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-ink">
                        {name}
                        {address.isDefault && (
                          <span className="bg-pandan-100 px-2 py-0.5 text-[11.5px] font-semibold text-pandan-700">
                            Default
                          </span>
                        )}
                      </p>
                      <address className="mt-1.5 not-italic text-sm leading-relaxed text-ink">
                        {address.label && <span className="block">{address.name}</span>}
                        {address.line}
                        <br />
                        {address.subdistrict}, {address.district}
                        <br />
                        {address.province} <span data-num>{address.postcode}</span>
                      </address>
                      <p className="facts mt-1.5" data-num>
                        {address.phone}
                      </p>
                    </div>

                    <AddressRowActions
                      id={address.id}
                      label={name}
                      isDefault={address.isDefault}
                    />
                  </div>

                  <details className="group mt-3">
                    <summary className="inline-flex cursor-pointer list-none text-[13px] font-semibold text-plum-700 hover:underline">
                      <span className="group-open:hidden">Edit</span>
                      <span className="hidden group-open:inline">Close</span>
                    </summary>
                    <div className="mt-4 border-t border-line pt-4">
                      <AddressForm address={address} />
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel>
        <details className="group">
          <summary className="inline-flex cursor-pointer list-none text-[15px] font-semibold text-plum-700 hover:underline">
            <span className="group-open:hidden">Add an address</span>
            <span className="hidden group-open:inline">Cancel</span>
          </summary>
          <div className="mt-5 border-t border-line pt-5">
            <AddressForm first={addresses.length === 0} />
          </div>
        </details>
      </Panel>
    </>
  );
}
