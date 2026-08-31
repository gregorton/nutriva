import type { Metadata } from "next";
import { CONTACT } from "@/lib/contact";
import { PolicyPage } from "@/components/help/policy-page";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What this site stores, where, and what it deliberately does not collect.",
};

export default function PrivacyPage() {
  return (
    <PolicyPage
      kicker="Legal"
      crumb="Legal"
      title="Privacy"
      lede="Written from what the code does rather than from a template. Each item below corresponds to a table or a browser store you can point at."
      sections={[
        {
          heading: "What is stored about you",
          facts: [
            { term: "Account", value: "Email address, display name, and a hash of your password. Never the password." },
            { term: "Session", value: "A cookie holding 32 random bytes. The database stores only their SHA-256, so a dumped row cannot be replayed." },
            { term: "Reviews", value: "Your rating and text, attributed to your display name, not your email." },
            { term: "Saved items", value: "Product slugs against your account." },
            { term: "Orders", value: "Delivery name, address, phone, email, and what was bought. Kept because an order is a record." },
            { term: "Email requests", value: "The address you type into a restock form, and which product it was about." },
          ],
        },
        {
          heading: "What is not collected",
          body: [
            "There is no analytics vendor on this site and no tracking script from anyone. Our own counters record how many times a product or page was opened on a given day in Bangkok, as an integer per thing per day. They carry no visitor identifier, no cookie, no IP address and no per-event row, so they can answer how many and never who.",
            "Search terms typed into the suggestion panel are not recorded at all: those responses are served from a CDN cache and never reach our server. A search is counted only when you submit it and land on the results page, and only the term and the number of matches are stored.",
            "People on the internal allowlist are excluded from every counter, so the figures are not inflated by the people building the shop.",
          ],
        },
        {
          heading: "What stays in your browser",
          body: [
            "Your cart, your recently viewed products and your compare selection live in this browser's local storage and are never sent to us. Clearing site data clears them.",
          ],
        },
        {
          heading: "Third parties",
          body: [
            "Signing in with Google or Facebook sends you to that provider and back; we receive the identity they return and nothing else, and accounts are linked only on an email address the provider has verified. Product photography is served from this domain. Nothing else on the page loads from a third party.",
          ],
        },
        {
          heading: "Asking for a copy, or deletion",
          body: [
            <>
              Email{" "}
              <a href={CONTACT.email.href} className="font-medium text-plum-700 hover:underline">
                {CONTACT.email.address}
              </a>{" "}
              from the address on the account. Orders are kept as commercial records; everything
              else can go.
            </>,
          ],
        },
      ]}
      footnote="This describes the site's actual behaviour and has not been reviewed by a lawyer against Thailand's PDPA. That review should happen before launch."
    />
  );
}
