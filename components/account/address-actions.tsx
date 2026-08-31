"use client";

import { useActionState } from "react";
import {
  makeAddressDefault,
  removeAddress,
  type AddressState,
} from "@/app/actions/profile";

/*
  The two one-press actions on an address row. Each is its own form because each posts a different
  action, and both are client components only so a failure can be reported next to the row that
  failed rather than as a crashed subtree.

  There is no confirmation on Delete. An address is four lines somebody can retype, the row says
  which one it is, and a dialog on every delete is the kind of friction that gets clicked through
  without reading. ponytail: add a `<details>` two-step if this ever guards something unrecoverable.
*/
export function AddressRowActions({
  id,
  label,
  isDefault,
}: {
  id: string;
  /** Names the address in both accessible labels, so two rows never read the same. */
  label: string;
  isDefault: boolean;
}) {
  const [defaultState, setDefault, settingDefault] = useActionState<AddressState, FormData>(
    makeAddressDefault,
    undefined,
  );
  const [removeState, remove, removing] = useActionState<AddressState, FormData>(
    removeAddress,
    undefined,
  );
  const failure =
    (defaultState && "message" in defaultState && defaultState.message) ||
    (removeState && "message" in removeState && removeState.message);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {!isDefault && (
        <form action={setDefault}>
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            disabled={settingDefault}
            aria-label={`Use ${label} by default`}
            className="text-[13px] font-semibold text-plum-700 transition-colors hover:underline disabled:opacity-60"
          >
            {settingDefault ? "Setting…" : "Set as default"}
          </button>
        </form>
      )}

      <form action={remove}>
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          disabled={removing}
          aria-label={`Delete ${label}`}
          className="text-[13px] font-medium text-muted transition-colors hover:text-sale-600 disabled:opacity-60"
        >
          {removing ? "Deleting…" : "Delete"}
        </button>
      </form>

      {failure && <p className="facts text-sale-600">{failure}</p>}
    </div>
  );
}
