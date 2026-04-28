"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ProposalOutput from "@/components/proposals/ProposalOutput";
import IdeaCards from "@/components/proposals/IdeaCards";
import { api } from "@/lib/api";
import type { ProposalData, EventIdea } from "@/lib/proposals";
import { useCredits } from "@/components/credits/useCredits";

const EVENT_TYPES = [
  "Corporate Gala",   "Conference",      "Product Launch",  "Wedding",
  "Brand Activation", "Awards Night",    "Team Retreat",    "Exhibition",
  "Fundraiser",       "Concert",         "Sports Event",    "Workshop",
];

type FormState = {
  eventType:    string;
  // Client info
  clientName:   string;
  companyName:  string;
  mobile:       string;
  email:        string;
  address:      string;
  // Event details
  budget:       string;
  location:     string;
  guestCount:   string;
  eventDate:    string;
  // Booking toggles — "yes" means client has booked it themselves,
  // so AI should leave it alone. "no" means AI should plan it.
  venueByClient: "yes" | "no";
  foodByClient:  "yes" | "no";
  // Vision
  requirements: string;
};

type Step = "form" | "generating-ideas" | "ideas" | "generating-plan" | "generating-plans" | "output";

const STEP_META = ["Define Event", "Choose Concept", "Full Plan"] as const;

