"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Wrench,
} from "lucide-react";

interface PromoSlide {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  badge: string;
  image: string;
  alt: string;
  href: string;
}

const PROMO_SLIDES: PromoSlide[] = [
  {
    id: "lease-return",
    title: "Lease Return Repairs",
    subtitle: "Avoid end-of-lease penalty fees with certified smart repairs",
    tag: "SMART REPAIRS",
    badge: "SAVE 25%",
    image: "/newhome.png",
    alt: "Motor Market Club Lease Return & Smart Repairs — 25% Off",
    href: "#get-quote",
  },
  {
    id: "all-services",
    title: "All-in-One Service Hub",
    subtitle: "Compare quotes, book top-rated mechanics & emergency care",
    tag: "COMPLETE CAR CARE",
    badge: "8+ SERVICES",
    image: "/home page.png",
    alt: "Motor Market Club — Every Car Service in One Connected Place",
    href: "/services",
  },
];

export default function HomePromoBanner() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setActiveSlide((prev) => (prev + 1) % PROMO_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setActiveSlide((prev) => (prev === 0 ? PROMO_SLIDES.length - 1 : prev - 1));
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  return (
    <section
      id="home-promo-section"
      aria-label="Exclusive MMC Offers & Highlights"
      className="relative isolate w-full overflow-hidden bg-black py-3 sm:py-5 lg:py-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Luxury ambient gold glow background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[650px] lg:w-[1000px] h-[180px] sm:h-[300px] rounded-full blur-[100px] sm:blur-[160px] opacity-20"
          style={{
            background: "radial-gradient(circle, #FAD293 0%, #CEA46B 45%, transparent 70%)",
          }}
        />
      </div>

      {/* Main Container - Exactly 100% aligned with Navbar */}
      <div className="relative z-10 mx-auto w-full max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] px-4 sm:px-8 lg:px-[50px] space-y-3 sm:space-y-4">
        {/* Top Two Slide Selectors (Interactive Dual Cards matching Navbar width) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          {PROMO_SLIDES.map((slide, idx) => {
            const isActive = activeSlide === idx;

            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveSlide(idx)}
                aria-pressed={isActive}
                className={`group relative flex items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer overflow-hidden ${
                  isActive
                    ? "border-[#FAD293] bg-gradient-to-br from-[#1E1710] via-[#14100D] to-[#0D0B09] shadow-[0_8px_30px_rgba(250,210,147,0.18)] ring-1 ring-[#FAD293]/60"
                    : "border-white/10 bg-[#0C0B0A]/90 hover:border-[#CEA46B]/40 hover:bg-[#14110E]"
                }`}
              >
                {/* Active left indicator accent bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-b from-[#FAD293] to-[#CEA46B]"
                      : "bg-transparent"
                  }`}
                />

                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  {/* Icon Box */}
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-300 group-hover:scale-105 ${
                      isActive
                        ? "bg-[#CEA46B]/15 border-[#CEA46B]/40 text-[#FAD293]"
                        : "bg-white/5 border-white/10 text-white/50 group-hover:text-[#FAD293]"
                    }`}
                  >
                    {idx === 0 ? (
                      <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <Wrench className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </div>

                  {/* Text Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#FAD293]">
                        {slide.tag}
                      </span>
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#FAD293]/10 text-[#FAD293] border border-[#FAD293]/20">
                        {slide.badge}
                      </span>
                    </div>

                    <h3
                      className={`text-sm sm:text-base font-bold truncate transition-colors ${
                        isActive ? "text-white" : "text-white/80 group-hover:text-white"
                      }`}
                    >
                      {slide.title}
                    </h3>

                    <p className="text-xs text-white/50 truncate mt-0.5">
                      {slide.subtitle}
                    </p>
                  </div>
                </div>

                {/* Right Arrow / Action indicator */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 ${
                    isActive
                      ? "bg-[#FAD293] border-[#FAD293] text-black shadow-md"
                      : "bg-white/5 border-white/10 text-white/40 group-hover:border-white/20 group-hover:text-white"
                  }`}
                >
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Main Banner Visual Frame with Smooth Cross-Fade Slider */}
        <div className="relative rounded-2xl sm:rounded-3xl border border-[#CEA46B]/35 bg-[#0a0705] shadow-[0_20px_70px_rgba(0,0,0,0.85)] overflow-hidden group">
          {/* Top gold sheen line */}
          <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#FAD293] to-transparent z-20 pointer-events-none" />

          {/* Banner Images container with true 1672/941 aspect ratio (zero cropping of graphics & text) */}
          <div className="relative aspect-[1672/941] w-full overflow-hidden bg-black/80">
            {PROMO_SLIDES.map((slide, idx) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  activeSlide === idx
                    ? "opacity-100 z-10 pointer-events-auto"
                    : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                <Link
                  href={slide.href}
                  id={`promo-banner-link-${slide.id}`}
                  className="block relative w-full h-full cursor-pointer group/link"
                >
                  <Image
                    src={slide.image}
                    alt={slide.alt}
                    fill
                    priority={idx === 0}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 96vw, 1440px"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/link:scale-[1.012]"
                  />
                </Link>
              </div>
            ))}
          </div>

          {/* Left Navigation Arrow */}
          <button
            type="button"
            id="home-promo-prev-btn"
            onClick={prevSlide}
            aria-label="Previous Offer"
            className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/65 hover:bg-[#FAD293] text-white hover:text-black border border-white/15 hover:border-[#FAD293] flex items-center justify-center backdrop-blur-md transition-all duration-300 shadow-xl cursor-pointer active:scale-95"
          >
            <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>

          {/* Right Navigation Arrow */}
          <button
            type="button"
            id="home-promo-next-btn"
            onClick={nextSlide}
            aria-label="Next Offer"
            className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/65 hover:bg-[#FAD293] text-white hover:text-black border border-white/15 hover:border-[#FAD293] flex items-center justify-center backdrop-blur-md transition-all duration-300 shadow-xl cursor-pointer active:scale-95"
          >
            <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>

          {/* Slide Indicator Dots Floating at Bottom Center */}
          <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full border border-white/15 bg-black/75 px-3 py-1 sm:py-1.5 backdrop-blur-md shadow-lg">
            {PROMO_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                aria-current={idx === activeSlide}
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === activeSlide
                    ? "w-5 sm:w-6 bg-[#FAD293] shadow-[0_0_10px_rgba(250,210,147,0.5)]"
                    : "w-1.5 sm:w-2 bg-white/40 hover:bg-white/80"
                }`}
              />
            ))}
          </div>

          {/* Bottom subtle gold sheen line */}
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#CEA46B]/40 to-transparent z-20 pointer-events-none" />
        </div>
      </div>
    </section>
  );
}
