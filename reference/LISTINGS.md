<!-- Split out of CLAUDE.md, which has a size budget. Everything here is a rule about the listing
     pages, the filter rail, the sheets or the rails. CLAUDE.md keeps the URL-state contract, the
     phone rules and the traps (centred overflow, z-40, the render-prop limit). -->

# Listings, brands, rails

`/c/[slug]`, `/search`, `/deals`, `/new` and `/b/[brand]` share `lib/listing.ts` and `plp/product-listing.tsx`; filter and
sort state lives in the URL via `lib/query.ts`, so every control is a link.

- **`/b/[brand]` is the whole of a brand, across every shelf.** 46 of the 134 brands sit on more than one, which
  `/c/[category]?brand=…` could only ever slice. `brandSlug` and `BRANDS` live in `lib/catalog.ts`: a name-to-URL mapping
  is catalogue knowledge.
- **`/new` sorts on `firstAvailable`** — the month the label says the product first shipped, so new to the market rather
  than to the warehouse, and the kicker says so. The rail's **brand group stays a filter**: scoping a category is a
  different job from browsing a brand.
- `lib/subcategories.ts` is the browse rail atop `/c/[slug]`: label + match terms per category, a tile shown only when
  stock matches (`inSubcategory`), and it sets `refine` as a link.
- **Paging is `?show=` at `PAGE_SIZE`**, as a link, so "show more" is shareable and back-navigable.

## The phone controls

- Listing pages pin a bar under the chrome with the count, Filter and Sort. Both open `plp/disclosure-sheet.tsx`: a native
  `<details>` shown as a bottom sheet below `lg` and a dropdown above.
- `<details>` because **the filter rail is links and has always worked before hydration**, so React only adds Escape,
  outside-press and a scroll lock.
- Filters stay open through a press and close on "Show N products"; sort closes on choosing.
- **A render prop cannot reach the footer** — the callers are server components — so `SheetCloseButton` takes the close
  through context.
- That pinned bar needs **`z-40`**, matching the chrome, or the sheet inside it is capped by its stacking context.

## Rails

- The category row says it scrolls off a real measurement (`ui/use-scroll-edges.ts`, shared with the product rails). "The
  start" there is the track's own `px-1`, not zero, because mandatory snap parks it on the first child.
- Rails show six cards below `sm` plus the "see all" tile (`.rail-trim`); the footer's columns and the information blocks
  fold into `<details>`.

## Compare

`/compare?p=…&p=…` — the tray holds up to four slugs in a browser store, but **the comparison itself is a URL**, so it is
shareable and the page needs no client state.

- Rows are keyed on the **nutrient**, not the printed string — two labels write the same magnesium differently — and each
  cell keeps its own label's wording underneath.
- **A dash means the label does not state the row; never a zero.**
- Rows every product answers identically are **dropped**; `?all=1` puts them back.
- The strongest cell is marked **only where a figure backs it**, with the reason named, and a facts row is comparable only
  when every stated amount shares a unit.
- The label column is `sticky left-0`.
