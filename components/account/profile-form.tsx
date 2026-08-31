"use client";

import { useActionState } from "react";
import { saveProfile, type ProfileState } from "@/app/actions/profile";
import { refreshAccount } from "@/components/account/account-store";
import { Field } from "@/components/checkout/parts";
import { CheckIcon } from "@/components/ui/icons";
import type { Profile } from "@/lib/profile";

/*
  The profile form. One submit for every field, because they are all the same kind of thing and a
  save button per row is five ways to half-finish.

  It reuses the checkout's `Field`, so an input on this page cannot drift from an input on that one.
  The fields are uncontrolled and seeded with `defaultValue` from the server: the action re-renders
  this page through `refresh()`, which is what makes the saved values the new defaults, and holding
  them in state as well would be a second copy to keep honest.
*/
const GENDERS = [
  { value: "", label: "Prefer not to say" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
];

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfile, undefined);
  const errors = (state && "errors" in state ? state.errors : undefined) ?? {};
  const saved = state?.ok === true;

  return (
    <form
      action={async (form) => {
        await action(form);
        // The masthead is a client island holding its own snapshot of who is signed in, so a
        // changed display name has to be pushed at it. See components/account/account-store.ts.
        await refreshAccount();
      }}
      className="max-w-[34rem] space-y-5"
    >
      <Field
        label="Name"
        name="displayName"
        defaultValue={profile.displayName}
        error={errors.displayName}
        hint="Shown on any review you write."
        maxLength={40}
        autoComplete="name"
      />

      <Field
        label="Email address"
        name="email"
        type="email"
        defaultValue={profile.email ?? ""}
        error={errors.email}
        hint={
          profile.hasPassword
            ? "You sign in with this address."
            : "Optional. This account signs in through a provider."
        }
        required={profile.hasPassword || profile.email !== null}
        autoComplete="email"
      />

      <Field
        label="Phone number"
        name="phone"
        type="tel"
        defaultValue={profile.phone ?? ""}
        error={errors.phone}
        hint="Optional. Used only to reach you about an order."
        required={false}
        placeholder="081 234 5678"
        autoComplete="tel"
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label="Date of birth"
          name="birthday"
          type="date"
          defaultValue={profile.birthday ?? ""}
          error={errors.birthday}
          hint="Optional."
          required={false}
          max={new Date().toISOString().slice(0, 10)}
        />

        <label className="block">
          <span className="text-[13px] font-semibold text-ink">Gender</span>
          {/*
            Keyed on the value the server sent. React resets an uncontrolled form after a Server
            Action, and a reset restores each field to its DOM default — for an input that is the
            `value` attribute, which React rewrites when `defaultValue` changes, but for a select it
            is the option carrying `selected`, which the update path does not move. Without the key
            the select snapped back to "Prefer not to say" after a save that had just written
            "female". The key remounts it, so the saved value becomes the real default.
          */}
          <select
            key={profile.gender ?? "unset"}
            name="gender"
            defaultValue={profile.gender ?? ""}
            aria-invalid={errors.gender ? true : undefined}
            className="mt-1.5 h-11 w-full border border-line-strong bg-white px-3 text-sm text-ink focus:border-plum-600 focus:outline-none"
          >
            {GENDERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.gender ? (
            <span className="facts mt-1 block text-sale-600">{errors.gender}</span>
          ) : (
            <span className="facts mt-1 block">Optional.</span>
          )}
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-5">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center bg-plum-800 px-6 text-sm font-semibold text-white transition-colors hover:bg-plum-700 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>

        {saved && (
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
