import type { Metadata } from "next";
import KunjaraLandingPage from "@/components/marketing/KunjaraLandingPage";

export const metadata: Metadata = {
  title: "Kunjara OS™ — Events run intelligently.",
  description: "India's first AI-powered event operating system. Client-ready proposals in 5–10 minutes. GST-compliant. Made in Bharat.",
};

export default function HomePage() {
  return <KunjaraLandingPage />;
}
