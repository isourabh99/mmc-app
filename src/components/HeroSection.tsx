"use client";

import { useEffect, useState } from "react";

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
      className="relative min-h-[260px] sm:min-h-[460px] md:min-h-[520px] lg:min-h-[580px] 2xl:min-h-[640px] overflow-hidden bg-[#050505] text-white flex items-center pt-4 sm:pt-10 md:pt-14 lg:pt-16 2xl:pt-20 pb-6 sm:pb-12 lg:pb-16 2xl:pb-20"
    >
      {/* =========================================================
          BACKGROUND IMAGE
      ========================================================= */}
      <div
        className="absolute inset-0 bg-no-repeat bg-cover bg-[position:80%_center] sm:bg-[position:center_right] lg:bg-[position:right_center] 2xl:bg-[position:right_center]"
        style={{
          backgroundImage: "url('/hero-bg1.png')",
        }}
      />

      {/* Mobile contrast overlay for readability */}
      <div className="absolute inset-0 bg-black/60 sm:hidden" />

      {/* Desktop/Tablet dark gradient — keeps left readable while revealing car */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(
              90deg,
              rgba(3,3,3,0.98) 0%,
              rgba(3,3,3,0.93) 30%,
              rgba(3,3,3,0.78) 55%,
              rgba(3,3,3,0.42) 78%,
              rgba(3,3,3,0.22) 100%
            )
          `,
        }}
      />

      {/* Top black cinematic fade */}
      <div
        className="absolute inset-x-0 top-0 h-16 sm:h-44 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)",
        }}
      />

      {/* Bottom cinematic fade */}
      <div
        className="absolute inset-x-0 bottom-0 h-16 sm:h-56 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(3,3,3,0.98), transparent)",
        }}
      />

      {/* Gold ambient glow */}
      <div
        className="absolute -right-20 top-1/4 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full pointer-events-none opacity-40 sm:opacity-100"
        style={{
          background:
            "radial-gradient(circle, rgba(218,170,93,0.14), transparent 68%)",
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
          CONTENT
      ========================================================= */}
      <div className="relative z-10 mx-auto w-full max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] px-4 sm:px-8 lg:px-[50px]">
        <div className="w-full max-w-[700px] 2xl:max-w-[820px]">
          {/* Eyebrow badge */}
          <div className="mb-2.5 sm:mb-6 inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-[#CEA46B]/10 border border-[#CEA46B]/25 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FAD293] shadow-[0_0_8px_#FAD293] animate-pulse" />
            <span className="text-[9px] sm:text-xs font-semibold uppercase tracking-[0.18em] sm:tracking-[0.2em] text-[#FAD293]">
              Automotive Marketplace
            </span>
          </div>

          {/* =====================================================
              HEADLINE
          ===================================================== */}
          <h1 className="text-2xl sm:text-5xl md:text-6xl lg:text-[60px] 2xl:text-[68px] font-bold leading-[1.18] sm:leading-[1.08] tracking-[-0.03em] text-white">
            Book trusted <br className="hidden sm:block" />
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
              car services
            </span>{" "}
            near you.
          </h1>

          {/* Description */}
          <p className="mt-2.5 sm:mt-6 text-xs sm:text-base md:text-lg 2xl:text-xl text-white/75 leading-relaxed max-w-[600px] 2xl:max-w-[720px]">
            Mobile repairs, detailing, tyres and vehicle upgrades — all in one place.
          </p>
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

