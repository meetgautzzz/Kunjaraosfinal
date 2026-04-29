export type PlanId = "basic" | "pro";

export interface Plan {
  id:           PlanId;
  name:         string;
  price:        number;
  annualPrice:  number;
  proposals:    number;
  credits:      number;
  users:        number;
  highlighted?: boolean;
  features:     string[];
}

export const PLANS: Plan[] = [
  {
    id:           "basic",
    name:         "Basic",
    price:        1999,
    annualPrice:  1666,
    proposals:    12,
    credits:      2000,
    users:        1,
    features: [
      "12 client-winning proposals",
      "2,000 AI credits · 🎉 Launch offer",
      "1 user",
      "PDF export",
      "Email support",
    ],
  },
  {
    id:           "pro",
    name:         "Pro",
    price:        3999,
    annualPrice:  3332,
    proposals:    30,
    credits:      6000,
    users:        1,
    highlighted:  true,
    features: [
      "30 client-winning proposals",
      "6,000 AI credits · 🎉 2X launch offer",
      "Advanced AI quality",
      "1 user",
      "PDF export",
      "Priority support",
    ],
  },
];

export function getPlan(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
