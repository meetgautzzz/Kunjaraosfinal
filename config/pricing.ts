// Canonical pricing config — single source of truth (no AI credits).
export const PLANS = {
  free: {
    name:        "Free",
    price:       0,
    annualPrice: 0,
    proposals:   2,
    users:       1,
    highlighted: false,
    features: [
      "2 proposals per month",
      "Interactive preview",
      "Email support",
    ],
  },
  pro: {
    name:        "Pro",
    price:       3000,
    annualPrice: 2500,
    proposals:   30,
    users:       1,
    highlighted: true,
    features: [
      "30 proposals per month",
      "Full PDF export",
      "GST invoicing",
      "Priority support",
    ],
  },
} as const;

export type PlanId = keyof typeof PLANS;
export type Plan   = typeof PLANS[PlanId];

export function getPlan(id: PlanId): Plan { return PLANS[id]; }

export function formatPrice(amount: number): string {
  if (amount === 0) return "Free";
  return amount.toLocaleString("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 });
}

export function getAllPlans(): Plan[] { return Object.values(PLANS); }
