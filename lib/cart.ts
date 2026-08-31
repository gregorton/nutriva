/**
 * Rules the cart and the checkout must agree on.
 *
 * The stepper's maximum was a constant inside buy-box.tsx. The checkout clamps to the same number
 * server-side, because a quantity in a posted form is a number somebody chose, not one we set.
 */
export const MAX_QTY_PER_LINE = 12;

/** A cart line as it crosses the wire: a slug and a quantity, and nothing else. No prices. */
export type PostedLine = { slug: string; qty: number };

/** Parses the hidden `line` fields the checkout form posts — "slug:qty", one per line. */
export function parsePostedLines(values: string[]): PostedLine[] {
  const lines: PostedLine[] = [];

  for (const value of values) {
    const separator = value.lastIndexOf(":");
    if (separator < 1) continue;
    const slug = value.slice(0, separator);
    const qty = Number(value.slice(separator + 1));
    if (!slug || !Number.isInteger(qty) || qty < 1) continue;
    lines.push({ slug, qty: Math.min(qty, MAX_QTY_PER_LINE) });
  }

  return lines;
}
