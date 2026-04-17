import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import Navbar from "@/components/ui/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <Container>
          <section className="flex min-h-screen flex-col items-center justify-center gap-16 py-24 lg:flex-row lg:gap-24">
            {/* Left */}
            <div className="flex flex-1 flex-col gap-8">
              <span className="text-sm font-semibold tracking-widest text-text-secondary uppercase">
                Kunjara OS™
              </span>

              <h1 className="text-4xl font-bold leading-tight tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
                The Event{" "}
                <span className="bg-gradient-to-r from-accent-purple via-accent-blue to-accent-cyan bg-clip-text text-transparent">
                  Operating System
                </span>
              </h1>

              <p className="max-w-md text-lg leading-relaxed text-text-secondary">
                Create professional event proposals in minutes using AI.
              </p>

              <div>
                <Button className="px-8 py-3 text-base">Start Operating</Button>
              </div>
            </div>

            {/* Right */}
            <div className="flex flex-1 items-center justify-center">
              <div className="relative h-80 w-full max-w-md lg:h-96">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent-purple/20 via-accent-blue/10 to-accent-cyan/20 blur-3xl" />
                <div className="absolute inset-0 rounded-2xl border border-white/5 bg-surface/50 backdrop-blur-sm" />
                <div className="absolute inset-6 flex flex-col gap-3">
                  {[
                    { w: "w-3/4", h: "h-3" },
                    { w: "w-1/2", h: "h-3" },
                    { w: "w-5/6", h: "h-3" },
                    { w: "w-2/3", h: "h-3" },
                    { w: "w-3/4", h: "h-3" },
                  ].map((bar, i) => (
                    <div key={i} className={`${bar.h} ${bar.w} rounded-full bg-white/10`} />
                  ))}
                  <div className="mt-4 h-24 w-full rounded-xl border border-white/10 bg-gradient-to-r from-accent-purple/30 to-accent-cyan/30" />
                </div>
              </div>
            </div>
          </section>
        </Container>
      </main>
    </>
  );
}
