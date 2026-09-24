"use client";

import React, { useState } from "react";
import {
  AlertOctagon,
  ArrowLeftRight,
  ArrowUpCircle,
  ChevronRight,
  Lightbulb,
  Check,
  ChevronDown,
  Info,
  ShieldCheck,
  Clock,
  Wrench,
  Truck,
} from "lucide-react";
import { TyreCategory, MAINTENANCE_TIPS } from "@/lib/data/tyre-assistance.data";
import { TyreAssistanceHeader } from "./TyreAssistanceHeader";

interface TyreCategoryStepProps {
  onSelectCategory: (category: TyreCategory) => void;
  onBack: () => void;
  isDesktopSidebar?: boolean;
}

export const TyreCategoryStep: React.FC<TyreCategoryStepProps> = ({
  onSelectCategory,
  onBack,
}) => {
  const [expandedTipId, setExpandedTipId] = useState<string | null>(null);

  const toggleTip = (id: string) => {
    setExpandedTipId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="lg:hidden">
        <TyreAssistanceHeader title="Tyre" onBack={onBack} />
      </div>

      {/* Desktop Section Title */}
      <div className="hidden lg:block space-y-1.5 pb-2 border-b border-white/10">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Select Tyre Assistance Service
        </h2>
        <p className="text-xs text-white/60">
          Choose between emergency roadside rescue, standard tyre replacements, or premium performance upgrades.
        </p>
      </div>

      {/* 2. Category Options (Responsive: 1 col on mobile, 3 cards on desktop or rich stacked cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Tyre Emergency */}
        <button
          type="button"
          onClick={() => onSelectCategory("emergency")}
          className="w-full group p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#141210] hover:bg-[#1e1713] border border-white/10 hover:border-red-500/50 flex flex-col justify-between transition-all duration-200 shadow-lg active:scale-[0.99] cursor-pointer text-left relative overflow-hidden min-h-[140px]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-start justify-between w-full relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
              <AlertOctagon size={22} className="stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
              Rapid 24/7
            </span>
          </div>

          <div className="relative z-10 pt-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-base sm:text-lg font-bold text-white group-hover:text-red-300 transition-colors">
                Tyre Emergency
              </span>
              <ChevronRight
                size={18}
                className="text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all"
              />
            </div>
            <p className="text-xs text-white/50 leading-relaxed line-clamp-2">
              Instant roadside dispatch for punctures, blowouts, and flat tyres.
            </p>
          </div>
        </button>

        {/* Replacement */}
        <button
          type="button"
          onClick={() => onSelectCategory("replacement")}
          className="w-full group p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#141210] hover:bg-[#1a1612] border border-white/10 hover:border-[#FAD293]/50 flex flex-col justify-between transition-all duration-200 shadow-lg active:scale-[0.99] cursor-pointer text-left relative overflow-hidden min-h-[140px]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#FAD293]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-start justify-between w-full relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-[#FAD293]/10 border border-[#FAD293]/20 flex items-center justify-center text-[#FAD293] group-hover:scale-110 transition-transform">
              <ArrowLeftRight size={20} className="stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FAD293] bg-[#FAD293]/10 border border-[#FAD293]/20 px-2 py-0.5 rounded-full">
              Standard
            </span>
          </div>

          <div className="relative z-10 pt-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-base sm:text-lg font-bold text-white group-hover:text-[#FAD293] transition-colors">
                Replacement
              </span>
              <ChevronRight
                size={18}
                className="text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all"
              />
            </div>
            <p className="text-xs text-white/50 leading-relaxed line-clamp-2">
              Scheduled mobile fitting or workshop fitting for worn tread & seasonal tyres.
            </p>
          </div>
        </button>

        {/* Upgrades */}
        <button
          type="button"
          onClick={() => onSelectCategory("upgrades")}
          className="w-full group p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#141210] hover:bg-[#1a1612] border border-white/10 hover:border-[#FAD293]/50 flex flex-col justify-between transition-all duration-200 shadow-lg active:scale-[0.99] cursor-pointer text-left relative overflow-hidden min-h-[140px]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#FAD293]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-start justify-between w-full relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-[#FAD293]/10 border border-[#FAD293]/20 flex items-center justify-center text-[#FAD293] group-hover:scale-110 transition-transform">
              <ArrowUpCircle size={22} className="stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FAD293] bg-[#FAD293]/10 border border-[#FAD293]/20 px-2 py-0.5 rounded-full">
              Premium
            </span>
          </div>

          <div className="relative z-10 pt-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-base sm:text-lg font-bold text-white group-hover:text-[#FAD293] transition-colors">
                Upgrades
              </span>
              <ChevronRight
                size={18}
                className="text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all"
              />
            </div>
            <p className="text-xs text-white/50 leading-relaxed line-clamp-2">
              High-performance sport tyres, EV-optimized low-noise, & reinforced run-flat tyres.
            </p>
          </div>
        </button>
      </div>

      {/* 3. Maintenance Tips Section */}
      <div className="space-y-3.5 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Maintenance Tips
          </h3>
          <span className="text-xs text-[#FAD293] flex items-center gap-1">
            <Lightbulb size={13} />
            Expert Guidelines
          </span>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#181410] to-[#120f0d] border border-white/10 shadow-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MAINTENANCE_TIPS.map((tip, idx) => {
              const isExpanded = expandedTipId === tip.id;
              return (
                <div
                  key={tip.id}
                  onClick={() => toggleTip(tip.id)}
                  className="p-3.5 rounded-2xl bg-black/40 border border-white/5 hover:border-white/15 transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-[#FAD293] flex items-center justify-center text-black flex-shrink-0 mt-0.5 shadow-sm">
                      <Check size={13} className="stroke-[3]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs sm:text-[13px] text-white/90 font-medium leading-snug">
                        {tip.text}
                      </p>
                    </div>
                  </div>

                  {tip.details && (
                    <div className="mt-2.5 text-[11px] text-white/55 pt-2 border-t border-white/5">
                      {tip.details}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Desktop Features Strip */}
      <div className="hidden lg:grid grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-2xl bg-[#141210] border border-white/5 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#FAD293]/10 text-[#FAD293] flex items-center justify-center flex-shrink-0">
            <Truck size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Mobile Van At Location</h4>
            <p className="text-[11px] text-white/50">Fitted at your home or roadside</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141210] border border-white/5 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#FAD293]/10 text-[#FAD293] flex items-center justify-center flex-shrink-0">
            <Clock size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">30-45 Mins Rapid ETA</h4>
            <p className="text-[11px] text-white/50">Real-time driver tracking</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141210] border border-white/5 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#FAD293]/10 text-[#FAD293] flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">100% Certified Tyres</h4>
            <p className="text-[11px] text-white/50">Direct manufacturer warranty</p>
          </div>
        </div>
      </div>
    </div>
  );
};
