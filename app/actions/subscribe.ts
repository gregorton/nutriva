"use server";

import { getProduct } from "@/lib/catalog";
import { isSignupSource, recordSignup } from "@/lib/signups";
import { normaliseEmail } from "@/lib/validate";

/*
  The one action behind both email forms. Like every action in this folder it is a POST endpoint
  anything can call, so nothing in the body is trusted: the address goes through the same
  `normaliseEmail` the sign-in flow uses, the source is checked against a fixed set, and the
  product slug is resolved through `getProduct()` rather than stored as sent.
*/

export type SubscribeState =
  | { status: "idle" }
  | { status: "ok"; message: string }
  | { status: "error"; message: string };

export async function subscribe(_prev: SubscribeState, form: FormData): Promise<SubscribeState> {
  const email = normaliseEmail(String(form.get("email") ?? ""));
  if (!email) return { status: "error", message: "That does not look like an email address." };

  const source = String(form.get("source") ?? "footer");
  if (!isSignupSource(source)) return { status: "error", message: "Something went wrong. Try again." };

  const requested = String(form.get("slug") ?? "");
  const product = requested ? getProduct(requested) : null;
  if (requested && !product) return { status: "error", message: "That product is no longer listed." };

  const stored = await recordSignup(email, source, product?.slug ?? null);
  if (!stored) return { status: "error", message: "Not available just now. Try again later." };

  return {
    status: "ok",
    message: product
      ? "Noted — we will get in touch when this one is back."
      : "Noted. We will only get in touch about restocks.",
  };
}
