import type { Metadata } from "next";
import { CONTACT } from "@/lib/contact";
import { PolicyPage } from "@/components/help/policy-page";

export const metadata: Metadata = {
  title: "Careers",
  description: "Open roles at Slim Wellness Asia, Bangkok.",
};

export default function CareersPage() {
  return (
    <PolicyPage
      kicker="About"
      crumb="About"
      title="Careers"
      lede="A small team in Prawet, Bangkok. There is no application portal — a message with what you do reaches a person."
      sections={[
        {
          heading: "Open roles",
          body: [
            "Nothing posted at the moment. Warehouse, fulfilment and customer-facing roles are the ones that come up most often.",
          ],
        },
        {
          heading: "Getting in touch anyway",
          facts: [
            {
              term: "Email",
              value: (
                <a href={CONTACT.email.href} className="font-medium text-plum-700 hover:underline">
                  {CONTACT.email.address}
                </a>
              ),
            },
            { term: "Address", value: CONTACT.address.full },
            { term: "Office hours", value: CONTACT.hours },
          ],
        },
      ]}
    />
  );
}
