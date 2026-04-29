import "server-only";
import { getAdminClient } from "@/lib/supabase/admin";

export type ProposalExample = {
  eventType:    string;
  budget:       number;
  location:     string;
  concept:      unknown;
  eventConcept: unknown;
  budgetBreakdown: unknown;
  tips:         unknown;
};

function budgetBucket(budget: number): string {
  if (budget < 500_000)   return "under_5L";
  if (budget < 1_500_000) return "5L_to_15L";
  if (budget < 5_000_000) return "15L_to_50L";
  return "over_50L";
}

// Returns up to 2 approved examples matching event type + budget range.
// Best-effort — never throws, returns [] on any failure.
export async function fetchExamples(
  eventType: string,
  budget: number
): Promise<ProposalExample[]> {
  const admin = getAdminClient();
  if (!admin) return [];

  try {
    const { data, error } = await admin
      .from("proposal_examples")
      .select("original_brief, generated_output")
      .eq("event_type", eventType.toLowerCase().trim())
      .eq("budget_bucket", budgetBucket(budget))
      .order("created_at", { ascending: false })
      .limit(2);

    if (error || !data?.length) return [];

    return data.map((row) => {
      const brief  = (row.original_brief   as Record<string, unknown>) ?? {};
      const output = (row.generated_output as Record<string, unknown>) ?? {};
      return {
        eventType:       (brief.eventType  as string) ?? eventType,
        budget:          (brief.budget     as number) ?? budget,
        location:        (brief.location   as string) ?? "",
        concept:         output.concept,
        eventConcept:    output.eventConcept,
        budgetBreakdown: output.budgetBreakdown,
        tips:            output.tips,
      };
    });
  } catch {
    return [];
  }
}

// Promotes an approved proposal to the examples pool.
// Strips client PII (name, contact) from the brief before storing.
// Fire-and-forget — callers should .catch(() => {}) and not await.
export async function saveExample(args: {
  eventType:       string;
  budget:          number;
  location:        string;
  originalBrief:   Record<string, unknown>;
  generatedOutput: Record<string, unknown>;
}): Promise<void> {
  const admin = getAdminClient();
  if (!admin) return;

  // Strip PII from brief before storing
  const { clientName, clientCompanyName, ...anonBrief } = args.originalBrief as any;
  void clientName; void clientCompanyName;

  try {
    await admin.from("proposal_examples").insert({
      event_type:       args.eventType.toLowerCase().trim(),
      budget_bucket:    budgetBucket(args.budget),
      location:         args.location,
      original_brief:   anonBrief,
      generated_output: {
        concept:            args.generatedOutput.concept,
        eventConcept:       args.generatedOutput.eventConcept,
        budgetBreakdown:    args.generatedOutput.budgetBreakdown,
        visualDirection:    args.generatedOutput.visualDirection,
        stageDesign:        args.generatedOutput.stageDesign,
        decorPlan:          args.generatedOutput.decorPlan,
        experienceElements: args.generatedOutput.experienceElements,
        timeline:           args.generatedOutput.timeline,
        vendors:            args.generatedOutput.vendors,
        riskFlags:          args.generatedOutput.riskFlags,
        tips:               args.generatedOutput.tips,
      },
    });
  } catch (err) {
    console.error("[examples] saveExample failed:", err);
  }
}
