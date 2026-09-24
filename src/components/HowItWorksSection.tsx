"use client";

const steps = [
  {
    number: "01",
    title: "Describe Your Need",
    desc: "Tell us what service you need, your vehicle details, and preferred location. Takes less than 60 seconds.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Receive Matched Quotes",
    desc: "Our algorithm instantly matches you with verified providers and you receive competitive quotes within minutes.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Compare & Choose",
    desc: "Review provider profiles, ratings, photos, and price breakdowns. Pick the perfect fit for your budget.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Book & Drive Away",
    desc: "Confirm your booking securely through MMC. Track the job, pay safely, and leave a review.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-16 sm:py-24 relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #000000, #0a0800, #000000)" }}
    >
      {/* Decorative lines */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, #FAD293, transparent)" }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, #FAD293, transparent)" }}
        />
      </div>

      <div className="max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12" style={{ background: "linear-gradient(90deg, transparent, #FAD293)" }} />
            <span
              className="text-xs font-semibold tracking-[0.25em] uppercase"
              style={{
                background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              How It Works
            </span>
            <div className="h-px w-12" style={{ background: "linear-gradient(90deg, #CEA46B, transparent)" }} />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Four Steps to{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Perfect Service
            </span>
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            From request to completion, MMC handles everything so you can focus on the road ahead.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div
              key={step.number}
              id={`step-${step.number}`}
              className="relative group p-7 rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm hover:border-[#FAD293]/25 hover:bg-white/5 transition-all duration-400 hover:-translate-y-1"
            >
              {/* Connector line (desktop) */}
              {index < steps.length - 1 && (
                <div
                  className="hidden lg:block absolute top-10 left-full w-6 h-px z-20"
                  style={{ background: "linear-gradient(90deg, #FAD293, transparent)" }}
                />
              )}

              {/* Step number */}
              <div className="flex items-start justify-between mb-5">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, rgba(250,210,147,0.12), rgba(206,164,107,0.06))",
                    border: "1px solid rgba(250,210,147,0.2)",
                    color: "#FAD293",
                  }}
                >
                  {step.icon}
                </div>
                <span
                  className="text-5xl font-black opacity-10 leading-none"
                  style={{
                    background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {step.number}
                </span>
              </div>

              <h3 className="text-xl font-bold mb-3 group-hover:text-[#FAD293] transition-colors duration-300">
                {step.title}
              </h3>
              <p className="text-sm text-white/45 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-14">
          <a
            href="#get-started"
            id="how-it-works-cta"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full font-semibold text-black text-sm transition-all duration-300 hover:shadow-[0_0_30px_rgba(250,210,147,0.35)] hover:scale-105"
            style={{ background: "linear-gradient(135deg, #FAD293, #CEA46B)" }}
          >
            Get Your Free Quote
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
