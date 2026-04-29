import { redirect } from "next/navigation";

export default function ProposalEditRedirect({ params }: { params: { id: string } }) {
  redirect(`/proposals/${params.id}`);
}
