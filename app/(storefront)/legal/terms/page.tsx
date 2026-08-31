import type { Metadata } from "next";
import { CONTACT } from "@/lib/contact";
import { RETURNS_DAYS } from "@/lib/delivery";
import { PolicyPage } from "@/components/help/policy-page";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms an order on this site is placed under.",
};

export default function TermsPage() {
  return (
    <PolicyPage
      kicker="Legal"
      crumb="Legal"
      title="Terms"
      lede="Slim Wellness Asia Co., Ltd., a retailer in Bangkok, selling within Thailand."
      sections={[
        {
          heading: "Orders",
          body: [
            "An order is an offer to buy. It is accepted when we confirm it, and we can decline one, most often because stock ran out between the page loading and the order arriving. Prices and stock shown are those at the time the page was built, and both are re-checked on the server when you check out.",
            "Prices are in Thai baht and include VAT. Delivery is added at checkout according to the method chosen.",
          ],
        },
        {
          heading: "Returns",
          body: [
            <>
              <span data-num>{RETURNS_DAYS}</span> days from delivery, opened bottles included, as
              set out on the returns page. That is in addition to your rights under Thai consumer
              law, not instead of them.
            </>,
          ],
        },
        {
          heading: "What the product pages are",
          body: [
            "Label copy, supplement-facts panels, certifications and pack data are reproduced from the manufacturer's label and listing. They describe the product. They are not health advice and not a claim that anything treats, prevents or cures a condition.",
            "Reference intakes quoted in the guides are population figures and are named as such. If you take medication or are pregnant, the conversation is with a pharmacist or doctor before it is a shopping decision.",
          ],
        },
        {
          heading: "Accounts",
          body: [
            "You are responsible for what happens under your account. Repeated failed sign-ins lock it for a while, which is a security measure and not a penalty.",
          ],
        },
        {
          heading: "Contact",
          facts: [
            { term: "Company", value: "Slim Wellness Asia Co., Ltd." },
            { term: "Address", value: CONTACT.address.full },
            {
              term: "Email",
              value: (
                <a href={CONTACT.email.href} className="font-medium text-plum-700 hover:underline">
                  {CONTACT.email.address}
                </a>
              ),
            },
            { term: "Governing law", value: "Thailand" },
          ],
        },
      ]}
      footnote="Drafted to match how the site actually works. It needs a lawyer's pass before launch."
    />
  );
}
