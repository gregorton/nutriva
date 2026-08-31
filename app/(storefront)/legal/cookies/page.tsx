import Link from "next/link";
import type { Metadata } from "next";
import { PolicyPage } from "@/components/help/policy-page";

export const metadata: Metadata = {
  title: "Cookies",
  description: "The two cookies this site sets, and why there is no consent banner.",
};

export default function CookiesPage() {
  return (
    <PolicyPage
      kicker="Legal"
      crumb="Legal"
      title="Cookies"
      lede="Two cookies, both strictly necessary, neither used to track you. That is why there is no banner asking about them."
      sections={[
        {
          heading: "The cookies",
          facts: [
            {
              term: "Session",
              value:
                "Set when you sign in. Holds 32 random bytes; the server stores only their hash. httpOnly, SameSite=Lax, and secure in production. Removed when you sign out.",
            },
            {
              term: "OAuth state",
              value:
                "Set for a few minutes while you are away at Google or Facebook, so the reply can be checked against the request that started it. Deleted as soon as you land back.",
            },
          ],
        },
        {
          heading: "Not cookies, but worth naming",
          body: [
            <>
              Your cart, recently viewed products and compare selection are kept in this
              browser&rsquo;s local storage. They are never transmitted. The{" "}
              <Link
                href="/legal/privacy"
                className="font-medium text-plum-700 underline underline-offset-4 hover:text-plum-600"
              >
                privacy page
              </Link>{" "}
              lists everything else the site records.
            </>,
          ],
        },
        {
          heading: "No third-party cookies",
          body: [
            "There is no advertising, no analytics vendor and no embedded widget on this site, so nothing else sets a cookie in your browser from here.",
          ],
        },
      ]}
    />
  );
}
