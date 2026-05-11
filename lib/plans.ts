export type PlanId = "free" | "basic" | "pro";

export interface Plan {
  id:           PlanId;
  name:         string;
  price:        number;
  annualPrice:  number;
  proposals:    number;
  credits:      number;   // kept for billing backward compat; 0 on new plans
  users:        number;
  highlighted?: boolean;
  features:     string[];
}

export const PLANS: Plan[] = [
  {
    id:          "free",
    name:        "Free",
    price:       0,
    annualPrice: 0,
    proposals:   2,
    credits:     0,
    users:       1,
    features: [
      "2 proposals per month",
      "Interactive preview",
      "Email support",
    ],
  },
  {
    id:          "pro",
    name:        "Pro",
    price:       3000,
    annualPrice: 2500,
    proposals:   30,
    credits:     0,
    users:       1,
    highlighted: true,
    features: [
      "30 proposals per month",
      "Full PDF export",
      "GST invoicing",
      "Priority support",
    ],
  },
  // legacy — kept for existing basic subscribers; not shown in new signup UI
  {
    id:          "basic",
    name:        "Basic",
    price:       1999,
    annualPrice: 1666,
    proposals:   12,
    credits:     2000,
    users:       1,
    features: [
      "12 proposals per month",
      "2,000 AI credits",
      "1 user",
      "Email support",
    ],
  },
];

export function getPlan(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export function formatPrice(amount: number): string {
  if (amount === 0) return "Free";
  return `₹${amount.toLocaleString("en-IN")}`;
}
