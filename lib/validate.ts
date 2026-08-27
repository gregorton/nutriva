/*
  Form validation. Hand-written rather than a schema library: the whole project runs on `next`,
  `react`, `react-dom` and `pg`, and these rules are forty lines.

  Every validator returns the shape `useActionState` renders directly — a field-keyed map of
  messages — and returns the cleaned value on success, so the caller never touches the raw
  FormData string again.
*/

export type Invalid<F extends string> = { ok: false; errors: Partial<Record<F, string>> };
export type Valid<T> = { ok: true; value: T };
export type Checked<T, F extends string> = Valid<T> | Invalid<F>;

/** FormData gives File | string | null; everything here wants a trimmed string. */
function text(input: FormDataEntryValue | null): string {
  return typeof input === "string" ? input.trim() : "";
}

// Deliberately loose: the only test that means anything is whether mail arrives, and there is no
// mail sender here. This rejects the shapes that are certainly wrong and nothing more.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * The address as the two-step sign-in flow needs it: trimmed, lowercased, and either the shape of
 * an email or nothing at all. Step one hands the address to step two through the URL, so a value
 * that could never belong to an account has to send the person back to step one rather than reach
 * a lookup — and it is the same regex the actions validate against, not a second opinion.
 */
export function normaliseEmail(value: string | string[] | undefined): string | null {
  const raw = (Array.isArray(value) ? value[0] : value) ?? "";
  const email = raw.trim().toLowerCase();
  return email.length <= 254 && EMAIL.test(email) ? email : null;
}

export type Credentials = { email: string; password: string };
export type Registration = Credentials & { displayName: string };

export function checkRegistration(form: FormData): Checked<Registration, keyof Registration> {
  const email = text(form.get("email")).toLowerCase();
  const password = typeof form.get("password") === "string" ? String(form.get("password")) : "";
  const displayName = text(form.get("displayName"));
  const errors: Invalid<keyof Registration>["errors"] = {};

  if (!EMAIL.test(email)) errors.email = "Enter an email address we can reach you at.";
  else if (email.length > 254) errors.email = "That email address is too long.";

  if (displayName.length < 2) errors.displayName = "Give a name of at least 2 characters.";
  else if (displayName.length > 40) errors.displayName = "Keep this under 40 characters.";

  if (password.length < 8) errors.password = "Use at least 8 characters.";
  else if (password.length > 200) errors.password = "That password is longer than we can store.";
  else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))
    errors.password = "Include at least one letter and one number.";

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: { email, password, displayName } };
}

export function checkCredentials(form: FormData): Checked<Credentials, keyof Credentials> {
  const email = text(form.get("email")).toLowerCase();
  const password = typeof form.get("password") === "string" ? String(form.get("password")) : "";
  const errors: Invalid<keyof Credentials>["errors"] = {};

  if (!email) errors.email = "Enter your email address.";
  if (!password) errors.password = "Enter your password.";

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: { email, password } };
}

export type ReviewDraft = { rating: number; title: string | null; body: string };

export function checkReview(form: FormData): Checked<ReviewDraft, keyof ReviewDraft> {
  const rating = Number(text(form.get("rating")));
  const title = text(form.get("title"));
  const body = text(form.get("body"));
  const errors: Invalid<keyof ReviewDraft>["errors"] = {};

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = "Choose a rating from 1 to 5 stars.";
  if (title.length > 80) errors.title = "Keep the headline under 80 characters.";
  if (body.length < 10) errors.body = "Tell us a little more — at least 10 characters.";
  else if (body.length > 2000) errors.body = "Keep the review under 2,000 characters.";

  return Object.keys(errors).length
    ? { ok: false, errors }
    : { ok: true, value: { rating, title: title || null, body } };
}
