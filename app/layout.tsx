import type { Metadata } from "next";
import "./globals.css";
import CookieConsent from "@/components/ui/CookieConsent";

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
    return (
  <html lang="en">

    <head>
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-40DTYGNHTK');
          `,
        }}
      />
    </head>

    <body className="bg-bg text-text-primary min-h-screen">
      {children}
      <CookieConsent />
    </body>
  </html>
);
}
