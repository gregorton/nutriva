import "server-only";
import { isConfigured, query } from "@/lib/db";

/*
  Email captures: the footer's restock reminder and the out-of-stock request on a product page.

  Nothing here sends mail. The site has no mail transport, so what these rows do is record who
  asked — the copy on both forms says exactly that rather than promising an email a system with no
  sender could not deliver.
*/

/** Fixed set, so a forged post cannot widen the column. */
const SOURCES = new Set(["footer", "restock"]);

export function isSignupSource(value: string): boolean {
  return SOURCES.has(value);
}

/**
 * Records one request. Idempotent: the partial unique indexes in 004_signups mean a second press
 * from the same address touches nothing and still answers yes.
 */
export async function recordSignup(
  email: string,
  source: string,
  productSlug: string | null,
): Promise<boolean> {
  if (!isConfigured()) return false;

  await query(
    `insert into signups (email, product_slug, source)
     values ($1, $2, $3)
     on conflict do nothing`,
    [email, productSlug, source],
  );
  return true;
}
