"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth.api";

export default function QuoteSection() {
  const router = useRouter();
  const [serviceType, setServiceType] = useState("");

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
      className="py-16 sm:py-24 relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #050400, #000)" }}
    >
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(250,210,147,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(250,210,147,0.3) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Graphic Banner */}
          <div className="relative w-full rounded-3xl overflow-hidden border border-[#CEA46B]/25 bg-[#120E0B] shadow-[0_25px_80px_rgba(0,0,0,0.6)]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FAD293]/60 to-transparent z-10" />
            <Image
              src="/homesection.jpeg"
              alt="Motor Market Connect - From Photo to Quote in Minutes"
              width={1200}
              height={900}
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="w-full h-auto block rounded-3xl object-contain transition-transform duration-500 hover:scale-[1.01]"
            />
          </div>

          {/* Right: Quote form card */}
          <div
            className="rounded-3xl p-8 backdrop-blur-xl"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(250,210,147,0.15)",
              boxShadow: "0 25px 80px rgba(0,0,0,0.5)",
            }}
          >
            <h3 className="text-xl font-bold mb-6">
              Request a{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Free Quote
              </span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block tracking-wide">First Name</label>
                  <input
                    id="quote-first-name"
                    type="text"
                    placeholder="John"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-[#FAD293]/40 transition-colors duration-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block tracking-wide">Last Name</label>
                  <input
                    id="quote-last-name"
                    type="text"
                    placeholder="Smith"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-[#FAD293]/40 transition-colors duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block tracking-wide">Service Type</label>
                <select
                  id="quote-service-type"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/70 outline-none focus:border-[#FAD293]/40 transition-colors duration-200 appearance-none"
                >
                  <option value="" className="bg-black">Select a service</option>
                  <option value="smart-repair" className="bg-black">Smart Repair</option>
                  <option value="denting-painting" className="bg-black">Denting & Painting</option>
                  <option value="modifications" className="bg-black">Modifications</option>
                  <option value="tyres" className="bg-black">Tyres</option>
                  <option value="car-wash" className="bg-black">Car Wash</option>
                  <option value="chauffeur" className="bg-black">Chauffeur</option>
                  <option value="alloy-refurbishment" className="bg-black">Alloy Refurbishment</option>
                  <option value="car-rental" className="bg-black">Car Rental</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block tracking-wide">Vehicle (Make & Model)</label>
                <input
                  id="quote-vehicle"
                  type="text"
                  placeholder="e.g. BMW 3 Series 2021"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-[#FAD293]/40 transition-colors duration-200"
                />
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block tracking-wide">Postcode</label>
                <input
                  id="quote-postcode"
                  type="text"
                  placeholder="e.g. SW1A 1AA"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-[#FAD293]/40 transition-colors duration-200"
                />
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block tracking-wide">Describe Your Needs</label>
                <textarea
                  id="quote-description"
                  rows={3}
                  placeholder="Tell us what you need done..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-[#FAD293]/40 transition-colors duration-200 resize-none"
                />
              </div>

              <button
                id="quote-submit-btn"
                type="submit"
                className="w-full py-4 rounded-xl font-bold text-black text-sm transition-all duration-300 hover:shadow-[0_0_30px_rgba(250,210,147,0.35)] hover:scale-[1.01]"
                style={{ background: "linear-gradient(135deg, #FAD293, #CEA46B)" }}
              >
                Get My Free Quotes →
              </button>

              <p className="text-center text-xs text-white/30">
                Free & no obligation • Results in under 60 seconds
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
