"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { signIn, signUp, type AuthState } from "@/app/actions/auth";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icons";

/*
  The second screen of the flow, in its two forms: a password for an account that exists, and a
  name plus a new password for one that does not. The address is already settled by the time
  either renders — components/account/auth-flow.tsx decided which of these to show from it — so
  both carry it in a hidden field and neither offers to edit it.

  Client components because of what the fields do: reveal the password, score it as it is typed,
  and hold what was typed across a rejected submit. React resets an uncontrolled form once its
  action resolves, which on a rejected password would clear the name too.

  Navigation on success is usually not these components' doing: setting the session cookie in the
  action re-renders the route on the server, where the page's own "already signed in" redirect
  fires. `router.replace` is the fallback for when it does not, and a no-op when it has.
*/

export function PasswordStep({ email, next }: { email: string; next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, undefined);
  const [password, setPassword] = useState("");
  useNavigateOnSuccess(state);

  const failed = state && !state.ok ? state : undefined;

  return (
    <form action={action} className="mt-6" noValidate>
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="next" value={next} />

      {(failed?.message ?? failed?.errors?.email) && (
        <Problem>{failed?.message ?? failed?.errors?.email}</Problem>
      )}

      <PasswordField
        id="auth-password"
        label="Password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
        error={failed?.errors?.password}
      />

      <Submit pending={pending} disabled={password.length === 0}>
        Sign in
      </Submit>
      <Continue state={state} />
    </form>
  );
}

export function CreateStep({ email, next }: { email: string; next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, undefined);
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  useNavigateOnSuccess(state);

  const failed = state && !state.ok ? state : undefined;
  const strength = strengthOf(password);
  // The button is dead until the account could actually be created, so pressing it cannot be the
  // way you find out the password is too short.
  const ready = displayName.trim().length >= 2 && strength.usable;

  return (
    <form action={action} className="mt-4" noValidate>
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="next" value={next} />

      <p className="text-[15px] text-ink">
        There is no account with that email address yet. Pick a password and we will make one.
      </p>

      {(failed?.message ?? failed?.errors?.email) && (
        <Problem>{failed?.message ?? failed?.errors?.email}</Problem>
      )}

      <div className="mt-5">
        <Field
          id="auth-name"
          label="Your name"
          name="displayName"
          autoComplete="name"
          value={displayName}
          onChange={setDisplayName}
          error={failed?.errors?.displayName}
        />
        <p className="facts mt-1.5">Shown on any review you write.</p>
      </div>

      <div className="mt-4">
        <PasswordField
          id="auth-new-password"
          label="Create a password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          error={failed?.errors?.password}
          tone={strength.tone}
        />
        {password.length > 0 && !failed?.errors?.password && <Strength {...strength} />}
      </div>

      <Submit pending={pending} disabled={!ready}>
        Create account
      </Submit>
      <Continue state={state} />
    </form>
  );
}

/*
  Password strength, four rules deep.

  Two of the four are what lib/validate.ts actually enforces — eight characters, and a letter with
  a number — so `usable` is that rule and nothing else: the meter never blocks a password the
  server would accept. The other two are advice, which is why the bar can sit at half with the
  button live. Suggestions are given one at a time, in the order they are worth taking.

  Orange is turmeric and green is pandan, the trust colour: this is the one meter on the site
  where "good" is a claim about the person's own input rather than about a product.
*/
type Tone = "neutral" | "weak" | "good" | "error";

const RULES = [
  { met: (p: string) => p.length >= 8, hint: "Use at least 8 characters." },
  { met: (p: string) => /[0-9]/.test(p), hint: "Enter at least 1 number." },
  { met: (p: string) => /[A-Z]/.test(p), hint: "Enter at least 1 capital letter." },
  { met: (p: string) => /[^A-Za-z0-9]/.test(p), hint: "Enter at least 1 special character." },
];

const VERDICTS = ["Weak", "Weak", "Fair", "Good", "Strong"];

function strengthOf(password: string) {
  const met = RULES.map((rule) => rule.met(password));
  const score = met.filter(Boolean).length;
  const usable = password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);

  return {
    score,
    verdict: VERDICTS[score],
    suggestion: RULES[met.indexOf(false)]?.hint,
    usable,
    tone: (password.length === 0 ? "neutral" : score >= 3 ? "good" : "weak") as Tone,
  };
}

