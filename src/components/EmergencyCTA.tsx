"use client";

export default function EmergencyCTA() {
  return (
    <section id="emergency" className="py-16 px-6 relative overflow-hidden">
      <div className="max-w-8xl mx-auto">
        <div
          className="relative rounded-3xl p-10 md:p-14 overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(250,210,147,0.08), rgba(206,164,107,0.04))",
            border: "1px solid rgba(250,210,147,0.2)",
          }}
        >
          {/* Glow effect */}
          <div
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] opacity-20 pointer-events-none"
            style={{ background: "radial-gradient(circle, #FAD293, #CEA46B)" }}
          />
          <div
            className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-[80px] opacity-10 pointer-events-none"
            style={{ background: "radial-gradient(circle, #FAD293, #CEA46B)" }}
          />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                {/* Pulsing red dot */}
                <div className="relative">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75" />
                </div>
                <span className="text-xs font-bold tracking-[0.25em] uppercase text-red-400">
                  24/7 Emergency Service
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                Stuck Roadside?{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  We&apos;ve Got You.
                </span>
              </h2>
              <p className="text-white/55 text-lg max-w-lg">
                Flat tyre, breakdown, or accident damage — MMC connects you with emergency automotive assistance in your area within minutes.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <a
                href="tel:08001234567"
                id="emergency-call-btn"
                className="flex items-center gap-3 px-7 py-4 rounded-full border-2 border-red-500/60 text-red-400 font-semibold hover:bg-red-500/10 transition-all duration-300 hover:border-red-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call Emergency
              </a>
              <a
                href="#emergency-request"
                id="emergency-request-btn"
                className="flex items-center gap-3 px-7 py-4 rounded-full font-semibold text-black text-sm transition-all duration-300 hover:shadow-[0_0_30px_rgba(250,210,147,0.4)] hover:scale-105"
                style={{ background: "linear-gradient(135deg, #FAD293, #CEA46B)" }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Request Assistance
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
