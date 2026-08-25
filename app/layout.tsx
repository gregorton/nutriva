import type { Metadata } from "next";
import { Fraunces, Google_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart/cart-context";
import { UtilityBar } from "@/components/chrome/utility-bar";
import { SiteHeader } from "@/components/chrome/site-header";
import { CategoryNav } from "@/components/chrome/category-nav";
import { SiteFooter } from "@/components/chrome/site-footer";
import { CartDrawer } from "@/components/cart/cart-drawer";

// Display: soft-serif with a slight flare, set at low optical size for headings only.
// Loaded as a variable font so SOFT/WONK axes are available; weight stays fluid.
const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "WONK"],
});

// Body, UI and data all set in Google Sans. One sans doing every job: size, weight and
// tracking separate a spec row from a paragraph, so no second face is needed. It also
// carries a Thai subset for when the UI is localised.
const sans = Google_Sans({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
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
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white">
        <CartProvider>
          <UtilityBar />
          <SiteHeader />
          <CategoryNav />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
