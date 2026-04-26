// Credit-pack catalogue. Webhook validates the paid amount against this
// table — never trusts the client's claimed pack id. Add new packs by
// extending this array; the webhook will accept them automatically.

export type CreditPackId = "small" | "medium" | "large";

export interface CreditPack {
  id:             CreditPackId;
  credits:        number;       // AI credits granted
  amountInr:      number;       // INR rupees (Razorpay charges this exact value)
  amountInPaise:  number;       // pre-computed for Razorpay order creation
  label:          string;
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: "small",  credits: 10,  amountInr: 499,  amountInPaise: 49900,  label: "10 credits"  },
  { id: "medium", credits: 25,  amountInr: 999,  amountInPaise: 99900,  label: "25 credits"  },
  { id: "large",  credits: 60,  amountInr: 1999, amountInPaise: 199900, label: "60 credits"  },
];

export function getCreditPack(id: string): CreditPack | null {
  return CREDIT_PACKS.find((p) => p.id === id) ?? null;
}

// Resolve the pack from the amount Razorpay confirms was paid. We don't
// trust the order notes alone — the amount must match a known pack.
// Razorpay's webhook payload reports amount in paise.
export function resolvePackFromAmount(amountInPaise: number): CreditPack | null {
  return CREDIT_PACKS.find((p) => p.amountInPaise === amountInPaise) ?? null;
}
