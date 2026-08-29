import { CartProvider } from "@/components/cart/cart-context";
import { SessionSync } from "@/components/account/session-sync";
import { UtilityBar } from "@/components/chrome/utility-bar";
import { SiteHeader } from "@/components/chrome/site-header";
import { CategoryNav } from "@/components/chrome/category-nav";
import { StickyChrome } from "@/components/chrome/sticky-chrome";
import { SiteFooter } from "@/components/chrome/site-footer";
import { CartDrawer } from "@/components/cart/cart-drawer";

/*
  The storefront's chrome, in one place.

  This used to be the root layout's body, which meant every route in the app wore it — including
  /admin, which is not a shop. The storefront now lives in the `(storefront)` route group and this
  is that layout's entire content, while /admin sits beside the group with only the document above
  it.

  Two callers, deliberately: `app/(storefront)/layout.tsx` and `app/not-found.tsx`. The root
  not-found catches every unmatched URL and cannot live inside a route group, so it composes this
  shell rather than keeping a second copy of the chrome — somebody who mistypes a URL still gets
  the shop, and there is still only one place the chrome is assembled.

  Nothing here renders a wrapper element. `body` is the flex column, so UtilityBar, StickyChrome,
  main, SiteFooter and CartDrawer remain its direct children and the sticky-footer behaviour is
  untouched; CartProvider is a context and emits no DOM.
*/
export function StorefrontShell({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <SessionSync />
      <UtilityBar />
      <StickyChrome>
        <SiteHeader />
        <CategoryNav />
      </StickyChrome>
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <CartDrawer />
    </CartProvider>
  );
}
