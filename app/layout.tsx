import Script from 'next/script';
import type { Metadata } from "next";
import { Poppins, Space_Grotesk } from "next/font/google";
import "./globals.css";
import CookieConsent from "@/components/ui/CookieConsent";
import WebVitalsReporter from "@/components/ui/WebVitalsReporter";
import { Analytics } from '@vercel/analytics/next';

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

export const metadata: Metadata = {
  title: "Kunjara OS™",
  description: "The Event Operating System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${spaceGrotesk.variable}`}>
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

        {children}
        <CookieConsent />
        <Analytics />
        <WebVitalsReporter />

      </body>
    </html>
  );
}