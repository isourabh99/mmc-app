"use client";

import Image from "next/image";

const matchingPoints = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Instant AI Matching",
    desc: "Our engine analyses 14+ parameters to find providers perfectly suited to your specific vehicle, location and budget in real time.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
      </svg>
    ),
    title: "Vetted Professional Network",
    desc: "Access 2,400+ thoroughly verified automotive professionals — from solo specialists to multi-location garages.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Price Transparency",
    desc: "Compare detailed, itemised quotes side-by-side. No hidden charges, no surprises at the finish line.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: "End-to-End Communication",
    desc: "Built-in messaging keeps you in direct contact with your provider throughout the entire job.",
  },
];

export default function MatchingSection() {
  return (
    <section
      id="matching"
      className="py-16 sm:py-24 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #000000 0%, #080500 50%, #000000 100%)",
      }}
    >
      {/* Decorative grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(250,210,147,0.8) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Showcase Image Banner */}
          <div className="relative w-full rounded-3xl overflow-hidden border border-[#FAD293]/25 shadow-2xl group bg-black/40">
            <div className="relative w-full aspect-[16/9] overflow-hidden rounded-3xl">
              <Image
                src="/qoutes-2.png"
                alt="Motor Market Connect - Choose With Confidence"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-fit rounded-3xl transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </div>
            {/* Ambient inner border glow */}
            <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-[#FAD293]/20 pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-[#FAD293]/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Right: text content */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-10" style={{ background: "linear-gradient(90deg, #FAD293, transparent)" }} />
              <span
                className="text-xs font-semibold tracking-[0.25em] uppercase"
                style={{
                  background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Intelligent Matching
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              The Right Provider,{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Every Time
              </span>
            </h2>
            <p className="text-white/55 text-lg mb-10 leading-relaxed">
              Our proprietary matching engine doesn&apos;t just find available providers — it finds the <em className="not-italic text-white/80">best</em> provider for your specific situation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {matchingPoints.map((point, index) => (
                <div
                  key={index}
                  className="p-5 rounded-2xl border border-white/8 bg-white/3 hover:border-[#FAD293]/20 hover:bg-white/5 transition-all duration-300 group"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 group-hover:shadow-[0_0_16px_rgba(250,210,147,0.15)] transition-all duration-300"
                    style={{
                      background: "linear-gradient(135deg, rgba(250,210,147,0.1), rgba(206,164,107,0.05))",
                      border: "1px solid rgba(250,210,147,0.15)",
                      color: "#FAD293",
                    }}
                  >
                    {point.icon}
                  </div>
                  <h3 className="text-base font-semibold mb-2 group-hover:text-[#FAD293] transition-colors duration-300">
                    {point.title}
                  </h3>
                  <p className="text-xs text-white/40 leading-relaxed">{point.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
