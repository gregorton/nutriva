"use client";

import { useActionState } from "react";
import { subscribe, type SubscribeState } from "@/app/actions/subscribe";
import { ArrowIcon, CheckIcon } from "@/components/ui/icons";

/*
  The one email form, in two places: the footer's restock reminder and the request on an
  out-of-stock product page. Both post to the same action, which re-validates everything.

  A real `<form action={...}>` with the source and slug as hidden fields, so it submits before
  hydration too. `useActionState` is what renders the answer; there is no state of our own.
*/
export function EmailSignup({
  source,
  slug,
  cta = "Sign up",
  variant = "footer",
}: {
  source: "footer" | "restock";
  slug?: string;
  cta?: string;
  variant?: "footer" | "panel";
}) {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribe, {
    status: "idle",
  });

  if (state.status === "ok") {
    return (
      <p className="facts flex items-start gap-2 font-medium text-pandan-700">
        <CheckIcon className="mt-px h-3.5 w-3.5 shrink-0" />
        {state.message}
      </p>
    );
  }

  const dark = variant === "footer";

  return (
    <form action={action}>
      <input type="hidden" name="source" value={source} />
      {slug && <input type="hidden" name="slug" value={slug} />}

      <div className="flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Email address</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@email.com"
            className="h-10 w-full rounded-[7px] border border-line-strong bg-white px-3 text-sm placeholder:text-faint focus:border-plum-600 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className={`flex h-10 shrink-0 items-center gap-1.5 rounded-[7px] px-4 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${
            dark ? "bg-plum-800 hover:bg-plum-700" : "bg-plum-700 hover:bg-plum-600"
          }`}
        >
          {pending ? "Saving…" : cta}
          {!pending && <ArrowIcon className="h-4 w-4" />}
        </button>
      </div>

      {state.status === "error" && (
        <p className="facts mt-2 text-sale-600" role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}
