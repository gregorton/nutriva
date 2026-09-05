<!-- Split out of CLAUDE.md, which has a size budget. Everything here is a rule about the cart, the
     drawer or the checkout surfaces. CLAUDE.md keeps the ones a change elsewhere can break: nothing
     priced crosses the wire, the field names, the order snapshot, and who may reach /checkout. -->

# Cart and checkout

The cart is `localStorage` (`cart/cart-context.tsx`); everything an order needs is Postgres. Four surfaces: the drawer,
`/cart`, `/checkout`, and `/checkout/confirmation/[orderNo]`.

- **Checkout is one page, three numbered sections, one submit** — deliberately not a wizard with the step in the URL the
  way the rest of the site carries state: that would put a name, phone and address in the query string, and so in history
  and in logs.
- **The drawer is the peek; the toast is the receipt.** A card add shows `cart/cart-toast.tsx` — what went in, View cart,
  and Undo, which restores the quantity the line held, so a first add removes it — and leaves the grid alone. The buy box
  and the kit builder open the drawer, where the press is a decision.
- A line whose product has gone out of stock is **kept, greyed and out of the subtotal**; `add()` refuses the slug
  outright.
- Both empty states recommend rather than apologise. **Save for later** moves a line to the saved list — the same list the
  card heart writes to — so it needs an account.
- `checkout/reorder.tsx` re-adds a past order, dropping what is no longer stocked and naming how many; it prints a
  days-supply figure only when every line states a serving count, and **reads no clock**, so it renders on cached pages.
- `checkout/clear-cart.tsx` empties the cart on the confirmation page, **keyed on the order number**, or reopening that
  page from history wipes a cart filled since.
- Fees, the free-delivery threshold, the 15:00 Bangkok cutoff and the VAT line are business inputs in `lib/delivery.ts`.
  Prices include VAT, so nothing is added on top, and `/admin/orders` reports **ordered** value, not paid.
- `lib/payment.ts` describes methods as data, as `lib/oauth.ts` does providers: bank transfer and PromptPay are absent
  until the client's account details land, and the panel says so. Cash on delivery needs none, so it is on by default and
  `SWA_COD=off` withdraws it. **There are no card fields anywhere.**
