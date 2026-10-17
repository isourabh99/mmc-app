"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, FileText, ChevronRight, Wrench } from "lucide-react";

type Particle = {
  id: number;
  top: string;
  left: string;
  duration: string;
  delay: string;
};

export default function HeroSection() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        top: `${Math.random() * 80}%`,
        left: `${Math.random() * 100}%`,
        duration: `${(2.5 + Math.random() * 3).toFixed(2)}s`,
        delay: `${(Math.random() * 2).toFixed(2)}s`,
      }))
    );
  }, []);

  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-[#050505] text-white pt-3 xs:pt-4 sm:pt-8 md:pt-12 lg:pt-16 pb-5 sm:pb-10 lg:pb-16 flex items-center"
    >
      {/* =========================================================
          BACKGROUND IMAGE (Both Mobile & Desktop)
      ========================================================= */}
      <div
        className="absolute inset-0 bg-no-repeat bg-cover bg-[position:90%_25%] sm:bg-[position:85%_35%] lg:bg-[position:right_center]"
        style={{
          backgroundImage: "url('/hero-bg1.png')",
        }}
      />

      {/* Mobile horizontal gradient — keeps left text 100% crisp while revealing glowing car on right */}
      <div
        className="absolute inset-0 lg:hidden pointer-events-none"
        style={{
          background: `
            linear-gradient(
              90deg,
              rgba(5,5,5,0.95) 0%,
              rgba(5,5,5,0.82) 48%,
              rgba(5,5,5,0.25) 78%,
              rgba(5,5,5,0.05) 100%
            )
          `,
        }}
      />

      {/* Desktop horizontal dark gradient — keeps left readable while revealing car on right */}
      <div
        className="hidden lg:block absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(
              90deg,
              rgba(5,5,5,0.98) 0%,
              rgba(5,5,5,0.94) 38%,
              rgba(5,5,5,0.80) 55%,
              rgba(5,5,5,0.35) 75%,
              rgba(5,5,5,0.15) 100%
            )
          `,
        }}
      />

      {/* Top black cinematic fade */}
      <div
        className="absolute inset-x-0 top-0 h-12 sm:h-24 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(5,5,5,0.90), transparent)",
        }}
      />

      {/* Bottom cinematic fade */}
      <div
        className="absolute inset-x-0 bottom-0 h-16 sm:h-32 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(5,5,5,0.98), transparent)",
        }}
      />

      {/* Gold ambient glow */}
      <div
        className="absolute -right-20 top-1/4 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full pointer-events-none opacity-40 sm:opacity-100"
        style={{
          background:
            "radial-gradient(circle, rgba(218,170,93,0.16), transparent 68%)",
          filter: "blur(40px)",
        }}
      />

      {/* =========================================================
          PARTICLES
      ========================================================= */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        {particles.map((particle) => (
          <span
            key={particle.id}
            className="absolute block w-[2px] h-[2px] rounded-full bg-[#F5CC8A]/50"
            style={{
              top: particle.top,
              left: particle.left,
              animation: `heroParticle ${particle.duration} ease-in-out ${particle.delay} infinite`,
            }}
          />
        ))}
      </div>

      {/* =========================================================
          HERO CONTENT
      ========================================================= */}
      <div className="relative z-10 mx-auto w-full max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] px-4 sm:px-8 lg:px-[50px]">
        <div className="w-full max-w-[620px] 2xl:max-w-[700px] flex flex-col items-start">
          {/* Top Group: Eyebrow + Headline + Subtitle (Constrained width on mobile so car shines on right) */}
          <div className="w-full max-w-[74%] xs:max-w-[70%] sm:max-w-[460px] lg:max-w-[620px] flex flex-col items-start">
            {/* Eyebrow badge — Automotive Marketplace */}
            <div className="mb-2 xs:mb-3 sm:mb-5 inline-flex items-center gap-1.5 sm:gap-2 px-2.5 xs:px-3 py-1 rounded-full bg-[#CEA46B]/10 border border-[#CEA46B]/35 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FAD293] shadow-[0_0_8px_#FAD293] animate-pulse" />
              <span className="text-[9px] xs:text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] sm:tracking-[0.2em] text-[#FAD293]">
                Automotive Marketplace
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl xs:text-3xl sm:text-5xl md:text-6xl lg:text-[62px] 2xl:text-[70px] font-extrabold leading-[1.08] tracking-[-0.03em] text-white">
              Your car services.
              <br />
              One trusted
              <br />
              <span
                className="inline-block"
                style={{
                  background:
                    "linear-gradient(110deg, #FFF0C9 0%, #EAC17D 48%, #C99A58 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                marketplace.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-2 sm:mt-4 text-[11px] xs:text-xs sm:text-base md:text-lg text-white/75 leading-snug sm:leading-relaxed">
              Book repairs, detailing, tyres and upgrades near you.
            </p>
          </div>

          {/* Bottom Group: Action Buttons & Micro Tag (Sits snuggly beneath the car visual) */}
          <div className="w-full flex flex-col items-start mt-6 xs:mt-8 sm:mt-10 lg:mt-8">
            <div className="w-full flex flex-col sm:flex-row gap-2.5 sm:gap-3.5">
              {/* 1. Book a service (Solid Warm Gold Button) */}
              <Link
                href="#services"
                id="hero-book-service-btn"
                className="w-full sm:w-auto sm:min-w-[220px] flex items-center justify-between gap-3 px-5 py-3.5 sm:py-4 rounded-2xl font-bold text-black transition-all duration-300 shadow-[0_8px_25px_rgba(206,164,107,0.3)] hover:shadow-[0_12px_35px_rgba(206,164,107,0.5)] hover:scale-[1.01] active:scale-[0.99] group"
                style={{
                  background:
                    "linear-gradient(135deg, #F3CE8A 0%, #E2B266 50%, #C79549 100%)",
                }}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-black shrink-0" />
                  <span className="text-base sm:text-lg font-bold tracking-tight">
                    Book a service
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-black transition-transform duration-200 group-hover:translate-x-1 shrink-0" />
              </Link>

              {/* 2. Compare quotes (Dark Glass Button with Gold Border) */}
              <Link
                href="#get-quote"
                id="hero-compare-quotes-btn"
                className="w-full sm:w-auto sm:min-w-[220px] flex items-center justify-between gap-3 px-5 py-3.5 sm:py-4 rounded-2xl font-semibold text-white bg-[#0e0d0c]/85 border border-[#CEA46B]/60 backdrop-blur-md transition-all duration-300 hover:border-[#FAD293] hover:bg-[#151413] hover:scale-[1.01] active:scale-[0.99] shadow-lg group"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#FAD293] shrink-0" />
                  <span className="text-base sm:text-lg font-semibold tracking-tight">
                    Compare quotes
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-white/70 transition-transform duration-200 group-hover:translate-x-1 shrink-0" />
              </Link>
            </div>

            {/* Micro tag: Mobile & workshop services */}
            <div className="mt-2.5 sm:mt-4 flex items-center gap-2 text-xs sm:text-sm text-white/60 font-medium">
              <Wrench className="w-4 h-4 text-[#CEA46B]" />
              <span>Mobile & workshop services</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          ANIMATIONS
      ========================================================= */}
      <style jsx>{`
        @keyframes heroParticle {
          0%,
          100% {
            opacity: 0.15;
            transform: scale(0.7);
          }

          50% {
            opacity: 0.65;
            transform: scale(1.4);
          }
        }
      `}</style>
    </section>
  );
}

