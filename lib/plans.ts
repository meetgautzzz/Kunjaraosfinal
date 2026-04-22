export type PlanId = "basic" | "pro" | "expert" | "enterprise" | "test";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  annualPrice: number;
  events: number;
  users: number;
  storage: string;
  leads?: number;
  overage: number;
  highlighted?: boolean;
  comingSoon?: boolean;
  dev?: boolean;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    price: 1999,
    annualPrice: 1666,
    events: 10,
    users: 1,
    storage: "5GB",
    overage: 199,
    features: ["10 proposals/month", "1 user", "5GB storage", "PDF export", "Email support"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 3999,
    annualPrice: 3332,
    events: 20,
    users: 1,
    storage: "10GB",
    overage: 199,
    highlighted: true,
    features: ["20 proposals/month", "1 user", "10GB storage", "PDF export", "Priority support"],
  },
  {
    id: "expert",
    name: "Expert",
    comingSoon: true,
    price: 11999,
    annualPrice: 9999,
    events: 20,
    users: 5,
    storage: "50GB",
    overage: 199,
    features: ["20 proposals/month", "5 users", "50GB storage", "PDF export", "Priority support"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    comingSoon: true,
    price: 24999,
    annualPrice: 20832,
    events: 45,
    users: 5,
    storage: "100GB",
    leads: 3,
    overage: 199,
    features: ["45 proposals/month", "5 users", "100GB storage", "3 qualified leads/month", "Dedicated support"],
  },
  {
    id: "test",
    name: "Test",
    dev: true,
    price: 10,
    annualPrice: 10,
    events: 5,
    users: 1,
    storage: "—",
    overage: 0,
    features: ["End-to-end pay flow test", "5 proposal credits", "Not for production use"],
  },
];

export function getPlan(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
