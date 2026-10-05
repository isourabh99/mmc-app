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
      className="relative min-h-[300px] sm:min-h-[380px] md:min-h-[440px] lg:min-h-[500px] overflow-hidden bg-[#050505] text-white flex items-center pt-10 pb-8 sm:pt-14 sm:pb-12 lg:pt-16 lg:pb-14"
    >
      {/* =========================================================
          BACKGROUND IMAGE
      ========================================================= */}
      <div
        className="absolute inset-0 bg-no-repeat bg-cover bg-[position:70%_center] sm:bg-[position:center_right]"
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
        className="absolute inset-x-0 top-0 h-28 sm:h-44 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)",
        }}
      />

      {/* Bottom cinematic fade */}
      <div
        className="absolute inset-x-0 bottom-0 h-32 sm:h-56 pointer-events-none"
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
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-[700px]">
          {/* Eyebrow badge */}
          <div className="mb-3 sm:mb-5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#CEA46B]/10 border border-[#CEA46B]/25 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FAD293] shadow-[0_0_8px_#FAD293] animate-pulse" />
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[#FAD293]">
              Automotive Marketplace
            </span>
          </div>

          {/* =====================================================
              HEADLINE
          ===================================================== */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[64px] font-bold leading-[1.12] sm:leading-[1.06] tracking-[-0.03em] text-white">
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
          <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-white/70 leading-relaxed max-w-[600px]">
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

