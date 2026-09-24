"use client";

import React from "react";
import Link from "next/link";
import {
  Siren,
  Phone,
  Disc,
  Wrench,
  ShieldCheck,
  Clock,
  MapPin,
  Car,
  ChevronRight,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";

export default function EmergencyAssistancePage() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden pb-20">
      {/* Background Ambient Red/Gold Emergency Glows */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full blur-[140px] opacity-20 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #ef4444 0%, #b91c1c 40%, transparent 80%)",
        }}
      />
      <div
        className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full blur-[160px] opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #FAD293, transparent)",
        }}
      />

      <div className="max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-6 sm:pt-10 space-y-10">
        {/* 1. Emergency Hero Banner */}
        <div className="relative rounded-3xl p-6 sm:p-10 lg:p-12 border border-red-500/30 bg-gradient-to-br from-red-950/40 via-black to-[#120e0b] shadow-2xl overflow-hidden">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-red-500/40 bg-red-500/15 text-red-400 text-xs font-bold uppercase tracking-widest animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>24/7 Priority Emergency Dispatch</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              Rapid Roadside <br />
              <span className="text-red-500">Emergency Assistance</span>
            </h1>

            <p className="text-sm sm:text-base text-white/70 max-w-xl leading-relaxed">
              Stranded on the road or motorway? MMC provides immediate roadside dispatch, emergency tyre replacement, and priority mobile vehicle rescue across the United Kingdom.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-4">
              <a
                href="tel:+448001234567"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-xl shadow-red-600/30 hover:scale-[1.02] active:scale-98 transition duration-200"
              >
                <Phone size={18} strokeWidth={2.5} />
                <span>Call Emergency Hotline (0800 123 4567)</span>
              </a>

              <Link
                href="/tyre-fittings"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border border-[#FAD293]/40 bg-[#FAD293]/10 hover:bg-[#FAD293]/20 text-[#FAD293] font-bold text-sm transition"
              >
                <Disc size={18} />
                <span>Emergency Tyre Rescue</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 2. Rapid Emergency Services Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Emergency Services On Demand</h2>
              <p className="text-xs sm:text-sm text-white/50">Select your emergency category for instant matching</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Service 1: Emergency Tyre Fitting */}
            <div className="p-6 rounded-3xl border border-white/10 bg-[#120e0b]/80 hover:border-red-500/40 transition duration-300 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Disc size={24} />
                </div>
                <h3 className="text-lg font-bold text-white">Roadside Tyre Blowout</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Punctures, blowouts or damaged wheels. Mobile fitting units dispatched to your exact live GPS location within 30-60 minutes.
                </p>
              </div>

              <Link
                href="/tyre-fittings"
                className="inline-flex items-center justify-between w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition group"
              >
                <span>Book Emergency Tyre</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition text-[#FAD293]" />
              </Link>
            </div>

            {/* Service 2: Mobile Valet / Emergency Cleaning */}
            <div className="p-6 rounded-3xl border border-white/10 bg-[#120e0b]/80 hover:border-[#FAD293]/40 transition duration-300 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FAD293]/15 border border-[#FAD293]/30 flex items-center justify-center text-[#FAD293]">
                  <Car size={24} />
                </div>
                <h3 className="text-lg font-bold text-white">Mobile Valet & Deep Wash</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Urgent doorstep interior and exterior detailing with fully self-powered mobile vans with water and generators.
                </p>
              </div>

              <Link
                href="/services/valet-wash"
                className="inline-flex items-center justify-between w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition group"
              >
                <span>Book Mobile Valet</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition text-[#FAD293]" />
              </Link>
            </div>

            {/* Service 3: Chauffeur Emergency Transfer */}
            <div className="p-6 rounded-3xl border border-white/10 bg-[#120e0b]/80 hover:border-[#FAD293]/40 transition duration-300 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FAD293]/15 border border-[#FAD293]/30 flex items-center justify-center text-[#FAD293]">
                  <Clock size={24} />
                </div>
                <h3 className="text-lg font-bold text-white">Emergency Chauffeur Transfer</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Immediate executive car dispatch for flight connections, urgent business meetings, or unexpected travel emergencies.
                </p>
              </div>

              <Link
                href="/services/Chauffeur"
                className="inline-flex items-center justify-between w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition group"
              >
                <span>Request Chauffeur</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition text-[#FAD293]" />
              </Link>
            </div>
          </div>
        </div>

        {/* 3. Safety Guidance Banner */}
        <div className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-white/[0.02] space-y-4">
          <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
            <AlertTriangle size={18} />
            <span>Roadside Safety Checklist</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-white/70">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
              <strong className="text-white block text-sm">1. Turn On Hazard Lights</strong>
              <span>Immediately turn on hazard warning lights and move vehicle to the hard shoulder or safe location if possible.</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
              <strong className="text-white block text-sm">2. Exit on Passenger Side</strong>
              <span>Stay clear of moving traffic by exiting the vehicle through the left passenger doors and wait behind the barrier.</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
              <strong className="text-white block text-sm">3. Share Live Location</strong>
              <span>Call our dispatch line or share your live WhatsApp/Google Maps GPS location for immediate mobile routing.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}