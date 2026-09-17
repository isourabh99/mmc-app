"use client";
import { useState, useEffect } from "react";

type Particle = {
  id: number;
  top: string;
  left: string;
  duration: string;
  delay: string;
};

const categories = [
  { icon: "🔧", label: "Smart Repair", desc: "SMART paintless dent removal & touch-ups", id: "smart-repair" },
  { icon: "🎨", label: "Denting & Painting", desc: "Full body respray & panel beating", id: "denting-painting" },
  { icon: "⚙️", label: "Modifications", desc: "Performance & aesthetic upgrades", id: "modifications" },
  { icon: "🛞", label: "Tyres", desc: "Fitting, balancing & alignment", id: "tyres" },
  { icon: "🫧", label: "Car Wash", desc: "Detailing, valeting & ceramic coat", id: "car-wash" },
  { icon: "🚗", label: "Chauffeur", desc: "Executive & event transport", id: "chauffeur" },
  { icon: "🔑", label: "Car Rental", desc: "Premium fleet hire & leasing", id: "car-rental" },
];

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [location, setLocation] = useState("");
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        duration: `${(2 + Math.random() * 3).toFixed(2)}s`,
        delay: `${(Math.random() * 2).toFixed(2)}s`,
      }))
    );
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
      style={{
        backgroundImage: "url('/hero-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/65 z-0" />
      {/* Gold glow bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48 z-0"
        style={{
          background:
            "linear-gradient(to top, rgba(206,164,107,0.12), transparent)",
        }}
      />
      {/* Subtle animated particles — client-only to avoid hydration mismatch */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute w-1 h-1 rounded-full opacity-30"
            style={{
              background: "linear-gradient(135deg, #FAD293, #CEA46B)",
              top: p.top,
              left: p.left,
              animation: `pulse ${p.duration} ease-in-out ${p.delay} infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 l mx-auto px-6 pt-28 pb-16 w-full">
        {/* Badge */}
        <div className="flex items-center gap-2 mb-6">
          <div
            className="h-px w-10"
            style={{ background: "linear-gradient(90deg, #FAD293, #CEA46B)" }}
          />
          <span
            className="text-xs font-semibold tracking-[0.25em] uppercase"
            style={{
              background: "linear-gradient(135deg, #FAD293, #CEA46B)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Premium Automotive Marketplace
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight max-w-4xl mb-6">
          Find the Right{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #FAD293, #CEA46B)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Vehicle Service
          </span>{" "}
          <br className="hidden md:block" />
          Instantly.
        </h1>

        <p className="text-lg md:text-xl text-white/60 max-w-2xl mb-10 leading-relaxed">
          Connect with certified automotive professionals across the UK. Get
          competitive quotes, compare providers, and book with confidence — all
          in one place.
        </p>

        {/* Search Bar */}
        <div className="max-w-3xl bg-white/5 backdrop-blur-xl rounded-2xl border border-[#FAD293]/20 p-2 mb-10 shadow-[0_8px_40px_rgba(206,164,107,0.12)]">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
              <svg className="w-5 h-5 text-[#FAD293] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="hero-search-input"
                type="text"
                placeholder="What service do you need?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-white placeholder-white/30 text-sm w-full outline-none"
              />
            </div>
            <div className="flex-1 flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
              <svg className="w-5 h-5 text-[#FAD293] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                id="hero-location-input"
                type="text"
                placeholder="Your location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-transparent text-white placeholder-white/30 text-sm w-full outline-none"
              />
            </div>
            <button
              id="hero-search-btn"
              className="px-6 py-3 rounded-xl font-semibold text-black text-sm transition-all duration-300 hover:shadow-[0_0_24px_rgba(250,210,147,0.4)] hover:scale-105 shrink-0"
              style={{ background: "linear-gradient(135deg, #FAD293, #CEA46B)" }}
            >
              Search Services
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-3 mb-14">
          {categories.map((cat) => (
            <button
              key={cat.id}
              id={`cat-pill-${cat.id}`}
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === cat.id ? "" : cat.id
                )
              }
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all duration-300 border ${
                selectedCategory === cat.id
                  ? "text-black border-transparent"
                  : "bg-white/5 border-white/10 text-white/70 hover:border-[#FAD293]/40 hover:text-white"
              }`}
              style={
                selectedCategory === cat.id
                  ? { background: "linear-gradient(135deg, #FAD293, #CEA46B)" }
                  : {}
              }
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-10">
          {[
            { value: "2,400+", label: "Certified Providers" },
            { value: "98%", label: "Satisfaction Rate" },
            { value: "60s", label: "Average Quote Time" },
            { value: "50K+", label: "Happy Customers" },
          ].map((stat) => (
            <div key={stat.label}>
              <p
                className="text-3xl font-bold"
                style={{
                  background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {stat.value}
              </p>
              <p className="text-sm text-white/40 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <span className="text-xs text-white/30 tracking-widest uppercase">Scroll</span>
        <div className="w-px h-12 relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to bottom, #FAD293, transparent)",
              animation: "scrollLine 2s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes scrollLine {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
      `}</style>
    </section>
  );
}
