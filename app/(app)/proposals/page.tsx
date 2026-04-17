import ProposalGenerator from "./ProposalGenerator";

export default function ProposalsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Proposals</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Generate AI-powered event proposals instantly.
        </p>
      </div>
      <ProposalGenerator />
    </div>
  );
}
