import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart/cart-context";
import { UtilityBar } from "@/components/chrome/utility-bar";
import { SiteHeader } from "@/components/chrome/site-header";
import { CategoryNav } from "@/components/chrome/category-nav";
import { StickyChrome } from "@/components/chrome/sticky-chrome";
import { SiteFooter } from "@/components/chrome/site-footer";
import { CartDrawer } from "@/components/cart/cart-drawer";

// One face for the whole site: headings, body, UI and data. Size, weight and tracking do the
// separating, which is what the `font-display` utility and the `facts` type still hang off.
// Loaded variable, so any weight between 400 and 700 is available without a second request.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: {
    default: "Nutriva — Supplements, tested and traceable",
    template: "%s · Nutriva",
  },
  description:
    "Vitamins, minerals and daily supplements with third-party test results on every label. Free delivery in Thailand over ฿1,200.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white">
        <CartProvider>
          <UtilityBar />
          <StickyChrome>
            <SiteHeader />
            <CategoryNav />
          </StickyChrome>
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
