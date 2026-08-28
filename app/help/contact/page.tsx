import type { Metadata } from "next";
import { CONTACT, CONTACT_JSON_LD } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Contact us",
  description: `Contact Slim Wellness Asia at ${CONTACT.address.full}. Tel ${CONTACT.phones.tel.display}, Mobile ${CONTACT.phones.mobile.display}, ${CONTACT.email.address}. ${CONTACT.hours}.`,
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(CONTACT_JSON_LD) }}
      />
      <div className="shell py-10">
        <p className="kicker text-muted">Help · Contact</p>
        <h1 className="mt-2 text-[32px] leading-none tracking-tight">Contact us</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
          We are in Prawet, Bangkok, and answer the phone, the mobile and email during Bangkok
          business hours. For anything about an order you have already placed, the order status
          page is faster.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-[1.15fr_0.85fr]">
          {/* Primary contact card */}
          <div className="rounded-tile border border-line bg-white p-6 shadow-sm sm:p-7">
            <h2 className="text-[18px] font-semibold tracking-tight">Visit or write</h2>
            <address className="mt-3 not-italic text-[15px] leading-relaxed text-ink">
              {CONTACT.address.full}
            </address>

            <div className="mt-6 space-y-4">
              <div className="flex flex-col gap-1 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="facts text-muted">Telephone</span>
                <a
                  href={CONTACT.phones.tel.href}
                  className="text-[15px] font-medium text-ink hover:text-plum-700 hover:underline"
                >
                  Tel: {CONTACT.phones.tel.display}
                </a>
              </div>
              <div className="flex flex-col gap-1 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="facts text-muted">Mobile</span>
                <a
                  href={CONTACT.phones.mobile.href}
                  className="text-[15px] font-medium text-ink hover:text-plum-700 hover:underline"
                >
                  Mobile: {CONTACT.phones.mobile.display}
                </a>
              </div>
              <div className="flex flex-col gap-1 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="facts text-muted">Email</span>
                <a
                  href={CONTACT.email.href}
                  className="text-[15px] font-medium text-ink hover:text-plum-700 hover:underline"
                >
                  {CONTACT.email.address}
                </a>
              </div>
              <div className="flex flex-col gap-1 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="facts text-muted">Hours</span>
                <span className="text-[15px] text-ink">{CONTACT.hours}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <a
                href={CONTACT.email.href}
                className="inline-flex h-10 items-center justify-center rounded-[7px] bg-plum-800 px-5 text-sm font-semibold text-white transition-colors hover:bg-plum-700"
              >
                Email us
              </a>
              <a
                href={CONTACT.phones.tel.href}
                className="inline-flex h-10 items-center justify-center rounded-[7px] border border-line-strong bg-white px-5 text-sm font-semibold text-ink transition-colors hover:border-plum-600 hover:text-plum-700"
              >
                Call {CONTACT.phones.tel.display}
              </a>
            </div>

            {/* Verbatim block as requested — ensures exact string is present on the page */}
            <div className="mt-8 rounded-[7px] bg-paper px-4 py-4 text-sm leading-relaxed text-ink">
              <p className="whitespace-pre-line">
                {CONTACT.address.full}
                {"\n\n"}Tel: {CONTACT.phones.tel.display}
                {"\n\n"}Mobile: {CONTACT.phones.mobile.display}
                {"\n\n"}
                {CONTACT.email.address} · {CONTACT.hours}
              </p>
            </div>
          </div>

          {/* Secondary panel */}
          <div className="space-y-6">
            <div className="rounded-tile border border-line bg-paper p-6">
              <h2 className="kicker text-muted">Before you write</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink">
                <li>
                  <a href="/help/delivery" className="font-medium text-plum-700 hover:underline">
                    Delivery &amp; tracking
                  </a>{" "}
                  has the free-delivery threshold and the Bangkok and upcountry timings.
                </li>
                <li>
                  <a href="/help/returns" className="font-medium text-plum-700 hover:underline">
                    Returns
                  </a>{" "}
                  covers what we accept and how to start one.
                </li>
                <li>
                  Stock is held and packed in Bangkok, and every pack ships sealed with its best-by
                  printed on the label.
                </li>
              </ul>
            </div>

            <div className="rounded-tile border border-line bg-white p-6">
              <h2 className="kicker text-muted">Map</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                555/20 On-Nuch Rd, Prawet, Bangkok 10250, just off On Nut Road. A taxi from On Nut
                BTS takes a few minutes.
              </p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT.address.full)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex h-9 items-center justify-center rounded-[7px] border border-line-strong bg-white px-4 text-sm font-medium text-ink transition-colors hover:border-plum-600 hover:text-plum-700"
              >
                Open in Google Maps →
              </a>
              <div className="mt-4 overflow-hidden rounded-[7px] border border-line bg-paper">
                <iframe
                  title="Map: 555/20 On-Nuch Rd, Prawet, Bangkok"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(CONTACT.address.full)}&z=15&output=embed`}
                  className="h-[240px] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
