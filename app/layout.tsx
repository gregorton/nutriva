import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CONTACT_JSON_LD } from "@/lib/contact";

// One face for the whole site: headings, body, UI and data. Size, weight and tracking do the
// separating, which is what the `font-display` utility and the `facts` type still hang off.
// Loaded variable, so any weight between 400 and 700 is available without a second request.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: {
    default: "Slim Wellness Asia · Supplements, shipped from Bangkok",
    template: "%s · Slim Wellness Asia",
  },
  description:
    "Vitamins, minerals and daily supplements, with the label read out in full on every product page. Free delivery in Thailand over ฿1,200.",
};

/*
  The root layout is the document and nothing else: html, body, the one face, the organisation
  JSON-LD.

  Everything that looks like the shop — utility bar, masthead, category nav, footer, cart drawer —
  now lives in `app/(storefront)/layout.tsx` by way of components/chrome/storefront-shell.tsx, so
  /admin can be a surface of its own instead of a dashboard wearing a storefront's masthead. Route
  groups do not appear in URLs, so every route is exactly where it was and the 470 prerendered
  product paths are untouched.

  `body` stays the flex column. The storefront's `main` is `flex-1` inside it, and so is the
  console's ground, which is what lets /admin fill the window with no chrome above or below it.
*/
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(CONTACT_JSON_LD) }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-white">{children}</body>
    </html>
  );
}