function Strength({
  score,
  verdict,
  suggestion,
  tone,
}: {
  score: number;
  verdict: string;
  suggestion?: string;
  tone: Tone;
}) {
  return (
    <div className="mt-2">
      <div className="flex gap-1.5" aria-hidden>
        {RULES.map((_, index) => (
          <span
            key={index}
            className={`h-[3px] flex-1 rounded-full ${index < score ? FILL[tone] : "bg-line"}`}
          />
        ))}
      </div>
      <p
        aria-live="polite"
        className={`mt-1.5 flex items-baseline justify-between gap-3 text-[11.5px] ${TEXT[tone]}`}
      >
        <span>{suggestion ? `Suggestion: ${suggestion}` : ""}</span>
        <span className="shrink-0 font-medium">{verdict}</span>
      </p>
    </div>
  );
}

/*
  One field, with its label notched into its own top border rather than sitting above it. There is
  no card behind these screens, so the label's white ground is the page's — which is what makes the
  outline read as a single drawn box instead of a filled input.
*/
const TEXT: Record<Tone, string> = {
  neutral: "text-muted",
  weak: "text-turmeric-600",
  good: "text-pandan-600",
  error: "text-sale-600",
};

const BORDER: Record<Tone, string> = {
  neutral: "border-line-strong focus-within:border-plum-600",
  weak: "border-turmeric-600",
  good: "border-pandan-600",
  error: "border-sale-600",
};

const FILL: Record<Tone, string> = {
  neutral: "bg-line",
  weak: "bg-turmeric-600",
  good: "bg-pandan-600",
  error: "bg-sale-600",
};

function Field({
  id,
  label,
  name,
  type = "text",
  autoComplete,
  value,
  onChange,
  error,
  tone = "neutral",
  trailing,
}: {
  id: string;
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  value: string;
  onChange: (next: string) => void;
  error?: string;
  tone?: Tone;
  trailing?: React.ReactNode;
}) {
  const active: Tone = error ? "error" : tone;

  return (
    <div>
      <div className={`relative rounded-card border bg-white ${BORDER[active]}`}>
        <label
          htmlFor={id}
          className={`absolute -top-[8px] left-2.5 bg-white px-1 text-[11.5px] font-medium ${TEXT[active]}`}
        >
          {label}
        </label>
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`h-12 w-full rounded-card bg-transparent pl-3.5 text-[15px] text-ink focus:outline-none ${
            trailing ? "pr-11" : "pr-3.5"
          }`}
        />
        {trailing}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-[12.5px] text-sale-600">
          {error}
        </p>
      )}
    </div>
  );
}

/** The same field with the eye toggle in it. Typed characters are the default; revealing is a press. */
function PasswordField(props: {
  id: string;
  label: string;
  autoComplete: string;
  value: string;
  onChange: (next: string) => void;
  error?: string;
  tone?: Tone;
}) {
  const [shown, setShown] = useState(false);

  return (
    <Field
      {...props}
      name="password"
      type={shown ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setShown((previous) => !previous)}
          aria-pressed={shown}
          aria-label={shown ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted transition-colors hover:text-ink"
        >
          {shown ? <EyeOffIcon className="h-[18px] w-[18px]" /> : <EyeIcon className="h-[18px] w-[18px]" />}
        </button>
      }
    />
  );
}

function Submit({
  pending,
  disabled,
  children,
}: {
  pending: boolean;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const off = disabled || pending;
  return (
    <button
      type="submit"
      disabled={off}
      className={`mt-5 h-12 w-full rounded-card text-[15px] font-semibold transition-colors ${
        off ? "cursor-not-allowed bg-line/70 text-faint" : "bg-plum-800 text-white hover:bg-plum-700"
      }`}
    >
      {pending ? "One moment…" : children}
    </button>
  );
}

function Problem({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="mt-4 rounded-card border border-sale-600/30 px-3.5 py-2.5 text-sm text-sale-600"
    >
      {children}
    </p>
  );
}

/** Without JavaScript the action still runs and the cookie is still set; only the navigation is
    missing, so the page offers it as a link rather than appearing to have failed. */
function Continue({ state }: { state: AuthState }) {
  if (!state?.ok) return null;
  return (
    <p className="facts mt-3 text-center">
      Signed in.{" "}
      <Link href={state.next} className="font-medium text-plum-700 underline">
        Continue
      </Link>
    </p>
  );
}

function useNavigateOnSuccess(state: AuthState) {
  const router = useRouter();
  useEffect(() => {
    if (state?.ok) router.replace(state.next);
  }, [state, router]);
}




