"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { signIn, signUp, type AuthState } from "@/app/actions/auth";

/*
  The sign-in and sign-up form. One component for both, because the two differ by a single field
  and the wiring around them — validation display, pending state, and what happens on success —
  is identical.

  The fields are controlled. React resets an uncontrolled form once its action resolves, which on
  a rejected password would empty the email and name too and make the person type everything
  again; holding the values here means a validation error costs them one field, not the form.

  Navigation on success is usually not this component's doing: setting the session cookie in the
  action makes Next re-render this route on the server, where the page's own "already signed in"
  redirect fires. The `router.replace` below is the fallback for when that does not happen, and it
  is a no-op when it already has. Keeping the masthead in step is SessionSync's job, not this one's.
*/
export function AuthForm({ mode, next }: { mode: "signin" | "signup"; next: string }) {
  const isSignUp = mode === "signup";
  const [state, action, pending] = useActionState<AuthState, FormData>(
    isSignUp ? signUp : signIn,
    undefined,
  );
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) router.replace(state.next);
  }, [state, router]);

  const errors = state && !state.ok ? state.errors : undefined;
  const message = state && !state.ok ? state.message : undefined;

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />

      {message && (
        <p
          role="alert"
          className="rounded-card border border-sale-600/30 bg-sale-600/5 px-3.5 py-2.5 text-sm text-sale-600"
        >
          {message}
        </p>
      )}

      {isSignUp && (
        <Field
          label="Your name"
          hint="Shown on any review you write."
          name="displayName"
          autoComplete="name"
          value={displayName}
          onChange={setDisplayName}
          error={errors?.displayName}
        />
      )}

      <Field
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
        error={errors?.email}
      />

      <Field
        label="Password"
        hint={isSignUp ? "At least 8 characters, with a letter and a number." : undefined}
        name="password"
        type="password"
        autoComplete={isSignUp ? "new-password" : "current-password"}
        value={password}
        onChange={setPassword}
        error={errors?.password}
      />

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-card bg-plum-800 px-4 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-plum-700 disabled:opacity-60"
      >
        {pending ? "One moment…" : isSignUp ? "Create account" : "Sign in"}
      </button>

      {/* Without JavaScript the action still runs and the cookie is still set; only the
          navigation is missing, so the page says so rather than appearing to have failed. */}
      {state?.ok && (
        <p className="facts text-center">
          Signed in.{" "}
          <Link href={state.next} className="font-medium text-plum-700 underline">
            Continue
          </Link>
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  hint,
  name,
  type = "text",
  autoComplete,
  value,
  onChange,
  error,
}: {
  label: string;
  hint?: string;
  name: string;
  type?: string;
  autoComplete?: string;
  value: string;
  onChange: (next: string) => void;
  error?: string;
}) {
  const id = `auth-${name}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {hint && <p className="facts mt-0.5">{hint}</p>}
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`mt-1.5 h-11 w-full rounded-card border bg-paper px-3.5 text-[15px] text-ink placeholder:text-faint focus:bg-white focus:outline-none ${
          error ? "border-sale-600 focus:border-sale-600" : "border-line-strong focus:border-plum-600"
        }`}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-[12.5px] text-sale-600">
          {error}
        </p>
      )}
    </div>
  );
}
