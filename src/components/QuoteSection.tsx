"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth.api";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Wrench,
  Car,
  MapPin,
  User,
  FileText,
} from "lucide-react";

export default function QuoteSection() {
  const router = useRouter();
  const [serviceType, setServiceType] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [postcode, setPostcode] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    if (serviceType === "chauffeur") {
      router.push("/services/Chauffeur");
    } else if (serviceType === "car-rental") {
      router.push("/car-hire");
    } else if (serviceType === "tyres") {
      router.push("/tyre-fittings");
    } else if (serviceType === "car-wash") {
      router.push("/services/valet-wash");
    } else if (serviceType === "alloy-refurbishment") {
      router.push("/services/alloy-wheel");
    } else if (serviceType === "denting-painting" || serviceType === "smart-repair") {
      router.push("/services/bodywork");
    } else if (serviceType === "modifications") {
      router.push("/services/modification");
    } else {
      router.push("/services");
    }
  };

  return (
    <section
      id="get-quote"
      aria-label="Request a Free Quote"
      className="relative w-full pt-1 pb-6 sm:pt-2 sm:pb-10 lg:pt-2 lg:pb-12 overflow-hidden bg-[#050505]"
    >
      {/* Luxury ambient gold glow background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute right-1/4 top-1/2 -translate-y-1/2 w-[350px] sm:w-[550px] h-[220px] sm:h-[350px] rounded-full blur-[120px] sm:blur-[160px] opacity-20"
          style={{
            background: "radial-gradient(circle, #FAD293 0%, #CEA46B 45%, transparent 70%)",
          }}
        />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(rgba(250,210,147,0.85) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#050505_100%)]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] px-4 sm:px-8 lg:px-[50px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-stretch">
          
          {/* Left Column: 100% Uncropped Full-Fit Graphic Banner Card */}
          <div className="relative group flex flex-col justify-center">
            <div className="relative w-full rounded-2xl sm:rounded-3xl border border-[#CEA46B]/35 bg-[#0a0705] shadow-[0_20px_70px_rgba(0,0,0,0.85)] overflow-hidden transition-all duration-500 group-hover:border-[#FAD293]/60 group-hover:shadow-[0_25px_80px_rgba(206,164,107,0.2)]">
              {/* Top gold sheen border line */}
              <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#FAD293] to-transparent z-20 pointer-events-none" />

              {/* Exact 1122/881 native aspect ratio: zero cropping of any text, logos, or graphics */}
              <div className="relative w-full aspect-[1122/881] overflow-hidden bg-black">
                <Image
                  src="/homesection.jpeg"
                  alt="Motor Market Club - From Photo to Quote in Minutes"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="w-full h-full object-contain rounded-2xl sm:rounded-3xl transition-transform duration-500 ease-out group-hover:scale-[1.01]"
                />
              </div>

              {/* Bottom subtle gold sheen bar */}
              <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#CEA46B]/40 to-transparent z-20 pointer-events-none" />
            </div>
          </div>

          {/* Right Column: Compact Luxury Quote Form Card (Equal Matching Height) */}
          <div className="relative flex flex-col justify-center">
            <div className="relative w-full rounded-2xl sm:rounded-3xl border border-[#CEA46B]/35 bg-[#0E0C0A]/95 p-4 sm:p-5 lg:p-6 shadow-[0_25px_80px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col justify-between">
              {/* Top gold sheen border line */}
              <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#FAD293] to-transparent z-20 pointer-events-none" />

              <div>
                {/* Compact Form Header */}
                <div className="mb-2.5 sm:mb-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#dcb36d]/10 border border-[#dcb36d]/30 text-[9px] font-bold uppercase tracking-widest text-[#FAD293] mb-1">
                    <Sparkles className="w-2.5 h-2.5 text-[#FAD293]" />
                    Get Instant Estimate
                  </div>

                  <h3 className="text-lg sm:text-xl lg:text-2xl font-extrabold tracking-tight text-white leading-tight">
                    Request a{" "}
                    <span className="bg-gradient-to-r from-[#FAD293] via-[#E8AF66] to-[#CEA46B] bg-clip-text text-transparent">
                      Free Quote
                    </span>
                  </h3>

                  <p className="text-[11px] sm:text-xs text-white/50 leading-tight mt-0.5">
                    Compare competitive quotes from top-rated specialists in under 60 seconds.
                  </p>
                </div>

                {/* Form Elements (Sleek and Compact) */}
                <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-2.5">
                  {/* Row 1: First Name & Last Name */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                    <div>
                      <label className="text-[10px] font-semibold text-white/60 mb-0.5 flex items-center gap-1">
                        <User className="w-2.5 h-2.5 text-[#FAD293]" />
                        First Name
                      </label>
                      <input
                        id="quote-first-name"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="w-full bg-white/[0.04] border border-white/10 hover:border-[#CEA46B]/40 focus:border-[#FAD293] rounded-lg px-2.5 py-1.5 sm:py-2 text-xs text-white placeholder-white/30 outline-none transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-white/60 mb-0.5 flex items-center gap-1">
                        <User className="w-2.5 h-2.5 text-[#FAD293]" />
                        Last Name
                      </label>
                      <input
                        id="quote-last-name"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Smith"
                        className="w-full bg-white/[0.04] border border-white/10 hover:border-[#CEA46B]/40 focus:border-[#FAD293] rounded-lg px-2.5 py-1.5 sm:py-2 text-xs text-white placeholder-white/30 outline-none transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Row 2: Service Type Selector */}
                  <div>
                    <label className="text-[10px] font-semibold text-white/60 mb-0.5 flex items-center gap-1">
                      <Wrench className="w-2.5 h-2.5 text-[#FAD293]" />
                      Service Type
                    </label>
                    <div className="relative">
                      <select
                        id="quote-service-type"
                        value={serviceType}
                        onChange={(e) => setServiceType(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/10 hover:border-[#CEA46B]/40 focus:border-[#FAD293] rounded-lg px-2.5 py-1.5 sm:py-2 text-xs text-white outline-none transition-all duration-200 appearance-none cursor-pointer pr-8"
                      >
                        <option value="" className="bg-[#120F0C] text-white/60">Select a service</option>
                        <option value="smart-repair" className="bg-[#120F0C] text-white">Smart Repair & Scratch Removal</option>
                        <option value="denting-painting" className="bg-[#120F0C] text-white">Denting & Bodywork</option>
                        <option value="alloy-refurbishment" className="bg-[#120F0C] text-white">Alloy Wheel Refurbishment</option>
                        <option value="modifications" className="bg-[#120F0C] text-white">Performance & Modifications</option>
                        <option value="tyres" className="bg-[#120F0C] text-white">Mobile & Garage Tyre Fitting</option>
                        <option value="car-wash" className="bg-[#120F0C] text-white">Luxury Valeting & Detail Wash</option>
                        <option value="chauffeur" className="bg-[#120F0C] text-white">Executive Chauffeur Service</option>
                        <option value="car-rental" className="bg-[#120F0C] text-white">Prestige Car Rental</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-white/40 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Row 3: Vehicle & Postcode */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                    <div>
                      <label className="text-[10px] font-semibold text-white/60 mb-0.5 flex items-center gap-1">
                        <Car className="w-2.5 h-2.5 text-[#FAD293]" />
                        Vehicle (Make & Model)
                      </label>
                      <input
                        id="quote-vehicle"
                        type="text"
                        value={vehicle}
                        onChange={(e) => setVehicle(e.target.value)}
                        placeholder="e.g. BMW 3 Series"
                        className="w-full bg-white/[0.04] border border-white/10 hover:border-[#CEA46B]/40 focus:border-[#FAD293] rounded-lg px-2.5 py-1.5 sm:py-2 text-xs text-white placeholder-white/30 outline-none transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-white/60 mb-0.5 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-[#FAD293]" />
                        Postcode
                      </label>
                      <input
                        id="quote-postcode"
                        type="text"
                        value={postcode}
                        onChange={(e) => setPostcode(e.target.value)}
                        placeholder="e.g. SW1A 1AA"
                        className="w-full bg-white/[0.04] border border-white/10 hover:border-[#CEA46B]/40 focus:border-[#FAD293] rounded-lg px-2.5 py-1.5 sm:py-2 text-xs text-white placeholder-white/30 outline-none transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Row 4: Describe Needs */}
                  <div>
                    <label className="text-[10px] font-semibold text-white/60 mb-0.5 flex items-center gap-1">
                      <FileText className="w-2.5 h-2.5 text-[#FAD293]" />
                      Describe Your Needs
                    </label>
                    <textarea
                      id="quote-description"
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Tell us what you need done..."
                      className="w-full bg-white/[0.04] border border-white/10 hover:border-[#CEA46B]/40 focus:border-[#FAD293] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/30 outline-none transition-all duration-200 resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    id="quote-submit-btn"
                    type="submit"
                    className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-[#FAD293] via-[#E8AF66] to-[#CEA46B] text-[#0A0806] font-black text-xs sm:text-sm tracking-wide shadow-[0_4px_20px_rgba(206,164,107,0.3)] hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer mt-0.5"
                  >
                    <span>Get My Free Quotes</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

              {/* Trust Footer */}
              <div className="pt-2 text-center flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-[#FAD293] shrink-0" />
                <span className="text-[10px] text-white/50">
                  100% Free • No obligation • Instant quotes
                </span>
              </div>

              {/* Bottom subtle gold sheen bar */}
              <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#CEA46B]/40 to-transparent z-20 pointer-events-none" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
