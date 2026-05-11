"use client";

type ApprovalStatus = "pending" | "approved" | "changes_requested" | "rejected";

type SectionApproval = { status: ApprovalStatus };

const CONFIG: Record<ApprovalStatus, { color: string; icon: string }> = {
  pending:           { color: "#6b7280", icon: "○" },
  approved:          { color: "#34d399", icon: "✓" },
  changes_requested: { color: "#fbbf24", icon: "✎" },
  rejected:          { color: "#f87171", icon: "✕" },
};

export default function SectionApprovalBadge({
  sectionApprovals,
  section,
}: {
  sectionApprovals: Record<string, unknown>;
  section: string;
}) {
  const ap = sectionApprovals[section] as SectionApproval | undefined;
  if (!ap || ap.status === "pending") return null;
  const { color, icon } = CONFIG[ap.status];
  return (
    <span style={{ fontSize: 10, color, marginLeft: 4, flexShrink: 0 }} title={ap.status.replace("_", " ")}>
      {icon}
    </span>
  );
}
