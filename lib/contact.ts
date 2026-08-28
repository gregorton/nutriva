/**
 * Canonical contact information — single source of truth site-wide.
 * Update here and every surface (footer, contact page, structured data) follows.
 */
export const CONTACT = {
  address: {
    line1: "555/20 On-Nuch Rd",
    district: "Prawet",
    city: "Bangkok",
    postcode: "10250",
    country: "Thailand",
    /** Full single-line address as the user requested verbatim. */
    full: "555/20 On-Nuch Rd, Prawet, Bangkok 10250, Thailand",
  },
  phones: {
    tel: {
      label: "Tel",
      display: "+66 (02) 328 6721",
      href: "tel:+6623286721",
      raw: "+66 (02) 328 6721",
    },
    mobile: {
      label: "Mobile",
      display: "+66 (081) 468 2897",
      href: "tel:+66814682897",
      raw: "+66 (081) 468 2897",
    },
  },
  email: {
    address: "info@gyroinst.com",
    href: "mailto:info@gyroinst.com",
  },
  hours: "Mon–Fri 8.00–17.00 (Bangkok time)",
  /** Combined one-liner for structured data / meta. */
  get fullBlock(): string {
    return `${this.address.full}\n\nTel: ${this.phones.tel.display}\n\nMobile: ${this.phones.mobile.display}\n\n${this.email.address} · ${this.hours}`;
  },
} as const;

/** JSON-LD Organization contact for SEO. */
export const CONTACT_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Slim Wellness Asia",
  logo: "/logos/slim-wellness-asia-square.png",
  address: {
    "@type": "PostalAddress",
    streetAddress: CONTACT.address.line1,
    addressLocality: CONTACT.address.city,
    addressRegion: CONTACT.address.district,
    postalCode: CONTACT.address.postcode,
    addressCountry: "TH",
  },
  telephone: [CONTACT.phones.tel.display, CONTACT.phones.mobile.display],
  email: CONTACT.email.address,
  openingHours: "Mo-Fr 08:00-17:00",
  areaServed: "TH",
} as const;
