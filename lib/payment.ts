import "server-only";
/*
  Payment methods, described as data.

  The same shape lib/oauth.ts uses for sign-in providers, and for the same reason: a method whose
  details are not configured does not appear, so nothing on the page claims the shop accepts
  something it cannot take. Adding the client's real bank account is an env edit, not a code change.

  There are no card fields anywhere in this checkout. Nothing behind this site can process a card,
  and a form that takes a card number and does nothing with it is worse than not offering one.

  Cash on delivery is the exception to the configuration rule: it needs no account details, so it
  is available by default and is what keeps the checkout completable while the bank details are
  outstanding. It is a business decision, not a technical one — set SWA_COD=off to withdraw it.
*/

export type PaymentKind = "transfer" | "promptpay" | "cod";

export type PaymentMethod = {
  id: PaymentKind;
  label: string;
  /** One line under the label in the checkout tile. */
  blurb: string;
  /** What the confirmation page tells them to do next. */
  next: string;
  /** Account details to display, empty for methods that need none. */
  details: { term: string; value: string }[];
};

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

/**
 * The methods this deployment can actually take, in the order they are offered.
 * Read per call rather than cached at module load, so a changed env needs no rebuild.
 */
export function paymentMethods(): PaymentMethod[] {
  const methods: PaymentMethod[] = [];

  const bank = env("SWA_BANK_NAME");
  const accountName = env("SWA_BANK_ACCOUNT_NAME");
  const accountNumber = env("SWA_BANK_ACCOUNT_NUMBER");
  if (bank && accountName && accountNumber) {
    methods.push({
      id: "transfer",
      label: "Bank transfer",
      blurb: "Transfer the total, then send us the slip. Dispatched once it clears.",
      next: "Transfer the total to the account below and reply to this order number with the slip. We dispatch as soon as it clears.",
      details: [
        { term: "Bank", value: bank },
        { term: "Account name", value: accountName },
        { term: "Account number", value: accountNumber },
      ],
    });
  }

  const promptpay = env("SWA_PROMPTPAY_ID");
  if (promptpay) {
    methods.push({
      id: "promptpay",
      label: "PromptPay",
      blurb: "Pay from any Thai banking app to the ID below.",
      next: "Pay the total by PromptPay to the ID below, quoting this order number.",
      details: [{ term: "PromptPay ID", value: promptpay }],
    });
  }

  if (env("SWA_COD") !== "off") {
    methods.push({
      id: "cod",
      label: "Cash on delivery",
      blurb: "Pay the courier when the parcel arrives.",
      next: "Have the total ready for the courier. Nothing to pay now.",
      details: [],
    });
  }

  return methods;
}

export function paymentMethod(id: string): PaymentMethod | null {
  return paymentMethods().find((method) => method.id === id) ?? null;
}

/**
 * Whether any bank account is configured at all. The checkout says so plainly when none is, rather
 * than showing an empty panel — the client's details are outstanding, not missing by design.
 */
export function awaitingBankDetails(): boolean {
  return !paymentMethods().some((method) => method.details.length > 0);
}
