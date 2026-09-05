<!-- Split out of CLAUDE.md, which has a size budget. Everything here is a rule about the product
     page. CLAUDE.md keeps the traps that bite from outside it: the frame's forbidden properties,
     the radio gallery, the disclosure fallback, and where new copy blocks are allowed to go. -->

# Product page (`/p/[slug]`)

Three columns: media, summary, sticky buy box. The summary runs flag -> title -> brand -> rating -> stock -> pack size ->
at a glance -> one cross-sell -> rankings. Below the fold: the jump list, **Pairs well with**, the descriptive section,
then **Recently viewed** — alternatives before a wall of label copy.

- `pdp/product-gallery.tsx` — one view per shot, max four, switched by **radio inputs and the `.gallery` rules** in
  `globals.css`: no client JS, keyboard-operable, survives reload; the "2 / 4" readout reuses the same `:checked` rule.
  `gallery-swipe.tsx` adds swiping by **moving the checked radio**, and **attaches by query** — wrapping the frame would
  break every `input:checked ~ .frame` selector.
- `pdp/zoom-shot.tsx` — a lens plus a pane beside the frame, off below 1024px and for touch. The pane is `fixed` to escape
  the frame's `overflow-hidden`, so **never put `transform`, `filter` or `will-change` on the frame**, and it **must stay a
  direct child of `.frame` in source order**. **No product image carries a hover transform.**
- `pdp/product-information.tsx` — 14/10 split: Overview, Suggested use, Other ingredients, Warnings, Specifications,
  Storage, Disclaimer on the left; `supplement-facts.tsx` on the right. **New copy blocks go here, never beside the buy
  box.** Each is a `<details class="disclosure md-open">`: a disclosure on a phone, forced open from `md` by
  `::details-content`, with **`open` on Overview and Warnings** so a browser lacking that selector still shows them.
  `infoSections()` builds the jump list from the blocks this label actually has.
- `pdp/at-a-glance.tsx` carries the active, the serving, the format, the cost per serving and how long a pack lasts —
  **every derived figure captioned with its arithmetic**.
- `pdp/mobile-buy-bar.tsx` — price, stock, stepper and add, pinned below `xl` where the buy box is the last thing on a
  stacked page; it hides itself when `#buy-box` intersects.
- `pdp/buy-box.tsx` — price, markdown, cost per serving, free-delivery threshold, arrival estimate, stepper capped at
  `MAX_QTY_PER_LINE`, `btn-cart`, and the out-of-stock branch (a restock form, no stepper, no add). **Subscription, BNPL
  and "see price in cart" are deliberately absent** — nothing behind the storefront supports them.
- `lib/product-info.ts` — selection and fallback for that copy, **never invention**: a derived-but-true line stands in
  where a product states no overview, directions or warnings, and **a panel with no input renders nothing**. `relationTo()`
  is the one-phrase comparison the cross-sell and pairs rail print ("Better value", "Higher dose"): every branch compares
  two figures **both** labels state, and it **returns null rather than guessing**.
- Reviews come from Postgres and the source aggregate is never averaged with them — see `reference/ACCOUNTS.md`.
- **No fabricated testing claims**: nothing behind the storefront runs a laboratory, `/quality` and the COA guide say so,
  and the label's own marks stay.
