"use client";

import Image from "next/image";
import Link from "next/link";

export default function EmergencyCTA() {
  return (
    <section id="emergency" className="py-4 sm:py-10 lg:py-14 relative overflow-hidden bg-black">
      <div className="max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-[50px]">
        <div
          className="relative rounded-3xl overflow-hidden border border-[#CEA46B]/30 bg-gradient-to-br from-[#120e0b] via-[#0d0a08] to-[#070504] shadow-[0_20px_60px_rgba(0,0,0,0.9)]"
        >
          {/* Top gold sheen line */}
          <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#FAD293] to-transparent z-20" />

          {/* Ambient glows */}
          <div
            className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-[100px] opacity-20 pointer-events-none"
            style={{ background: "radial-gradient(circle, #FAD293, #CEA46B)" }}
          />
          <div
            className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full blur-[100px] opacity-15 pointer-events-none"
            style={{ background: "radial-gradient(circle, #FAD293, #CEA46B)" }}
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[360px] sm:min-h-[400px] lg:min-h-[430px]">
            {/* Left: Content (5 cols on lg/desktop) */}
            <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 2xl:p-12 flex flex-col justify-center gap-5 sm:gap-6">
              <div className="flex items-center gap-2.5">
                <div className="relative flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                  <div className="absolute w-2.5 h-2.5 bg-red-500 rounded-full animate-ping opacity-75" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold tracking-[0.22em] uppercase text-red-400">
                  24/7 Emergency Service
                </span>
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl 2xl:text-5xl font-black text-white tracking-tight leading-[1.15]">
                  Stuck Roadside?{" "}
                  <span
                    style={{
                      background: "linear-gradient(135deg, #FFF0D4 0%, #FAD293 50%, #CEA46B 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    We&apos;ve Got You.
                  </span>
                </h2>
                <p className="text-white/70 text-sm sm:text-base 2xl:text-lg leading-relaxed max-w-xl">
                  Flat tyre, breakdown, or accident damage — Motor Market Club connects you with certified emergency automotive specialists in your area within minutes.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/emergency-assistance"
                  id="emergency-request-btn"
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 sm:px-8 sm:py-4 rounded-full font-bold text-black text-xs sm:text-sm transition-all duration-300 shadow-lg shadow-[#FAD293]/20 hover:shadow-[0_0_30px_rgba(250,210,147,0.45)] hover:scale-105 active:scale-95 cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #FFF0D4, #FAD293 40%, #CEA46B)" }}
                >
                  <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-black" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Request Assistance</span>
                </Link>
              </div>
            </div>

            {/* Right: Emergency Image Banner (7 cols on lg/desktop) */}
            <div className="lg:col-span-7 relative min-h-[260px] sm:min-h-[320px] lg:min-h-full overflow-hidden rounded-b-3xl lg:rounded-b-none lg:rounded-r-3xl bg-black/60 border-t lg:border-t-0 lg:border-l border-white/5">
              <Image
                src="/Home-emeregency.jpeg"
                alt="Motor Market Club Emergency Roadside Assistance"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, (max-width: 1600px) 60vw, 950px"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/60 lg:from-black/30 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </div>  
    </section>
  );
}
