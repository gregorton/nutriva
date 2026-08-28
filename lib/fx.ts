import fx from "./fx.generated.json";

/*
  Currency. Every price in `catalog.generated.json` is the THB figure th.iherb.com printed on the
  day that product was harvested, which means the whole storefront is priced at one frozen exchange
  rate. This module unfreezes it: `adjust` restates a harvested price at today's rate, `catalog.ts`
  applies it once as it maps the catalogue, and nothing else in the codebase has to know.

  Two rates are involved, and the difference between them is the part worth reading twice.

  HARVEST_MARKET_RATE is the *market* rate on the harvest date — deliberately not the rate iHerb
  charged. What we stored is `usd x iHerb's rate`, and iHerb's rate carries their own spread: the
  prices in the harvest imply about 32.81 to the dollar on a day the market closed at 32.735, so
  roughly 0.23% over. Dividing by the market rate and multiplying by today's market rate moves each
  price by exactly what the market moved and leaves that spread inside the stored figure, where it
  belongs. Dividing by iHerb's own 32.81 instead would quietly shave their spread off every price
  the first time this ran.

  So the multiplier is one honest claim — "the dollar has moved this much since we copied these
  prices" — and it is checkable: both numbers are dated, one is in this file and the other is in
  `fx.generated.json`, committed alongside the deploy that used it.

  Prices round *up* to the whole baht. Once the displayed figure is ours rather than a copy of the
  source's, satang read as a machine's output rather than a price somebody set, and rounding up
  rather than to the nearest keeps every price at or above what it converts to. The most it moves
  any price is ฿1. That is the whole of the rounding policy: no charm pricing, nothing nudged to
  ฿599, because moving a price by ฿9 is a margin decision and does not belong inside a currency
  conversion.
*/

/** ECB reference rate for USD/THB on 2026-08-25, the date the catalogue was harvested.
 *  Changing this re-prices the catalogue, so it changes only when the catalogue is re-harvested —
 *  and then it wants the market rate for the new harvest date, not the rate the prices imply. */
const HARVEST_MARKET_RATE = 32.735;

/** Today's market rate, from `reference/fx.mjs`. */
const RATE = fx.rate;

const DRIFT = RATE / HARVEST_MARKET_RATE;

/** A harvested THB price, restated at today's rate and rounded up to the whole baht. */
export function adjust(thb: number): number {
  return Math.ceil(thb * DRIFT);
}
