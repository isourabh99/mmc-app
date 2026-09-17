"use client";

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Verified Providers",
    desc: "Every provider on MMC is background-checked, insured, and rated by real customers.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "No Hidden Fees",
    desc: "Transparent pricing with itemised quotes. What you see is exactly what you pay.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    title: "Secure Payments",
    desc: "All transactions are protected by enterprise-grade encryption. Pay only when satisfied.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    title: "Guaranteed Quality",
    desc: "If you're not 100% satisfied, our resolution team will make it right — guaranteed.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Nationwide Coverage",
    desc: "Thousands of providers across the UK. Wherever you are, MMC has you covered.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: "Real-Time Tracking",
    desc: "Track your service job status in real-time. No more waiting around wondering what's happening.",
  },
];

export default function TrustSection() {
  return (
    <section
      id="about"
      className="py-24 px-6 relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #000000, #050400)" }}
    >
      <div className="max-w-8xl mx-auto">
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
              Why Choose MMC
            </span>
            <div className="h-px w-12" style={{ background: "linear-gradient(90deg, #CEA46B, transparent)" }} />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Built on{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Trust & Excellence
            </span>
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            We've built every feature around one goal: connecting you to the very best automotive service with zero friction and total peace of mind.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group flex gap-5 p-6 rounded-2xl border border-white/8 bg-white/3 hover:border-[#FAD293]/25 hover:bg-white/5 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(250,210,147,0.15)]"
                style={{
                  background: "linear-gradient(135deg, rgba(250,210,147,0.1), rgba(206,164,107,0.05))",
                  border: "1px solid rgba(250,210,147,0.2)",
                  color: "#FAD293",
                }}
              >
                {feature.icon}
              </div>
              <div>
                <h3 className="text-base font-bold mb-2 group-hover:text-[#FAD293] transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-sm text-white/45 leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
