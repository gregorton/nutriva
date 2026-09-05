<!-- Split out of CLAUDE.md, which has a size budget. Everything here is a rule about kit
     composition or the builder. CLAUDE.md keeps the three that decide whether a change is safe:
     kits are composed by rule, the age guardrails are code, and no surface carries claim copy. -->

# Starter kits

`/starters` and the band under the home hero. `lib/starters.ts` composes; `starters/kit-builder.tsx` lets a reader
change the result.

- **A kit is a list of roles, not a list of slugs** — "a magnesium glycinate under ฿600" — each filled with the
  best-selling in-stock match, so a catalogue refresh re-resolves the kit instead of pointing at a dead product.
- An unfillable role is **dropped**; a kit left with **under two items is not published**.
- The home band shows the **kits**, not their bottles flattened into a product rail.
- The builder takes only the kit's slug and resolves through `getProduct` — `lib/catalog.ts` is in the client bundle
  already. **Alternatives come from the same `candidates()` the original fill used**, so a swap cannot get past the
  guardrails.
- `routine()` prices the selection; `duplicateActives()` warns when two chosen labels state the same nutrient; Save
  writes to the existing saved list, so it needs an account.

## Guardrails (audience is 16 and up)

- **`EXCLUDED` keeps children's lines and the whole `kids` category out of every kit**, which is why no kit leads on
  format: most gummies in stock are children's. Melatonin is out too, while staying on the sleep shelf.
- **Value is real numbers only**: the sum of item prices; a markdown only when every item states a `listPrice`; days
  supply and the monthly figure from `servings`, counted over the items that state one, with the wording saying how
  many that was.
- **No claim copy.** `starters-check.mjs` sweeps both surfaces for weight-loss, focus and exam-result phrasing,
  skipping `#what-we-wont-do` — the one block allowed to name those claims, because it refuses them.
