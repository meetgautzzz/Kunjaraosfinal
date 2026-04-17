import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="bg-bg text-text-primary min-h-screen">{children}</body>
    </html>
  );
}
