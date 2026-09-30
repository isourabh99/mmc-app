"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShieldCheck, Sparkles } from "lucide-react";

const PROMO_SLIDES = [
  {
    id: "lease-return",
    title: "Lease Return & Smart Repairs",
    image: "/newhome.png",
    alt: "MMC Lease Return - Leave a Better Impression, 25% Off Smart Repairs",
    href: "#get-quote",
  },
  {
    id: "all-services",
    title: "All-in-One Service Hub",
    image: "/home page.png",
    alt: "MMC - Every Car Service. One Connected Place. Book. Compare. Connect.",
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
      className="relative w-full bg-black py-6 sm:py-10 lg:py-12 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Dynamic ambient background gold glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[650px] lg:w-[950px] h-[250px] sm:h-[400px] rounded-full blur-[100px] sm:blur-[150px] pointer-events-none opacity-20"
        style={{
          background: "radial-gradient(circle, #FAD293 0%, #CEA46B 45%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        {/* Top Header & Interactive Tab Switcher */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-1">
          <div className="flex items-center gap-3">
            <div className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-[#FAD293]" />
            <span
              className="text-xs font-semibold tracking-[0.25em] uppercase"
              style={{
                background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              MMC Exclusive Highlights
            </span>
          </div>

          {/* Tab selector buttons */}
          <div className="flex items-center gap-2 p-1 rounded-full bg-white/[0.04] border border-[#CEA46B]/25 backdrop-blur-md">
            {PROMO_SLIDES.map((slide, idx) => {
              const isActive = idx === activeSlide;
              return (
                <button
                  key={slide.id}
                  id={`promo-tab-${slide.id}`}
                  onClick={() => setActiveSlide(idx)}
                  className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-2 ${
                    isActive
                      ? "bg-gradient-to-r from-[#FAD293] to-[#CEA46B] text-black font-semibold shadow-[0_0_20px_rgba(250,210,147,0.35)]"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {idx === 0 ? <ShieldCheck className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{slide.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Banner Visual Frame with Smooth Slider */}
        <div className="relative group">
          <Link
            href={currentSlide.href}
            id={`promo-banner-link-${currentSlide.id}`}
            className="group/card relative block w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-[#CEA46B]/30 hover:border-[#FAD293]/70 bg-[#0c0907] shadow-[0_20px_60px_rgba(0,0,0,0.85)] hover:shadow-[0_25px_80px_rgba(206,164,107,0.25)] transition-all duration-500 transform active:scale-[0.99]"
          >
            {/* Top gold sheen border line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FAD293]/80 to-transparent z-20" />

            {/* Banner Image Container */}
            <div className="relative w-full aspect-[16/9] bg-black/60 overflow-hidden">
              <Image
                src={currentSlide.image}
                alt={currentSlide.alt}
                fill
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 96vw, 1440px"
                className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-[1.01]"
              />

              {/* Subtle edge vignette */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>

            {/* Bottom gold sheen bar */}
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#CEA46B]/40 to-transparent z-20" />
          </Link>

          {/* Left Arrow */}
          <button
            id="promo-prev-btn"
            onClick={(e) => {
              e.preventDefault();
              setActiveSlide((prev) => (prev === 0 ? PROMO_SLIDES.length - 1 : prev - 1));
            }}
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/70 hover:bg-[#FAD293] text-white hover:text-black border border-[#CEA46B]/40 flex items-center justify-center backdrop-blur-md transition-all duration-300 opacity-80 sm:opacity-0 group-hover:opacity-100 shadow-xl z-20"
            aria-label="Previous Banner"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Right Arrow */}
          <button
            id="promo-next-btn"
            onClick={(e) => {
              e.preventDefault();
              setActiveSlide((prev) => (prev + 1) % PROMO_SLIDES.length);
            }}
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/70 hover:bg-[#FAD293] text-white hover:text-black border border-[#CEA46B]/40 flex items-center justify-center backdrop-blur-md transition-all duration-300 opacity-80 sm:opacity-0 group-hover:opacity-100 shadow-xl z-20"
            aria-label="Next Banner"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Slide Indicator Dots on the image */}
          <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 bg-black/70 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
            {PROMO_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSlide(idx);
                }}
                className={`transition-all duration-300 rounded-full ${
                  idx === activeSlide
                    ? "w-6 h-2 bg-[#FAD293]"
                    : "w-2 h-2 bg-white/40 hover:bg-white/80"
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
