<!-- Split out of CLAUDE.md, which has a size budget. Everything here is about the client's logo and
     the assets derived from it. CLAUDE.md keeps the tokens, the type rule and the card rules. -->

# Brand assets

**The logo is the client's artwork: placed, not drawn.** Every shipped asset derives from
`public/logos/slim-wellness-asia-square.png` via `node reference/brand/icons.mjs`.

- The icons are rendered **on white**, because thin gold strokes vanish against a dark browser tab.
- The lockup is stacked, so size it **by height alone**, never width.
- **The 250px source is a raster.** Ask the client for the vector before anything is printed or scaled up.
- Type is Inter everywhere (`--font-sans` and `--font-display`), `tabular-nums` for figures; `/admin` is the one route
  loading JetBrains Mono behind `--font-term`. **Inter carries no Thai** — localisation needs a second face.

# Product surfaces the tokens serve

- **Ratings are stars everywhere** (`ui/stars.tsx`), filled by a clipped overlay so 4.8 shows a part-filled fifth. Cards
  carry the review count and **no numeric average**.
- **The facts strip is the signature device** (`product/facts-strip.tsx`) — a back-of-bottle spec row, opened out on the PDP
  into `pdp/at-a-glance.tsx` and `pdp/supplement-facts.tsx`.
- **Cost per serving is always printed as arithmetic** ("our price ÷ 180 servings"): `perServing` is recomputed in the
  mapper off the adjusted price, so it tracks the rate. It is also the `value` sort and a compare row.
