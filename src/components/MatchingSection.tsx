"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Zap,
  ShieldCheck,
  Scale,
  MessageSquareCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const matchingPoints = [

];

const keyMetrics = [
 
];

export default function MatchingSection() {
  return (
    <section
      id="matching"
      aria-label="Intelligent Provider Matching"
      className="relative w-full pt-6 pb-2 sm:pt-10 sm:pb-3 lg:pt-14 lg:pb-4 overflow-hidden bg-[#050505]"
    >
      {/* Luxury ambient gold glow background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-1/4 -translate-x-1/2 w-[500px] sm:w-[900px] h-[300px] sm:h-[450px] rounded-full blur-[140px] sm:blur-[190px] opacity-20"
          style={{
            background: "radial-gradient(circle, #FAD293 0%, #CEA46B 45%, transparent 70%)",
          }}
        />
        {/* Subtle architectural dot grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(rgba(250,210,147,0.85) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#050505_100%)]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] px-4 sm:px-8 lg:px-[50px] space-y-8 sm:space-y-12">
        
        {/* Section Header (Centered, bold and balanced) */}
        <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#dcb36d]/10 border border-[#dcb36d]/30 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#FAD293]">
              <Sparkles className="h-3 w-3 text-[#FAD293]" />
              Intelligent Matching Engine
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            The Right Provider,{" "}
            <span className="bg-gradient-to-r from-[#FAD293] via-[#E8AF66] to-[#CEA46B] bg-clip-text text-transparent">
              Every Single Time.
            </span>
          </h2>

          <p className="text-sm sm:text-base lg:text-lg text-white/60 leading-relaxed">
            Our proprietary algorithmic engine evaluates 14+ technical criteria in real-time — connecting your specific vehicle model, location, and budget with certified specialists guaranteed to deliver excellence.
          </p>

          {/* Metrics Pills Row */}
        
        </div>

        {/* Big Prominent Showcase Image (Full-width, crystal clear & high-res) */}
        <div className="relative group">
          <div className="relative w-full rounded-2xl sm:rounded-3xl border border-[#CEA46B]/35 bg-[#0a0705] shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden transition-all duration-500 group-hover:border-[#FAD293]/60 group-hover:shadow-[0_30px_90px_rgba(206,164,107,0.22)]">
            {/* Top gold sheen border line */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#FAD293] to-transparent z-20 pointer-events-none" />

            {/* Showcase Banner Container - exact 1672/742 ratio matching qoutes-2.png */}
            <div className="relative w-full aspect-[1672/742] overflow-hidden bg-black/80">
              <Image
                src="/qoutes-2.png"
                alt="Motor Market Club - Choose With Confidence, Compare Specialists Side by Side"
                fill
                priority
                sizes="(max-width: 1440px) 100vw, 1440px"
                className="w-full h-full object-cover rounded-2xl sm:rounded-3xl transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              />

              {/* Subtle edge vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
            </div>

            {/* Floating Live Matching Status Pill */}
            <div className="absolute top-3 left-3 sm:top-5 sm:left-6 z-20 flex items-center gap-2 rounded-full border border-white/15 bg-black/80 px-3.5 py-1.5 backdrop-blur-md shadow-xl">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FAD293] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FAD293]" />
              </span>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white">
                Live Quotation Engine • Real-Time Bids
              </span>
            </div>

            {/* Floating Verified Specialists Pill at Bottom */}
            <div className="absolute bottom-3 right-3 sm:bottom-5 sm:right-6 z-20 flex items-center gap-1.5 rounded-full border border-[#FAD293]/35 bg-[#120F0C]/90 px-3.5 py-1.5 backdrop-blur-md shadow-xl text-[#FAD293]">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] sm:text-xs font-extrabold tracking-wide text-[#FAD293]">
                100% Certified Specialists
              </span>
            </div>

            {/* Bottom subtle gold sheen bar */}
            <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#CEA46B]/40 to-transparent z-20 pointer-events-none" />
          </div>
        </div>



        {/* Bottom Call to Action Strip */}
        <div className="pt-0 sm:pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-6 text-center">
       
        </div>

      </div>
    </section>
  );
}
