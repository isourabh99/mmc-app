"use client";

import { useEffect, useState } from "react";

type Particle = {
  id: number;
  top: string;
  left: string;
  duration: string;
  delay: string;
};

const categories = [
  {
    label: "Smart Repair",
    desc: "SMART paintless dent removal & touch-ups",
    id: "smart-repair",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className="w-[17px] h-[17px]"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.7 6.3a4 4 0 005 5L12 19l-3-3 7.7-7.7a4 4 0 01-2-2z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.5 13.5L4 17l3 3 3.5-3.5"
        />
      </svg>
    ),
  },
  {
    label: "Denting & Painting",
    desc: "Full body respray & panel beating",
    id: "denting-painting",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className="w-[17px] h-[17px]"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 18h16"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18V7h12v11"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 7V4h8v3"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 11h6"
        />
      </svg>
    ),
  },
  {
    label: "Modifications",
    desc: "Performance & aesthetic upgrades",
    id: "modifications",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className="w-[17px] h-[17px]"
      >
        <circle cx="12" cy="12" r="3" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5v.1h-2.6v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H4v-2.6h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1L7 5.9l.1.1a1.7 1.7 0 001.9.3 1.7 1.7 0 001-1.5v-.1h2.6v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 00-.3 1.9 1.7 1.7 0 001.5 1h.1v2.6h-.1a1.7 1.7 0 00-1.1 1z"
        />
      </svg>
    ),
  },
  {
    label: "Tyres",
    desc: "Fitting, balancing & alignment",
    id: "tyres",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className="w-[17px] h-[17px]"
      >
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="2.5" />
        <path
          strokeLinecap="round"
          d="M12 4v2M12 18v2M4 12h2M18 12h2"
        />
      </svg>
    ),
  },
  {
    label: "Car Wash",
    desc: "Detailing, valeting & ceramic coat",
    id: "car-wash",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className="w-[17px] h-[17px]"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3c0 3-4 5.2-4 9a4 4 0 008 0c0-3.8-4-6-4-9z"
        />
        <path
          strokeLinecap="round"
          d="M6 18c1.5 1.3 3.5 2 6 2s4.5-.7 6-2"
        />
      </svg>
    ),
  },
  {
    label: "Chauffeur",
    desc: "Executive & event transport",
    id: "chauffeur",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className="w-[17px] h-[17px]"
      >
        <circle cx="12" cy="7" r="3" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 21a7 7 0 0114 0"
        />
      </svg>
    ),
  },
  {
    label: "Car Rental",
    desc: "Premium fleet hire & leasing",
    id: "car-rental",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className="w-[17px] h-[17px]"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 16h10l1.5-5H5.5L7 16z"
        />
        <path
          strokeLinecap="round"
          d="M8 11l1.5-3h5L16 11"
        />
        <circle cx="8.5" cy="17" r="1.3" />
        <circle cx="15.5" cy="17" r="1.3" />
      </svg>
    ),
  },
];



export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [location, setLocation] = useState("");
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

  const handleSearch = () => {
    // Static/raw-data behavior only.
    // No backend/API call.
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen overflow-hidden bg-[#050505] text-white"
    >
      {/* =========================================================
          BACKGROUND IMAGE
      ========================================================= */}

      <div
        className="absolute inset-0 bg-no-repeat"
        style={{
          backgroundImage: "url('/hero-bg1.png')",
          backgroundSize: "cover",
          backgroundPosition: "center right",
        }}
      />

      {/* Dark gradient — keeps LEFT side readable while preserving car */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(
              90deg,
              rgba(3,3,3,0.97) 0%,
              rgba(3,3,3,0.91) 24%,
              rgba(3,3,3,0.72) 46%,
              rgba(3,3,3,0.34) 72%,
              rgba(3,3,3,0.18) 100%
            )
          `,
        }}
      />

      {/* Top black cinematic fade */}
      <div
        className="absolute inset-x-0 top-0 h-44"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.72), transparent)",
        }}
      />

      {/* Bottom cinematic fade */}
      <div
        className="absolute inset-x-0 bottom-0 h-56"
        style={{
          background:
            "linear-gradient(to top, rgba(3,3,3,0.95), transparent)",
        }}
      />

      {/* Gold ambient glow */}
      <div
        className="absolute -right-20 top-1/3 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(218,170,93,0.10), transparent 68%)",
          filter: "blur(30px)",
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

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] items-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-[700px] pt-14 pb-20 sm:pt-20 lg:pt-1">
          {/* Eyebrow */}
          <div className="mb-5 flex items-center gap-3">
            <span
              className="h-px w-9 sm:w-12"
              style={{
                background:
                  "linear-gradient(90deg, #F6D18D, rgba(246,209,141,0.2))",
              }}
            />

            <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.28em] text-[#EAC17D]">
              Premium Automotive Marketplace
            </span>
          </div>

          {/* =====================================================
              HEADLINE
          ===================================================== */}

          <h1 className="max-w-[680px] text-[40px] font-semibold leading-[1.04] tracking-[-0.035em] sm:text-[52px] md:text-[60px] lg:text-[64px]">
            Find the Right{" "}
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
              Vehicle Service
            </span>{" "}
            <br className="hidden sm:block" />
            Instantly.
          </h1>

          {/* Description */}
          <p className="mt-6 max-w-[610px] text-[15px] leading-7 text-white/55 sm:text-[17px] sm:leading-8">
            Connect with certified automotive professionals across the UK.
            Get competitive quotes, compare providers, and book with
            confidence — all in one place.
          </p>

          {/* =====================================================
              SEARCH
          ===================================================== */}

         

          {/* =====================================================
              CATEGORY PILLS
          ===================================================== */}

   

          
        </div>
      </div>

     

      {/* =========================================================
          ANIMATIONS
      ========================================================= */}

      <style jsx>{`
        @keyframes scrollLine {
          0% {
            transform: translateY(-120%);
            opacity: 0;
          }

          20% {
            opacity: 1;
          }

          70% {
            opacity: 1;
          }

          100% {
            transform: translateY(350%);
            opacity: 0;
          }
        }

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