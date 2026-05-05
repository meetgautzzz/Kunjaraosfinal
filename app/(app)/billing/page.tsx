import { redirect } from "next/navigation";

// Billing is now part of Settings → Billing tab.
export default function BillingRedirect() {
  redirect("/settings?tab=billing");
}
