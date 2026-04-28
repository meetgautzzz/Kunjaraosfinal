export const GST_RATES = [0, 5, 12, 18, 28] as const;
export type GSTRate = (typeof GST_RATES)[number];

export const CATEGORIES = [
  "Venue", "Catering", "AV & Technology", "Décor & Design",
  "Entertainment", "Photography", "Logistics", "Marketing",
  "Staffing", "Security", "Miscellaneous",
] as const;

export type BudgetItem = {
  id:          string;
  category:    string;
  description: string;
  unit:        string;
  quantity:    number;
  unitCost:    number;
  gstRate:     GSTRate;
  margin:      number;   // percentage
  visible:     boolean;  // shown in client view
};

export type BudgetMeta = {
  title:          string;
  clientName:     string;
  eventType:      string;
  currency:       string;
  globalMargin:   number;   // override per-item margin if > 0
  hideClientCosts:boolean;  // master hide toggle for client view
};

export type ItemCalc = {
  baseCost:       number;   // qty × unitCost
  marginAmount:   number;   // baseCost × margin%
  costWithMargin: number;   // baseCost + marginAmount
  gstAmount:      number;   // costWithMargin × gstRate%
  total:          number;   // costWithMargin + gstAmount
};

export type BudgetTotals = {
  subtotal:      number;   // sum of baseCosts
  totalMargin:   number;   // sum of marginAmounts
  gstBreakdown:  Record<number, number>;  // rate → amount
  totalGST:      number;
  grandTotal:    number;
  clientTotal:   number;   // grandTotal (what client sees)
  marginPercent: number;   // effective overall margin %
};

export function calcItem(item: BudgetItem, globalMargin: number): ItemCalc {
  const margin    = globalMargin > 0 ? globalMargin : item.margin;
  const baseCost  = item.quantity * item.unitCost;
  const marginAmt = baseCost * (margin / 100);
  const withMargin= baseCost + marginAmt;
  const gstAmt    = withMargin * (item.gstRate / 100);
  return {
    baseCost,
    marginAmount:   marginAmt,
    costWithMargin: withMargin,
    gstAmount:      gstAmt,
    total:          withMargin + gstAmt,
  };
}

export function calcTotals(items: BudgetItem[], meta: BudgetMeta): BudgetTotals {
  const gstBreakdown: Record<number, number> = {};

  let subtotal    = 0;
  let totalMargin = 0;
  let totalGST    = 0;
  let grandTotal  = 0;

  for (const item of items) {
    const c = calcItem(item, meta.globalMargin);
    subtotal    += c.baseCost;
    totalMargin += c.marginAmount;
    totalGST    += c.gstAmount;
    grandTotal  += c.total;

    gstBreakdown[item.gstRate] = (gstBreakdown[item.gstRate] ?? 0) + c.gstAmount;
  }

  return {
    subtotal,
    totalMargin,
    gstBreakdown,
    totalGST,
    grandTotal,
    clientTotal:   grandTotal,
    marginPercent: subtotal > 0 ? (totalMargin / subtotal) * 100 : 0,
  };
}

export function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n);
}

export function newItem(overrides: Partial<BudgetItem> = {}): BudgetItem {
  return {
    id:          crypto.randomUUID(),
    category:    "Venue",
    description: "",
    unit:        "Lump Sum",
    quantity:    1,
    unitCost:    0,
    gstRate:     18,
    margin:      15,
    visible:     true,
    ...overrides,
  };
}

export const DEFAULT_META: BudgetMeta = {
  title:          "Event Budget",
  clientName:     "",
  eventType:      "",
  currency:       "INR",
  globalMargin:   0,
  hideClientCosts:false,
};

