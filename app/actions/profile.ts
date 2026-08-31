"use server";

import { refresh, revalidatePath } from "next/cache";
import { getUser } from "@/lib/dal";
import { profileFor, updateProfile } from "@/lib/profile";
import {
  deleteAddress,
  saveAddress as writeAddress,
  setDefaultAddress,
} from "@/lib/addresses";
import { PROVINCES } from "@/lib/thailand";
import { checkAddress, checkProfile } from "@/lib/validate";

/*
  The profile and the address book.

  Every one of these re-reads the session through the DAL rather than trusting the caller. A Server
  Action is a POST endpoint that anything can call, and the form rendered above it is not evidence
  that a form is what sent the request. Every id arrives in a form field and is scoped to the
  account in the query itself, so a forged id writes nothing rather than somebody else's row.

  They return state instead of redirecting, the same as the auth actions: the masthead is a client
  island holding a snapshot of who is signed in, and changing the display name here has to reach it.
  `refresh()` re-renders the page being looked at on the server; `revalidatePath` drops what the
  client router is holding for the other account pages.
*/

export type ProfileState =
  | {
      errors?: Partial<Record<"displayName" | "email" | "phone" | "birthday" | "gender", string>>;
      message?: string;
      ok?: false;
    }
  | { ok: true }
  | undefined;

export async function saveProfile(_state: ProfileState, form: FormData): Promise<ProfileState> {
  const user = await getUser();
  if (!user) return { message: "Sign in to change your details." };

  // Whether the address may be cleared is a fact about the row, not something the form can claim:
  // an account with a password signs in with that address.
  const current = await profileFor(user.id);
  if (!current) return { message: "That account no longer exists." };

  const checked = checkProfile(form, current.hasPassword || current.email !== null);
  if (!checked.ok) return { errors: checked.errors };

  try {
    const saved = await updateProfile(user.id, checked.value);
    if (!saved.ok) {
      return { errors: { email: "There is already an account with that email address." } };
    }
  } catch (error) {
    console.error("Profile save failed:", error);
    return { message: "Something went wrong saving that. Try again in a moment." };
  }

  revalidatePath("/account");
  refresh();
  return { ok: true };
}

export type AddressState =
  | {
      errors?: Partial<
        Record<
          "label" | "name" | "phone" | "line" | "subdistrict" | "district" | "province" | "postcode",
          string
        >
      >;
      message?: string;
      ok?: false;
    }
  | { ok: true }
  | undefined;

/** An id in the form means edit, no id means add. Either way it is checked against the account. */
export async function saveAddress(_state: AddressState, form: FormData): Promise<AddressState> {
  const user = await getUser();
  if (!user) return { message: "Sign in to manage your addresses." };

  const checked = checkAddress(form, PROVINCES);
  if (!checked.ok) return { errors: checked.errors };

  const id = form.get("id");
  const makeDefault = form.get("makeDefault") === "on";

  try {
    const written = await writeAddress(
      user.id,
      typeof id === "string" && id ? id : null,
      checked.value,
      makeDefault,
    );
    if (!written) return { message: "That address is no longer in your book." };
  } catch (error) {
    console.error("Address save failed:", error);
    return { message: "Something went wrong saving that. Try again in a moment." };
  }

  revalidatePath("/account/addresses");
  refresh();
  return { ok: true };
}

export async function removeAddress(_state: AddressState, form: FormData): Promise<AddressState> {
  const user = await getUser();
  if (!user) return { message: "Sign in to manage your addresses." };

  const id = form.get("id");
  if (typeof id !== "string" || !id) return { message: "That address is no longer in your book." };

  await deleteAddress(user.id, id);
  revalidatePath("/account/addresses");
  refresh();
  return { ok: true };
}

export async function makeAddressDefault(
  _state: AddressState,
  form: FormData,
): Promise<AddressState> {
  const user = await getUser();
  if (!user) return { message: "Sign in to manage your addresses." };

  const id = form.get("id");
  if (typeof id !== "string" || !id) return { message: "That address is no longer in your book." };

  await setDefaultAddress(user.id, id);
  revalidatePath("/account/addresses");
  refresh();
  return { ok: true };
}
