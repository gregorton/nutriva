<!-- Split out of CLAUDE.md, which has a size budget. Everything here is about restating harvested
     prices in today's baht. CLAUDE.md keeps the three rules a page author needs: prices are plain
     THB by the time they arrive, they round up to the whole baht, and the rate is a build input. -->

# Currency

The catalogue stores what iHerb charged in THB on the harvest day. `lib/fx.ts` unfreezes it: `adjust()` restates a price
at today's rate and the mapper in `lib/catalog.ts` applies it once, so filter bands, sorting, kit totals, cost per
serving and the free-delivery threshold all see plain THB.

## Two rates, and mixing them up costs a slice of margin

`HARVEST_MARKET_RATE` is the **market** rate on the harvest date — deliberately *not* the rate iHerb charged.

- The stored price carries iHerb's own spread. The ratio of two market rates moves each price by what the market moved
  and leaves that spread inside the figure.
- Dividing by iHerb's implied rate instead would shave the spread off every price, once, silently.
- **On a re-harvest this constant wants the market rate for the new harvest date**, not the rate the new prices imply.

## Rounding, and how the rate arrives

- **Prices round up to the whole baht** (`Math.ceil` in `adjust`), so none moves by more than ฿1 and every one stays at
  or above what it converts to. No charm pricing anywhere.
- **The rate is a committed build input, not a runtime lookup**, because `lib/catalog.ts` is synchronous and imported by
  every page.
- `reference/fx.mjs` reads the ECB daily rate, **refuses anything outside 25-45**, and **writes only once it has moved
  more than 0.5%**. A weekday workflow runs it and commits when it wrote; `--force` overrides the guard.
