"use client";

export default function ProviderCTA() {
  return (
    <section id="become-provider" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] mx-auto">
        <div
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(250,210,147,0.06) 0%, rgba(206,164,107,0.02) 100%)",
            border: "1px solid rgba(250,210,147,0.15)",
          }}
        >
          {/* Big gold number watermark */}
          <div
            className="absolute -right-8 top-1/2 -translate-y-1/2 text-[200px] font-black leading-none opacity-[0.03] select-none pointer-events-none"
            style={{
              background: "linear-gradient(135deg, #FAD293, #CEA46B)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            PRO
          </div>

          {/* Glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 blur-[80px] opacity-15 pointer-events-none"
            style={{ background: "linear-gradient(180deg, #FAD293, transparent)" }}
          />

          <div className="relative z-10 p-6 sm:p-10 md:p-16 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Left content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-5">
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
                  Become a Provider
                </span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold mb-5">
                Grow Your Automotive{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Business
                </span>{" "}
                with MMC
              </h2>
              <p className="text-white/55 text-lg max-w-xl mb-8">
                Join thousands of automotive professionals earning more with MMC. We bring the customers to you — you focus on delivering exceptional service.
              </p>

              {/* Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left">
                {[
                  "Access to 50,000+ active customers",
                  "Real-time job request notifications",
                  "Secure & fast payouts",
                  "Dedicated provider support",
                  "Performance analytics dashboard",
                  "No upfront listing costs",
                ].map((benefit) => (
                  <div key={benefit} className="flex items-center gap-2.5 text-sm text-white/65">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "linear-gradient(135deg, rgba(250,210,147,0.15), rgba(206,164,107,0.08))", border: "1px solid rgba(250,210,147,0.3)" }}
                    >
                      <svg className="w-3 h-3 text-[#FAD293]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {benefit}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a
                  href="#provider-signup"
                  id="provider-signup-btn"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full font-bold text-black text-sm transition-all duration-300 hover:shadow-[0_0_35px_rgba(250,210,147,0.4)] hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #FAD293, #CEA46B)" }}
                >
                  Apply as a Provider
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
                <a
                  href="#learn-more"
                  id="provider-learn-more-btn"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-sm border border-white/15 text-white/70 hover:text-white hover:border-[#FAD293]/40 transition-all duration-300"
                >
                  Learn More
                </a>
              </div>
            </div>

            {/* Right stats */}
            <div className="flex-shrink-0 grid grid-cols-2 gap-4">
              {[
                { value: "£6,200", label: "Avg. monthly earnings" },
                { value: "2,400+", label: "Active providers" },
                { value: "4.9★", label: "Provider satisfaction" },
                { value: "48hr", label: "Onboarding time" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-6 rounded-2xl text-center"
                  style={{
                    background: "rgba(250,210,147,0.04)",
                    border: "1px solid rgba(250,210,147,0.12)",
                  }}
                >
                  <p
                    className="text-3xl font-black mb-1"
                    style={{
                      background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs text-white/40">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