export default function NewProposalPage() {
  const router = useRouter();
  const credits = useCredits();

  const [step,         setStep]         = useState<Step>("form");
  const [proposal,     setProposal]     = useState<ProposalData | null>(null);
  const [eventIdeas,   setEventIdeas]   = useState<EventIdea[]>([]);
  const [proposalId,   setProposalId]   = useState<string>("");
  const [selectedIdea, setSelectedIdea] = useState<EventIdea | null>(null);
  const [error,        setError]        = useState("");
  const [batchProgress, setBatchProgress] = useState<(0 | 1 | 2)[]>([]); // index of completed proposals in batch

  // If the API returns LIMIT_REACHED, surface the buy modal instead of a
  // dead error banner. lib/api throws Error(err.error), so the code lands
  // in err.message. Backend envelope: { success:false, error:"LIMIT_REACHED" }.
  function maybeOpenBuyModal(err: any): boolean {
    const msg = (err?.message || err?.error || "").toString();
    if (msg === "LIMIT_REACHED" || err?.limit_reached === true) {
      credits.openBuyModal();
      credits.refresh();
      return true;
    }
    return false;
  }

  const [form, setForm] = useState<FormState>({
    eventType: "",
    clientName: "", companyName: "", mobile: "", email: "", address: "",
    budget: "", location: "", guestCount: "", eventDate: "",
    venueByClient: "yes", foodByClient: "yes",
    requirements: "",
  });

  function setField<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const currentStepIndex =
    step === "form" || step === "generating-ideas" ? 0 :
    step === "ideas" || step === "generating-plan" ? 1 : 2;

  async function handleGenerateIdeas(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStep("generating-ideas");
    try {
      const result = await api.proposals.generateIdeas({
        eventType:    form.eventType,
        budget:       Number(form.budget),
        location:     form.location,
        requirements: form.requirements,
        ...(form.guestCount ? { guestCount: Number(form.guestCount) } : {}),
        ...(form.companyName ? { companyName: form.companyName } : {}),
        ...(form.eventDate   ? { eventDate:   form.eventDate   } : {}),
        venueByClient: form.venueByClient === "yes",
        foodByClient:  form.foodByClient  === "yes",
      }) as { proposalId: string; ideas: EventIdea[]; data?: { proposalId: string; ideas: EventIdea[] } };
      // Routes now return aiSuccess envelope { success, data, credits_remaining };
      // older callers still see the flat shape. Handle both.
      const payload = (result as any).data ?? result;
      setProposalId(payload.proposalId);
      setEventIdeas(payload.ideas);
      if (typeof (result as any).credits_remaining === "number") {
        credits.setRemaining((result as any).credits_remaining);
      }
      setStep("ideas");
    } catch (err: any) {
      if (maybeOpenBuyModal(err)) {
        setStep("form");
        return;
      }
      setError(err.message ?? "Something went wrong. Please try again.");
      setStep("form");
    }
  }

  async function handleGenerateAll() {
    setError("");
    setBatchProgress([]);
    setStep("generating-plans");
    const batchId = crypto.randomUUID();

    const clientInfo = {
      ...(form.clientName  ? { name:        form.clientName  } : {}),
      ...(form.companyName ? { companyName: form.companyName } : {}),
      ...(form.mobile      ? { mobile:      form.mobile      } : {}),
      ...(form.email       ? { email:       form.email       } : {}),
      ...(form.address     ? { address:     form.address     } : {}),
    };

    const baseParams = {
      eventType:    form.eventType,
      budget:       Number(form.budget),
      location:     form.location,
      requirements: form.requirements,
      ...(form.guestCount ? { guestCount: Number(form.guestCount) } : {}),
      ...(form.eventDate  ? { eventDate:  form.eventDate  } : {}),
      ...(Object.keys(clientInfo).length ? { client: clientInfo } : {}),
      venueByClient: form.venueByClient === "yes",
      foodByClient:  form.foodByClient  === "yes",
      batchId,
    };

    const settled = await Promise.allSettled(
      eventIdeas.map((idea, index) =>
        api.proposals.generateExperience({
          ...baseParams,
          proposalId:  crypto.randomUUID(),
          selectedIdea: idea,
          batchIndex:  index,
        }).then((res) => {
          setBatchProgress((prev) => [...prev, index as 0|1|2]);
          if (typeof (res as any).credits_remaining === "number") {
            credits.setRemaining((res as any).credits_remaining);
          }
          return res;
        })
      )
    );

    const successes = settled.filter((r) => r.status === "fulfilled");
    if (successes.length === 0) {
      const firstErr = settled.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
      if (firstErr && maybeOpenBuyModal(firstErr.reason)) {
        setStep("ideas");
        return;
      }
      setError("All proposals failed to generate. Please try again.");
      setStep("ideas");
      return;
    }

    router.push(`/proposals/batch/${batchId}`);
  }

  async function handleSelectIdea(idea: EventIdea) {
    setSelectedIdea(idea);
    setError("");
    setStep("generating-plan");
    try {
      const clientInfo = {
        ...(form.clientName  ? { name:        form.clientName  } : {}),
        ...(form.companyName ? { companyName: form.companyName } : {}),
        ...(form.mobile      ? { mobile:      form.mobile      } : {}),
        ...(form.email       ? { email:       form.email       } : {}),
        ...(form.address     ? { address:     form.address     } : {}),
      };

      const result = await api.proposals.generateExperience({
        proposalId:   proposalId,
        selectedIdea: idea,
        eventType:    form.eventType,
        budget:       Number(form.budget),
        location:     form.location,
        requirements: form.requirements,
        ...(form.guestCount ? { guestCount: Number(form.guestCount) } : {}),
        ...(form.eventDate  ? { eventDate:  form.eventDate  } : {}),
        ...(Object.keys(clientInfo).length ? { client: clientInfo } : {}),
        venueByClient: form.venueByClient === "yes",
        foodByClient:  form.foodByClient  === "yes",
      }) as ProposalData & { credits_remaining?: number; data?: ProposalData };
      const payload = (result as any).data ?? result;
      setProposal({ ...payload, budget: Number(payload.budget), status: payload.status as ProposalData["status"] });
      if (typeof (result as any).credits_remaining === "number") {
        credits.setRemaining((result as any).credits_remaining);
      }
      setStep("output");
    } catch (err: any) {
      if (maybeOpenBuyModal(err)) {
        setStep("ideas");
        return;
      }
      setError(err.message ?? "Something went wrong. Please try again.");
      setStep("ideas");
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (step === "generating-ideas") return <GeneratingScreen phase="ideas" />;
  if (step === "generating-plan")  return <GeneratingScreen phase="plan" idea={selectedIdea} />;
  if (step === "generating-plans") return <GeneratingScreen phase="batch" ideas={eventIdeas} progress={batchProgress} />;

  if (step === "output" && proposal) {
    return (
      <ProposalOutput
        proposal={proposal}
        onChange={setProposal}
        onBack={() => setStep("ideas")}
        onSave={() => router.push("/proposals")}
      />
    );
  }

  // ── Step 2: Choose concept ────────────────────────────────────────────────────
  if (step === "ideas") {
    return (
      <div className="animate-fade-up" style={{ paddingBottom: 48 }}>

        {/* Header */}
        <div
          className="flex items-start justify-between gap-4"
          style={{ marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <p className="eyebrow" style={{ marginBottom: 10 }}>Step 2 of 3</p>
            <h2 className="t-heading">Choose your concept</h2>
            <p className="t-body" style={{ marginTop: 6, maxWidth: 480 }}>
              AI designed 3 distinct concepts for your{" "}
              <span style={{ color: "var(--text-1)", fontWeight: 500 }}>{form.eventType}</span>.
              Pick the one that fits your vision.
            </p>
          </div>
          <button
            onClick={() => setStep("form")}
            className="btn-ghost shrink-0"
            style={{ marginTop: 2 }}
          >
            <svg style={{ width: 12, height: 12 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Edit inputs
          </button>
        </div>

        {error && <ErrorBanner message={error} onDismiss={() => setError("")} />}

        {/* "Generate All 3" CTA — primary batch path */}
        <div
          style={{
            marginBottom: 24,
            padding: "16px 20px",
            borderRadius: 12,
            border: "1px solid rgba(99,102,241,0.25)",
            background: "rgba(99,102,241,0.06)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.55 }}>
            <strong style={{ color: "var(--text-1)" }}>Build all 3 as independent proposals</strong>
            {" "}— each stored separately so you can edit, regenerate, or share them individually. Costs 3 credits.
          </p>
          <button
            onClick={handleGenerateAll}
            className="btn-primary"
            style={{ alignSelf: "flex-start", padding: "10px 20px", fontSize: 13.5 }}
          >
            <SparkIcon />
            Generate All 3 Proposals
          </button>
        </div>

        <p className="t-caption" style={{ marginBottom: 12, color: "var(--text-3)" }}>
          Or expand just one concept:
        </p>

        <IdeaCards ideas={eventIdeas} onSelect={handleSelectIdea} />

        <p className="t-caption text-center" style={{ marginTop: 28 }}>
          Not what you expected?{" "}
          <button
            onClick={() => handleGenerateIdeas({ preventDefault: () => {} } as React.FormEvent)}
            style={{ color: "#a5b4fc", textDecoration: "underline", textUnderlineOffset: "3px", background: "none", border: "none", cursor: "pointer", fontSize: "inherit" }}
          >
            Regenerate ideas
          </button>
        </p>
      </div>
    );
  }

  // ── Step 1: Form ─────────────────────────────────────────────────────────────
  const canSubmit = !!(form.eventType && form.budget && form.location && form.requirements);

  return (
    <div className="animate-fade-up" style={{ maxWidth: 600, margin: "0 auto", paddingBottom: 48 }}>

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 36 }}>
        <div className="flex items-start gap-4" style={{ marginBottom: 24 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "rgba(99,102,241,0.12)",
              border: "1px solid rgba(99,102,241,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            <SparkIcon />
          </div>
          <div>
            <h2 className="t-heading">Event Experience Generator</h2>
            <p className="t-body" style={{ marginTop: 5 }}>
              Describe your event and AI will design 3 scored creative concepts to choose from.
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center" style={{ paddingTop: 4 }}>
          {STEP_META.map((label, i) => {
            const done    = i < currentStepIndex;
            const current = i === currentStepIndex;
            const isLast  = i === STEP_META.length - 1;
            return (
              <div key={label} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 700,
                      flexShrink: 0,
                      transition: "all 0.2s",
                      ...(current
                        ? { background: "var(--accent)", color: "#fff", boxShadow: "0 0 0 4px rgba(99,102,241,0.2)" }
                        : done
                        ? { background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)" }
                        : { background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-3)" }),
                    }}
                  >
                    {done ? "✓" : i + 1}
                  </div>
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      transition: "color 0.2s",
                      color: current ? "var(--text-1)" : done ? "#4ade80" : "var(--text-3)",
                    }}
                  >
                    {label}
                  </span>
                </div>
                {!isLast && (
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      margin: "0 10px",
                      background: done ? "rgba(34,197,94,0.3)" : "var(--border)",
                      transition: "background 0.3s",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && <div style={{ marginBottom: 20 }}><ErrorBanner message={error} onDismiss={() => setError("")} /></div>}

      {/* ── Form ─────────────────────────────────────────────────────────────── */}
      <form onSubmit={handleGenerateIdeas} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Event Type */}
        <FormSection label="Event Type" required>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {EVENT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setField("eventType", t)}
                style={{
                  padding: "7px 13px",
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 500,
                  border: "1px solid",
                  transition: "all 0.12s",
                  cursor: "pointer",
                  ...(form.eventType === t
                    ? { background: "rgba(99,102,241,0.14)", borderColor: "rgba(99,102,241,0.4)", color: "#a5b4fc" }
                    : { background: "transparent", borderColor: "var(--border)", color: "var(--text-2)" }),
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            value={form.eventType}
            onChange={(e) => setField("eventType", e.target.value)}
            placeholder="Or describe a custom event type…"
            className="input"
          />
        </FormSection>

        {/* Client Information */}
        <FormSection label="Client Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Client Name</label>
              <input
                value={form.clientName}
                onChange={(e) => setField("clientName", e.target.value)}
                placeholder="e.g. Ramesh Kapoor"
                className="input"
              />
            </div>
            <div>
              <label className="field-label">Company Name</label>
              <input
                value={form.companyName}
                onChange={(e) => setField("companyName", e.target.value)}
                placeholder="e.g. Kapoor Fintech"
                className="input"
              />
            </div>
            <div>
              <label className="field-label">Mobile Number</label>
              <input
                type="tel"
                value={form.mobile}
                onChange={(e) => setField("mobile", e.target.value)}
                placeholder="+91 98xxx xxxxx"
                className="input"
              />
            </div>
            <div>
              <label className="field-label">Email ID</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="client@company.com"
                className="input"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Address</label>
              <input
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
                placeholder="Street, city, state, PIN"
                className="input"
              />
            </div>
          </div>
        </FormSection>

        {/* Event Details */}
        <FormSection label="Event Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">
                Total Budget (₹) <span style={{ color: "#f87171" }}>*</span>
              </label>
              <input
                type="number"
                value={form.budget}
                onChange={(e) => setField("budget", e.target.value)}
                placeholder="e.g. 2500000"
                required
                min={10000}
                className="input"
              />
              {form.budget && (
                <p style={{ color: "#a5b4fc", fontSize: 12, marginTop: 6, fontWeight: 500 }}>
                  ₹{Number(form.budget).toLocaleString("en-IN")}
                </p>
              )}
            </div>
            <div>
              <label className="field-label">
                Location <span style={{ color: "#f87171" }}>*</span>
              </label>
              <input
                value={form.location}
                onChange={(e) => setField("location", e.target.value)}
                placeholder="e.g. Grand Hyatt, Mumbai"
                required
                className="input"
              />
            </div>
            <div>
              <label className="field-label">Expected Guests</label>
              <input
                type="number"
                value={form.guestCount}
                onChange={(e) => setField("guestCount", e.target.value)}
                placeholder="e.g. 300"
                min={1}
                className="input"
              />
            </div>
            <div>
              <label className="field-label">Date of Event</label>
              <input
                type="date"
                value={form.eventDate}
                onChange={(e) => setField("eventDate", e.target.value)}
                className="input"
              />
            </div>
          </div>
        </FormSection>

        {/* Venue booking toggle */}
        <FormSection label="Venue Booking by Client">
          <p className="t-caption" style={{ marginBottom: 12, lineHeight: 1.65 }}>
            Has the client already booked and paid for the venue? If not, AI will
            suggest a venue and add it to the plan.
          </p>
          <YesNoField
            value={form.venueByClient}
            onChange={(v) => setField("venueByClient", v)}
            yesLabel="Yes, client has booked"
            noLabel="No, suggest + plan it"
          />
        </FormSection>

        {/* F&B toggle */}
        <FormSection label="Food &amp; Beverages by Client">
          <p className="t-caption" style={{ marginBottom: 12, lineHeight: 1.65 }}>
            Has the client arranged their own catering? If not, AI will design
            the F&amp;B plan and suggest vendors.
          </p>
          <YesNoField
            value={form.foodByClient}
            onChange={(v) => setField("foodByClient", v)}
            yesLabel="Yes, client has arranged"
            noLabel="No, suggest + plan it"
          />
        </FormSection>

        {/* Requirements */}
        <FormSection label="Requirements & Vision" required>
          <p className="t-caption" style={{ marginBottom: 10, lineHeight: 1.65 }}>
            Describe the vibe, theme, VIP needs, technical requirements, or anything specific.
            More detail = better concepts.
          </p>
          <textarea
            value={form.requirements}
            onChange={(e) => setField("requirements", e.target.value.slice(0, 2000))}
            placeholder="e.g. Luxury corporate gala for 300 guests. Black-tie dress code. Live band, 3-course dinner, and award ceremony. LED walls, sustainable vendors preferred. Client is a fintech brand — tech-forward aesthetic."
            required
            rows={6}
            maxLength={2000}
            className="input"
            style={{ resize: "none", lineHeight: 1.65 }}
          />
          <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
            <p className="t-caption">Be specific — AI uses this verbatim.</p>
            <p
              className="t-caption t-num"
              style={{ color: form.requirements.length > 1800 ? "var(--amber)" : "var(--text-3)" }}
            >
              {form.requirements.length} / 2000
            </p>
          </div>
        </FormSection>

        {/* Submit */}
        <div style={{ paddingTop: 8 }}>
          <button
            type="submit"
            disabled={!canSubmit}
            className="btn-primary w-full"
            style={{ padding: "13px 20px", fontSize: 14, borderRadius: 11, letterSpacing: "-0.01em" }}
          >
            <SparkIcon />
            Generate 3 Concept Ideas
            <svg style={{ width: 14, height: 14, opacity: 0.7 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
          <p className="t-caption text-center" style={{ marginTop: 10 }}>
            Takes ~15 seconds · Powered by Kunjara Core
          </p>
        </div>

      </form>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function FormSection({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "var(--bg-card)",
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        transition: "border-color 0.15s",
      }}
    >
      <div>
        <p className="field-label" style={{ marginBottom: 0 }}>
          {label}
          {required && <span style={{ color: "#f87171", marginLeft: 3 }}>*</span>}
        </p>
      </div>
      {children}
    </div>
  );
}

function YesNoField({
  value, onChange, yesLabel, noLabel,
}: {
  value: "yes" | "no";
  onChange: (v: "yes" | "no") => void;
  yesLabel: string;
  noLabel:  string;
}) {
  const baseStyle: React.CSSProperties = {
    flex: 1,
    padding: "11px 14px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 500,
    border: "1px solid",
    transition: "all 0.12s",
    cursor: "pointer",
    textAlign: "center",
  };
  const activeStyle: React.CSSProperties = {
    background: "rgba(99,102,241,0.14)",
    borderColor: "rgba(99,102,241,0.4)",
    color: "#a5b4fc",
  };
  const idleStyle: React.CSSProperties = {
    background: "transparent",
    borderColor: "var(--border)",
    color: "var(--text-2)",
  };
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <button
        type="button"
        onClick={() => onChange("yes")}
        style={{ ...baseStyle, ...(value === "yes" ? activeStyle : idleStyle) }}
      >
        {yesLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange("no")}
        style={{ ...baseStyle, ...(value === "no" ? activeStyle : idleStyle) }}
      >
        {noLabel}
      </button>
    </div>
  );
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      className="flex items-center justify-between gap-4"
      style={{
        padding: "12px 16px",
        borderRadius: 10,
        background: "var(--red-dim)",
        border: "1px solid rgba(239,68,68,0.2)",
        color: "#fca5a5",
        fontSize: 13.5,
        marginBottom: 12,
      }}
    >
      <span>{message}</span>
      <button
        onClick={onDismiss}
        style={{ color: "rgba(252,165,165,0.6)", fontSize: 11, background: "none", border: "none", cursor: "pointer" }}
      >
        ✕
      </button>
    </div>
  );
}

// ── Generating screen ─────────────────────────────────────────────────────────
function GeneratingScreen({
  phase, idea, ideas, progress,
}: {
  phase:    "ideas" | "plan" | "batch";
  idea?:    EventIdea | null;
  ideas?:   EventIdea[];
  progress?: (0 | 1 | 2)[];
}) {
  const isIdeas = phase === "ideas";
  const isBatch = phase === "batch";

  const steps = isIdeas
    ? ["Analysing brief & budget", "Designing 3 distinct concepts", "Scoring each concept", "Finalising wow factors"]
    : isBatch
    ? ["Expanding all 3 concepts in parallel", "Crafting budget breakdowns", "Building timelines & activations", "Finalising visual directions", "Saving all 3 proposals"]
    : ["Expanding selected concept", "Crafting budget breakdown", "Building execution timeline", "Designing visual direction", "Planning experience activations"];

  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((s) => Math.min(s + 1, steps.length - 1));
    }, isIdeas ? 2800 : 3500);
    return () => clearInterval(interval);
  }, [steps.length, isIdeas]);

  return (
    <div
      className="flex flex-col items-center justify-center animate-fade-in"
      style={{ minHeight: "65vh", gap: 36 }}
    >
      {/* Spinner */}
      <div style={{ position: "relative", width: 72, height: 72 }}>
        <div
          className="animate-ping"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid rgba(99,102,241,0.12)",
          }}
        />
        <div
          className="animate-pulse"
          style={{
            position: "absolute",
            inset: 8,
            borderRadius: "50%",
            border: "1px solid rgba(99,102,241,0.2)",
            animationDuration: "2s",
          }}
        />
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SparkIcon large />
        </div>
      </div>

      {/* Batch progress indicators */}
      {isBatch && ideas && (
        <div style={{ display: "flex", gap: 10 }}>
          {ideas.map((idea, i) => {
            const done = (progress ?? []).includes(i as 0|1|2);
            return (
              <div
                key={idea.id}
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: `1px solid ${done ? "rgba(34,197,94,0.35)" : "rgba(99,102,241,0.22)"}`,
                  background: done ? "rgba(34,197,94,0.08)" : "rgba(99,102,241,0.08)",
                  color: done ? "#4ade80" : "#a5b4fc",
                  fontSize: 12.5,
                  fontWeight: 500,
                  maxWidth: 160,
                  textAlign: "center",
                  transition: "all 0.4s",
                }}
              >
                {done ? "✓ " : ""}{idea.title}
              </div>
            );
          })}
        </div>
      )}

      {/* Selected idea badge (single proposal) */}
      {idea && !isIdeas && !isBatch && (
        <div
          style={{
            padding: "9px 18px",
            borderRadius: 10,
            border: "1px solid rgba(99,102,241,0.22)",
            background: "rgba(99,102,241,0.08)",
            color: "#a5b4fc",
            fontSize: 13.5,
            fontWeight: 500,
            textAlign: "center",
            maxWidth: 360,
          }}
        >
          Building: {idea.title}
        </div>
      )}

      {/* Title */}
      <div className="text-center" style={{ maxWidth: 400 }}>
        <p className="t-heading" style={{ marginBottom: 8 }}>
          {isIdeas ? "Crafting your concepts…" : isBatch ? "Building all 3 proposals…" : "Building the full experience plan…"}
        </p>
        <p className="t-body">
          {isIdeas
            ? "Kunjara Core is designing 3 unique, scored event concepts"
            : isBatch
            ? "Generating 3 independent proposals simultaneously — each with its own concept, budget & timeline"
            : "Generating concept · budget · timeline · visuals · activations"}
        </p>
      </div>

      {/* Animated step list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 300 }}>
        {steps.map((label, i) => {
          const done    = i < activeStep;
          const current = i === activeStep;
          return (
            <div
              key={label}
              className="flex items-center gap-3 transition-all duration-500"
              style={{
                fontSize: 13.5,
                opacity: done ? 0.35 : current ? 1 : 0.2,
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  flexShrink: 0,
                  transition: "all 0.3s",
                  ...(done
                    ? { background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)" }
                    : current
                    ? { background: "var(--accent)", color: "#fff", boxShadow: "0 0 0 3px rgba(99,102,241,0.2)" }
                    : { background: "var(--border)", color: "var(--text-3)" }),
                }}
              >
                {done ? "✓" : i + 1}
              </span>
              <span style={{ color: current ? "var(--text-1)" : "var(--text-2)", fontWeight: current ? 500 : 400 }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SparkIcon({ large }: { large?: boolean }) {
  return (
    <svg
      style={{ width: large ? 28 : 15, height: large ? 28 : 15, color: large ? "#a5b4fc" : "currentColor" }}
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
    </svg>
  );
}
