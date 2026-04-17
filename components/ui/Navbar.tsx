import Link from "next/link";
import Container from "./Container";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-bg/80 backdrop-blur-md">
      <Container>
        <nav className="flex h-14 items-center justify-between">
          <Link
            href="/"
            className="text-xs font-bold tracking-widest text-text-primary uppercase transition-opacity duration-150 hover:opacity-70"
          >
            Kunjara OS™
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/features"
              className="text-sm text-text-secondary transition-colors duration-150 hover:text-text-primary"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-text-secondary transition-colors duration-150 hover:text-text-primary"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-white/10 bg-surface px-4 py-1.5 text-sm font-medium text-text-primary transition-all duration-150 hover:border-white/20 hover:bg-card"
            >
              Login
            </Link>
          </div>
        </nav>
      </Container>
    </header>
  );
}
