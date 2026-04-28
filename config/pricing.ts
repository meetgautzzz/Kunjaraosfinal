// Canonical pricing config — single source of truth.
// lib/plans.ts and lib/creditPacks.ts mirror these values for runtime use.
// Update here first; then sync the two lib files.

export const PLANS = {
  basic: {
    name:      "Basic",
    price:     1999,
    proposals: 12,
    credits:   2000,
    users:     1,
  },
  pro: {
    name:      "Pro",
    price:     3999,
    proposals: 30,
    credits:   6000,
    users:     1,
  },
} as const;

export const CREDIT_PACKS = [
  { price: 499,  credits: 500  },
  { price: 999,  credits: 1200 },
  { price: 1999, credits: 3000 },
] as const;
