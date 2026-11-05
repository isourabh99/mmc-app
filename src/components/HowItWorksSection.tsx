
"use client";

import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Describe Your Need",
    desc: "Tell us your vehicle details, service requirements and preferred location.",
    icon: "01",
  },
  {
    number: "02",
    title: "Receive Quotes",
    desc: "Get matched with trusted automotive professionals in your area.",
    icon: "02",
  },
  {
    number: "03",
    title: "Compare & Choose",
    desc: "Compare prices, ratings and services. Select your perfect provider.",
    icon: "03",
  },
  {
    number: "04",
    title: "Book & Drive",
    desc: "Confirm your booking, track your service and enjoy complete peace of mind.",
    icon: "04",
  },
];

interface HowItWorksSectionProps {
  isStandalone?: boolean;
  className?: string;
}

export default function HowItWorksSection({
  isStandalone = false,
  className = "",
}: HowItWorksSectionProps) {
  return (
    <section
      id="how-it-works"
      className={`relative overflow-hidden bg-[#050505] ${
        isStandalone ? "py-10" : "py-12 sm:py-16 lg:py-20"
      } ${className}`}
    >
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">

        {/* Header */}
        <div className="mb-9 flex flex-col justify-between gap-5 lg:mb-12 lg:flex-row lg:items-end">

          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-[2px] w-7 bg-[#D6AD68]" />

              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#D6AD68]">
                The MMC Experience
              </span>
            </div>

            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[42px]">
              Automotive care,{" "}
              <span className="bg-gradient-to-r from-[#F7DCA5] to-[#B88945] bg-clip-text text-transparent">
                made simple.
              </span>
            </h2>
          </div>

          <div className="max-w-md lg:pb-1">
            <p className="text-sm leading-6 text-white/45">
              From finding the right professional to getting back on the road.
              Your entire automotive journey, simplified.
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

          {steps.map((step, index) => (
            <div
              key={step.number}
              className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0D0C0A] p-5 transition-all duration-300 hover:border-[#D6AD68]/40 hover:bg-[#12100D] sm:p-6"
            >
              {/* Top */}
              <div className="mb-6 flex items-center justify-between">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#D6AD68]/25 bg-[#D6AD68]/[0.07] text-[#D6AD68] transition-all group-hover:bg-[#D6AD68]/15">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {index === 0 && (
                      <path
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    )}

                    {index === 1 && (
                      <path
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.4-4 8-9 8a10 10 0 01-4-.9L3 20l1.4-3.7A8 8 0 013 12c0-4.4 4-8 9-8s9 3.6 9 8z"
                      />
                    )}

                    {index === 2 && (
                      <path
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 3v18h18M7 14h3v4H7zm5-5h3v9h-3zm5-5h3v14h-3z"
                      />
                    )}

                    {index === 3 && (
                      <path
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    )}
                  </svg>
                </div>

                <span className="font-mono text-3xl font-medium tracking-tight text-white/[0.12] transition-colors group-hover:text-[#D6AD68]/50">
                  {step.number}
                </span>
              </div>

              {/* Content */}
              <h3 className="text-base font-semibold text-white transition-colors group-hover:text-[#E7C58A] sm:text-lg">
                {step.title}
              </h3>

              <p className="mt-2 text-xs leading-6 text-white/40 sm:text-sm">
                {step.desc}
              </p>

              {/* Bottom line */}
              <div className="mt-5 h-px w-full bg-white/[0.06]" />

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-[0.18em] text-white/25">
                  STEP {step.number}
                </span>

                <span className="text-xs text-[#D6AD68]/60 transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>

              {/* Gold hover accent */}
              <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#D6AD68] transition-all duration-500 group-hover:w-full" />
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-7 flex flex-col items-center justify-between gap-4 rounded-xl border border-[#D6AD68]/15 bg-[#0B0A08] px-5 py-5 sm:flex-row sm:px-7">

          <div>
            <h3 className="text-sm font-medium text-white">
              Your next automotive service starts here.
            </h3>

            <p className="mt-1 text-xs text-white/40">
              Find trusted professionals and get competitive quotes.
            </p>
          </div>

          <Link
            href="/services"
            id="how-it-works-cta"
            className="inline-flex shrink-0 items-center gap-3 rounded-lg bg-gradient-to-r from-[#F1D39A] to-[#C69A56] px-5 py-3 text-xs font-semibold text-black transition-all hover:brightness-110"
          >
            Explore Services

            <span>→</span>
          </Link>
        </div>

      </div>
    </section>
  );
}
