import Script from 'next/script';
import type { Metadata, Viewport } from "next";
import { Poppins, Space_Grotesk, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import CookieConsent from "@/components/ui/CookieConsent";
import WebVitalsReporter from "@/components/ui/WebVitalsReporter";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from "@vercel/speed-insights/next";
import {
  generateOrganizationSchema,
  generateSoftwareAppSchema,
  generateFAQSchema,
} from "@/lib/structured-data";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-poppins",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-space-grotesk",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-instrument-serif",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6366f1",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://kunjaraos.com"),

  title: "Kunjara OS™ | AI Event Proposal Generator for India",
  description: "Create professional event proposals in minutes. AI-powered event management OS for Indian planners, venues, and vendors. Trusted by 500+ event professionals.",
  keywords: ["event proposal generator", "event planning software", "AI event planner", "event management system", "India", "Indian events", "wedding planner software", "corporate event planner"],
  authors: [{ name: "Kunjara OS", url: "https://kunjaraos.com" }],
  creator: "Kunjara OS Team",
  publisher: "Kunjara OS",
  applicationName: "Kunjara OS",

  openGraph: {
    type: "website",
    locale: "en_IN",
    alternateLocale: ["hi_IN"],
    url: "https://kunjaraos.com",
    siteName: "Kunjara OS",
    title: "Kunjara OS™ | AI Event Proposal Generator for India",
    description: "Create professional event proposals in minutes using AI. The operating system for event professionals.",
    images: [
      {
        url: "https://kunjaraos.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Kunjara OS - Event Proposal Generator",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Kunjara OS™ | AI Event Proposal Generator",
    description: "Create professional event proposals in minutes",
    images: ["https://kunjaraos.com/twitter-image.png"],
    creator: "@kunjaraos",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  alternates: {
    canonical: "https://kunjaraos.com",
    languages: {
      "en-IN": "https://kunjaraos.com",
      "hi-IN": "https://kunjaraos.com",
    },
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kunjara OS",
  },

  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },

  manifest: "/manifest.json",

  other: {
    "geo.position": "19.0760,72.8777",
    "geo.region": "IN-MH",
    "geo.placename": "Mumbai, India",
    ICBM: "19.0760, 72.8777",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${spaceGrotesk.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-bg text-text-primary min-h-screen">

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-40DTYGNHTK"
          strategy="afterInteractive"
        />

        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-40DTYGNHTK');
          `}
        </Script>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateOrganizationSchema()) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateSoftwareAppSchema()) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateFAQSchema()) }} />

        {children}
        <CookieConsent />
        <Analytics />
        <SpeedInsights />
        <WebVitalsReporter />

      </body>
    </html>
  );
}