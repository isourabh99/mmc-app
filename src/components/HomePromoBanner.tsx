"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Share2, ChevronRight, ChevronLeft } from "lucide-react";

const PROMO_SLIDES = [
  {
    id: "lease-return",
    title: "Lease return repairs",
    subtitle: "Keep your car in top condition",
    image: "/newhome.png",
    alt: "Motor Market Club Lease Return & Smart Repairs — 25% Off",
    href: "#get-quote",
  },
  {
    id: "all-services",
    title: "All-in-one service hub",
    subtitle: "Everything your car needs",
    image: "/home page.png",
    alt: "Motor Market Club — Every Car Service. One Connected Place.",
    href: "/services",
  },
];

export default function HomePromoBanner() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-slide every 6 seconds unless hovered
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % PROMO_SLIDES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const currentSlide = PROMO_SLIDES[activeSlide];

  return (
    <section
      id="home-promo-section"
      className="relative w-full bg-black py-3 sm:py-6 lg:py-8 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Dynamic ambient gold background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[650px] lg:w-[950px] h-[180px] sm:h-[300px] rounded-full blur-[100px] sm:blur-[150px] pointer-events-none opacity-15"
        style={{
          background:
            "radial-gradient(circle, #FAD293 0%, #CEA46B 45%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] px-4 sm:px-8 lg:px-[50px] space-y-3 sm:space-y-4">
        {/* Two side-by-side feature cards (Screenshot UI & Interactive Slide Selector) */}
        <div className="grid grid-cols-2 gap-2.5 xs:gap-3 sm:gap-4 lg:gap-6">
          {/* Card 1: Lease return repairs (Dark Glass with Gold Border) */}
          <button
            type="button"
            id="home-promo-tab-lease-repairs"
            onClick={() => setActiveSlide(0)}
            className={`group relative flex items-center gap-2.5 xs:gap-3 sm:gap-4 p-3 xs:p-3.5 sm:p-5 lg:p-6 rounded-2xl bg-[#121114]/95 border transition-all duration-300 text-left cursor-pointer ${
              activeSlide === 0
                ? "border-[#FAD293] ring-1 ring-[#FAD293] shadow-[0_10px_30px_rgba(250,210,147,0.22)]"
                : "border-[#CEA46B]/35 hover:border-[#FAD293]/70 opacity-85 hover:opacity-100"
            }`}
          >
            <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-12 sm:h-12 rounded-xl bg-[#CEA46B]/15 border border-[#CEA46B]/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4 xs:w-5 xs:h-5 sm:w-7 sm:h-7 text-[#FAD293]" />
            </div>

            <div className="flex-1 min-w-0 pr-0.5 sm:pr-1">
              <div className="flex items-center justify-between gap-1">
                <h3 className="text-xs xs:text-sm sm:text-base lg:text-lg font-bold text-white group-hover:text-[#FAD293] transition-colors truncate">
                  Lease return repairs
                </h3>
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/60 group-hover:text-[#FAD293] group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
              <p className="text-[10px] xs:text-[11px] sm:text-xs text-white/60 truncate mt-0.5">
                Keep your car in top condition
              </p>
            </div>
          </button>

          {/* Card 2: All-in-one service hub (Solid Gold / Bronze Gradient) */}
          <button
            type="button"
            id="home-promo-tab-service-hub"
            onClick={() => setActiveSlide(1)}
            className={`group relative flex items-center gap-2.5 xs:gap-3 sm:gap-4 p-3 xs:p-3.5 sm:p-5 lg:p-6 rounded-2xl border transition-all duration-300 text-left cursor-pointer ${
              activeSlide === 1
                ? "border-white ring-1 ring-white shadow-[0_10px_30px_rgba(216,165,84,0.35)]"
                : "border-[#FAD293]/40 hover:border-white/80 opacity-90 hover:opacity-100"
            }`}
            style={{
              background:
                "linear-gradient(135deg, #ECC880 0%, #D8A554 50%, #BD8535 100%)",
            }}
          >
            <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-12 sm:h-12 rounded-xl bg-black/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Share2 className="w-4 h-4 xs:w-5 xs:h-5 sm:w-7 sm:h-7 text-black" />
            </div>

            <div className="flex-1 min-w-0 pr-0.5 sm:pr-1">
              <div className="flex items-center justify-between gap-1">
                <h3 className="text-xs xs:text-sm sm:text-base lg:text-lg font-bold text-black tracking-tight truncate">
                  All-in-one service hub
                </h3>
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black/70 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
              <p className="text-[10px] xs:text-[11px] sm:text-xs text-black/75 font-medium truncate mt-0.5">
                Everything your car needs
              </p>
            </div>
          </button>
        </div>

        {/* Main Banner Visual Frame — Visible on BOTH Desktop and Mobile */}
        <div className="relative group w-full">
          <Link
            href={currentSlide.href}
            id={`promo-banner-link-${currentSlide.id}`}
            className="group/card relative block w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-[#CEA46B]/35 hover:border-[#FAD293]/75 bg-[#0c0907] shadow-[0_20px_60px_rgba(0,0,0,0.85)] hover:shadow-[0_25px_80px_rgba(206,164,107,0.25)] transition-all duration-500 transform active:scale-[0.99]"
          >
            {/* Top gold sheen border line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FAD293]/80 to-transparent z-20" />

            {/* Banner Image Container */}
            <div className="relative w-full aspect-[16/9] sm:aspect-[16/8.5] lg:aspect-[16/7.5] bg-black/80 overflow-hidden">
              <Image
                src={currentSlide.image}
                alt={currentSlide.alt}
                fill
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 96vw, 1440px"
                className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-[1.01]"
              />

              {/* Subtle edge vignette */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-black/20" />
            </div>

            {/* Bottom gold sheen bar */}
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#CEA46B]/40 to-transparent z-20" />
          </Link>

          {/* Left Arrow Button */}
          <button
            id="promo-prev-btn"
            onClick={(e) => {
              e.preventDefault();
              setActiveSlide((prev) =>
                prev === 0 ? PROMO_SLIDES.length - 1 : prev - 1
              );
            }}
            className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/75 hover:bg-[#FAD293] text-white hover:text-black border border-[#CEA46B]/40 flex items-center justify-center backdrop-blur-md transition-all duration-300 opacity-80 sm:opacity-0 group-hover:opacity-100 shadow-xl z-20 cursor-pointer"
            aria-label="Previous Banner"
          >
            <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>

          {/* Right Arrow Button */}
          <button
            id="promo-next-btn"
            onClick={(e) => {
              e.preventDefault();
              setActiveSlide((prev) => (prev + 1) % PROMO_SLIDES.length);
            }}
            className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/75 hover:bg-[#FAD293] text-white hover:text-black border border-[#CEA46B]/40 flex items-center justify-center backdrop-blur-md transition-all duration-300 opacity-80 sm:opacity-0 group-hover:opacity-100 shadow-xl z-20 cursor-pointer"
            aria-label="Next Banner"
          >
            <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>

          {/* Slide Indicator Dots on the image */}
          <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 bg-black/75 px-3 py-1 sm:py-1.5 rounded-full border border-white/10 backdrop-blur-md">
            {PROMO_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSlide(idx);
                }}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === activeSlide
                    ? "w-5 sm:w-6 h-1.5 sm:h-2 bg-[#FAD293]"
                    : "w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/40 hover:bg-white/80"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
