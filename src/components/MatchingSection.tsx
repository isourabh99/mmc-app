"use client";

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
      className="py-24 px-6 relative overflow-hidden"
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

      <div className="max-w-8xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Visual card stack */}
          <div className="relative h-[500px] hidden lg:block">
            {/* Background card */}
            <div
              className="absolute top-16 left-8 right-0 h-72 rounded-3xl rotate-3"
              style={{
                background: "rgba(250,210,147,0.03)",
                border: "1px solid rgba(250,210,147,0.1)",
              }}
            />
            {/* Middle card */}
            <div
              className="absolute top-8 left-4 right-4 h-80 rounded-3xl rotate-1"
              style={{
                background: "rgba(250,210,147,0.04)",
                border: "1px solid rgba(250,210,147,0.12)",
              }}
            />
            {/* Main card */}
            <div
              className="absolute top-0 left-0 right-8 rounded-3xl p-7 overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(250,210,147,0.2)",
                backdropFilter: "blur(20px)",
              }}
            >
              
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs text-white/40 mb-0.5">Provider Match Found</p>
                  <p className="font-bold text-lg">Elite Auto Repairs</p>
                </div>
                <div
                  className="px-3 py-1.5 rounded-full text-xs font-bold text-black"
                  style={{ background: "linear-gradient(135deg, #FAD293, #CEA46B)" }}
                >
                  98% Match
                </div>
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-[#FAD293]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                ))}
                <span className="text-xs text-white/40 ml-1">(312 reviews)</span>
              </div>

              {/* Quote details */}
              <div className="space-y-3 mb-5">
                {[
                  { label: "Service", value: "Smart Repair — Door Dent" },
                  { label: "Timeline", value: "2–3 hours" },
                  { label: "Location", value: "Manchester, M1" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-white/35">{item.label}</span>
                    <span className="text-white/80">{item.value}</span>
                  </div>
                ))}
              </div>

              <div
                className="h-px w-full mb-5"
                style={{ background: "linear-gradient(90deg, transparent, rgba(250,210,147,0.2), transparent)" }}
              />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/35 mb-0.5">Your Quote</p>
                  <p
                    className="text-3xl font-black"
                    style={{
                      background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    £149
                  </p>
                </div>
                <button
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-black"
                  style={{ background: "linear-gradient(135deg, #FAD293, #CEA46B)" }}
                >
                  Accept Quote
                </button>
              </div>
            </div>

            {/* Floating badge */}
            <div
              className="absolute -bottom-4 right-0 px-5 py-3 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(250,210,147,0.2)",
                backdropFilter: "blur(16px)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm text-white/70">3 providers matched · responding now</span>
              </div>
            </div>
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
