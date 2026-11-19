"use client";

import React from "react";

const features = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Verified Providers",
    desc: "Every provider is background-checked, insured, and rated by real customers.",
    number: "01",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "No Hidden Fees",
    desc: "Transparent pricing with itemised quotes. No unexpected charges.",
    number: "02",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    title: "Secure Payments",
    desc: "Protected transactions with secure payment processing and peace of mind.",
    number: "03",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    title: "Guaranteed Quality",
    desc: "Our resolution team is committed to making every service experience right.",
    number: "04",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Nationwide Coverage",
    desc: "Access automotive professionals across the UK, wherever you are.",
    number: "05",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: "Real-Time Tracking",
    desc: "Follow your service progress and stay informed at every stage.",
    number: "06",
  },
];

export default function TrustSection() {
  return (
    <section
      id="about"
      aria-label="The MMC Difference — Built on Trust"
      className="relative overflow-hidden bg-[#050505] py-4 sm:py-6 lg:py-8"
    >
      {/* Background lighting */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[280px] w-[600px] -translate-x-1/2 rounded-full bg-[#c99b52]/[0.04] blur-[140px]" />

      <div className="relative mx-auto w-full max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] px-4 sm:px-8 lg:px-[50px]">
        {/* Heading */}
        <div className="mx-auto mb-6 max-w-3xl text-center sm:mb-8">
          <div className="mb-2.5 inline-flex items-center gap-2.5 rounded-full border border-[#dcb36d]/20 bg-[#dcb36d]/[0.06] px-3.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#dcb36d]" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#dcb36d] sm:text-[10px]">
              The MMC Difference
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#dcb36d]" />
          </div>

          <h2 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
            Built on Trust.{" "}
            <span className="bg-gradient-to-r from-[#f8dfaa] via-[#dcb36d] to-[#a97836] bg-clip-text text-transparent">
              Driven by Excellence.
            </span>
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-white/50 sm:text-sm">
            Premium automotive care, trusted professionals, and a seamless
            service experience — every step of the way.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          {features.map((feature) => (
            <div
              key={feature.number}
              className="group relative overflow-hidden rounded-xl border border-white/[0.07] bg-gradient-to-br from-[#11100e] to-[#090909] p-4 sm:p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#dcb36d]/30 hover:shadow-[0_12px_35px_rgba(220,179,109,0.06)]"
            >
              {/* Hover glow */}
              <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#dcb36d]/[0.04] blur-3xl transition-all duration-500 group-hover:bg-[#dcb36d]/[0.10]" />

              <div className="relative flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#dcb36d]/20 bg-[#dcb36d]/[0.08] text-[#dcb36d] transition-all duration-300 group-hover:border-[#dcb36d]/40 group-hover:bg-[#dcb36d]/[0.14]">
                  {feature.icon}
                </div>

                <span className="font-mono text-xs tracking-widest text-white/20 transition-colors group-hover:text-[#dcb36d]/60">
                  {feature.number}
                </span>
              </div>

              <div className="relative mt-3.5">
                <h3 className="text-sm font-semibold text-white transition-colors group-hover:text-[#e8c47d] sm:text-base">
                  {feature.title}
                </h3>

                <p className="mt-1 text-xs leading-relaxed text-white/45 sm:text-sm">
                  {feature.desc}
                </p>
              </div>

              {/* Bottom accent */}
              <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-[#dcb36d] to-transparent transition-all duration-500 group-hover:w-full" />
            </div>
          ))}
        </div>

        {/* Bottom trust statement */}
        <div className="mt-5 flex flex-col items-center justify-center gap-2 border-t border-white/[0.06] pt-3.5 sm:mt-6 sm:flex-row sm:gap-5">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#dcb36d]" />
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/40">
              Your vehicle
            </span>
          </div>

          <span className="hidden text-[#dcb36d]/40 sm:block">✦</span>

          <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#dcb36d]">
            Our priority
          </span>

          <span className="hidden text-[#dcb36d]/40 sm:block">✦</span>

          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#dcb36d]" />
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/40">
              Every single time
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
