"use client";

import React from "react";
import { Disc, Truck, ArrowRight, ShieldCheck, MapPin, Wrench, Check } from "lucide-react";
import { AssistanceType } from "@/lib/data/tyre-assistance.data";
import { TyreAssistanceHeader } from "./TyreAssistanceHeader";

interface AssistanceTypeStepProps {
  selectedType: AssistanceType;
  onSelectType: (type: AssistanceType) => void;
  onContinue: () => void;
  onBack: () => void;
}

export const AssistanceTypeStep: React.FC<AssistanceTypeStepProps> = ({
  selectedType,
  onSelectType,
  onContinue,
  onBack,
}) => {
  return (
    <div className="w-full space-y-6">
      {/* Mobile Header */}
      <div className="lg:hidden">
        <TyreAssistanceHeader showLogo onBack={onBack} />
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block space-y-1.5 pb-2 border-b border-white/10">
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Disc size={22} className="text-[#FAD293]" />
          Choose Assistance Type
        </h2>
        <p className="text-xs text-white/60">
          Decide whether you need a mobile technician dispatched directly to your vehicle, or a recovery truck to transport your vehicle.
        </p>
      </div>

      {/* Assistance Options (Grid: 1 col on mobile, 2 col on desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option 1: Mobile Tyre */}
        <div
          onClick={() => onSelectType("mobile_tyre")}
          className={`cursor-pointer rounded-3xl p-5 sm:p-6 transition-all duration-200 border relative select-none flex flex-col justify-between min-h-[220px] ${
            selectedType === "mobile_tyre"
              ? "bg-[#17130f] border-[#FAD293] shadow-[0_0_30px_rgba(250,210,147,0.15)] ring-1 ring-[#FAD293]/30"
              : "bg-[#141210] border-white/10 hover:border-white/20 hover:bg-[#181512]"
          }`}
        >
          <div>
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#FAD293]/10 border border-[#FAD293]/20 flex items-center justify-center text-[#FAD293]">
                <Wrench size={22} />
              </div>

              {/* Radio Indicator */}
              <div
                className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                  selectedType === "mobile_tyre"
                    ? "border-[#FAD293] bg-[#FAD293]/20"
                    : "border-white/30"
                }`}
              >
                {selectedType === "mobile_tyre" && (
                  <div className="w-3 h-3 rounded-full bg-[#FAD293]" />
                )}
              </div>
            </div>

            <div className="space-y-1.5 mt-4">
              <h3 className="text-lg font-bold text-white">Mobile Tyre</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                A tyre expert will come directly to your home, office, or roadside location with all necessary equipment.
              </p>
            </div>
          </div>

          {/* Feature Badges */}
          <div className="space-y-1.5 pt-4 border-t border-white/5 text-[11px] text-white/70">
            <div className="flex items-center gap-1.5">
              <Check size={13} className="text-[#FAD293]" />
              <span>Full mobile mounting & computerized wheel balancing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check size={13} className="text-[#FAD293]" />
              <span>Old tyre environmental disposal included</span>
            </div>
          </div>
        </div>

        {/* Option 2: Recovery Truck */}
        <div
          onClick={() => onSelectType("recovery_truck")}
          className={`cursor-pointer rounded-3xl p-5 sm:p-6 transition-all duration-200 border relative select-none flex flex-col justify-between min-h-[220px] ${
            selectedType === "recovery_truck"
              ? "bg-[#17130f] border-[#FAD293] shadow-[0_0_30px_rgba(250,210,147,0.15)] ring-1 ring-[#FAD293]/30"
              : "bg-[#141210] border-white/10 hover:border-white/20 hover:bg-[#181512]"
          }`}
        >
          <div>
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#FAD293]/10 border border-[#FAD293]/20 flex items-center justify-center text-[#FAD293]">
                <Truck size={22} />
              </div>

              {/* Radio Indicator */}
              <div
                className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                  selectedType === "recovery_truck"
                    ? "border-[#FAD293] bg-[#FAD293]/20"
                    : "border-white/30"
                }`}
              >
                {selectedType === "recovery_truck" && (
                  <div className="w-3 h-3 rounded-full bg-[#FAD293]" />
                )}
              </div>
            </div>

            <div className="space-y-1.5 mt-4">
              <h3 className="text-lg font-bold text-white">Recovery Truck</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Get picked up and taken safely to an authorized partner garage that has your exact tyre dimensions in stock.
              </p>
            </div>
          </div>

          {/* Feature Badges */}
          <div className="space-y-1.5 pt-4 border-t border-white/5 text-[11px] text-white/70">
            <div className="flex items-center gap-1.5">
              <Check size={13} className="text-[#FAD293]" />
              <span>Full flatbed transport with zero vehicle drag</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check size={13} className="text-[#FAD293]" />
              <span>Motorway recovery approved & insured</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button Container */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={onBack}
          className="hidden lg:inline-flex px-6 py-3 rounded-2xl text-xs font-semibold text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
        >
          Back
        </button>

        <button
          type="button"
          onClick={onContinue}
          className="w-full lg:w-auto lg:min-w-[240px] py-4 px-8 rounded-2xl text-sm font-bold text-black flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all shadow-xl cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #FAD293 0%, #CEA46B 100%)",
          }}
        >
          <span>Continue to Schedule & Details</span>
          <ArrowRight size={16} className="stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
