"use client";

import Image from "next/image";

export default function EmergencyCTA() {
  return (
    <section id="emergency" className="py-14 sm:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] mx-auto">
        <div
          className="relative rounded-3xl overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(250,210,147,0.08), rgba(206,164,107,0.04))",
            border: "1px solid rgba(250,210,147,0.2)",
          }}
        >
          {/* Ambient glows */}
          <div
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] opacity-20 pointer-events-none"
            style={{ background: "radial-gradient(circle, #FAD293, #CEA46B)" }}
          />
          <div
            className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-[80px] opacity-10 pointer-events-none"
            style={{ background: "radial-gradient(circle, #FAD293, #CEA46B)" }}
          />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 items-stretch">
            {/* Left: Content */}
            <div className="p-6 sm:p-10 md:p-14 flex flex-col justify-center gap-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75" />
                </div>
                <span className="text-xs font-bold tracking-[0.25em] uppercase text-red-400">
                  24/7 Emergency Service
                </span>
              </div>

              <div>
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

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#emergency-request"
                  id="emergency-request-btn"
                  className="inline-flex items-center gap-3 px-7 py-4 rounded-full font-semibold text-black text-sm transition-all duration-300 hover:shadow-[0_0_30px_rgba(250,210,147,0.4)] hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #FAD293, #CEA46B)" }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Request Assistance
                </a>
              </div>
            </div>

            {/* Right: Emergency Image */}
            <div className="relative min-h-[260px] md:min-h-0 overflow-hidden rounded-b-3xl md:rounded-b-none md:rounded-r-3xl bg-black/40">
              <Image
                src="/Home-emeregency.jpeg"
                alt="MMC Emergency Roadside Assistance"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-fill"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
