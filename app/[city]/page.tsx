import type { Metadata } from "next";

type Props = {
  params: Promise<{ city: string }>;
};

const CITY_DATA: Record<string, { name: string; state: string; keywords: string[] }> = {
  mumbai:    { name: "Mumbai",    state: "Maharashtra", keywords: ["wedding planner", "corporate events", "conferences"] },
  delhi:     { name: "Delhi",     state: "Delhi",       keywords: ["wedding events", "corporate conferences", "product launches"] },
  bangalore: { name: "Bangalore", state: "Karnataka",   keywords: ["tech events", "startup conferences", "corporate events"] },
  hyderabad: { name: "Hyderabad", state: "Telangana",   keywords: ["events planning", "venue booking", "event management"] },
  pune:      { name: "Pune",      state: "Maharashtra", keywords: ["event planning", "corporate events", "workshops"] },
  kolkata:   { name: "Kolkata",   state: "West Bengal", keywords: ["events management", "party planning", "corporate events"] },
};

function getCityData(city: string) {
  return CITY_DATA[city.toLowerCase()] ?? CITY_DATA.mumbai;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const data = getCityData(city);

  return {
    title: `${data.name} Event Proposal Generator | Kunjara OS`,
    description: `Create professional event proposals in ${data.name}, ${data.state}. AI-powered event management for ${data.keywords.join(", ")}.`,
    keywords: [`${data.name} events`, `${data.state} event planner`, ...data.keywords],
    alternates: { canonical: `https://kunjaraos.com/${city}` },
    openGraph: {
      title: `Kunjara OS | Event Planning in ${data.name}`,
      description: `Professional event proposals in ${data.name}. Free AI proposal generator.`,
      url: `https://kunjaraos.com/${city}`,
    },
  };
}

export function generateStaticParams() {
  return Object.keys(CITY_DATA).map((city) => ({ city }));
}

export default async function CityPage({ params }: Props) {
  const { city } = await params;
  const data = getCityData(city);

  return (
    <div style={{ padding: "40px 24px", maxWidth: 1000, margin: "0 auto" }}>
      <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-3)", marginBottom: 12 }}>
        AI Event Planning · {data.state}
      </p>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text-1)", marginBottom: 12, lineHeight: 1.2 }}>
        Event Proposal Generator in {data.name}
      </h1>
      <p style={{ fontSize: 16, color: "var(--text-2)", marginBottom: 32, lineHeight: 1.7 }}>
        Create professional event proposals in {data.name}, {data.state}. Trusted by {data.name} event professionals for {data.keywords.join(", ")}.
      </p>

      <div style={{ display: "grid", gap: 16, marginBottom: 40 }}>
        {data.keywords.map((keyword, idx) => (
          <div key={idx} style={{
            padding: 16, background: "var(--bg-card)",
            borderRadius: 8, border: "1px solid var(--border)",
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", marginBottom: 6 }}>
              ✓ {keyword.charAt(0).toUpperCase() + keyword.slice(1)}
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-3)" }}>
              Kunjara OS helps {data.name} professionals plan {keyword} effortlessly with AI.
            </p>
          </div>
        ))}
      </div>

      <div style={{
        background: "rgba(99,102,241,0.1)", padding: 24,
        borderRadius: 12, border: "1px solid rgba(99,102,241,0.2)",
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 12 }}>
          Start Creating Proposals in {data.name}
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 20 }}>
          Join 500+ event professionals in {data.name} using Kunjara OS to win more clients.
        </p>
        <a
          href="/signup"
          style={{
            display: "inline-block", padding: "12px 28px",
            background: "#6366f1", color: "#fff",
            borderRadius: 8, textDecoration: "none",
            fontWeight: 700, fontSize: 14,
          }}
        >
          Get Started Free →
        </a>
      </div>
    </div>
  );
}
