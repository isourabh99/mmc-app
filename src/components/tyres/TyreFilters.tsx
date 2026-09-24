"use client";

import React from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  Sun,
  Snowflake,
  Zap,
  Shield,
  Truck,
  Building,
  RotateCcw,
} from "lucide-react";
import { TYRE_BRANDS } from "@/lib/data/tyres.data";

interface TyreFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedBrand: string;
  onBrandChange: (brand: string) => void;
  selectedSeason: string;
  onSeasonChange: (season: string) => void;
  selectedVehicleType: string;
  onVehicleTypeChange: (type: string) => void;
  isRunflatOnly: boolean;
  onRunflatToggle: (runflat: boolean) => void;
  isEvOnly: boolean;
  onEvToggle: (ev: boolean) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  serviceMode: "customer" | "provider";
  onServiceModeChange: (mode: "customer" | "provider") => void;
  onResetFilters: () => void;
  totalCount: number;
}

export const TyreFilters: React.FC<TyreFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedBrand,
  onBrandChange,
  selectedSeason,
  onSeasonChange,
  selectedVehicleType,
  onVehicleTypeChange,
  isRunflatOnly,
  onRunflatToggle,
  isEvOnly,
  onEvToggle,
  sortBy,
  onSortChange,
  serviceMode,
  onServiceModeChange,
  onResetFilters,
  totalCount,
}) => {
  const hasActiveFilters =
    searchQuery ||
    selectedBrand !== "All Brands" ||
    selectedSeason !== "all" ||
    selectedVehicleType !== "all" ||
    isRunflatOnly ||
    isEvOnly ||
    sortBy !== "default";

  return (
    <div className="space-y-4">
      {/* 1. Service Fitting Mode Selector (Mobile Fitting vs Garage Station) */}
      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
        <label className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
          <Truck size={14} className="text-[#FAD293]" />
          <span>Select Fitting Location Type</span>
        </label>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => onServiceModeChange("customer")}
            className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
              serviceMode === "customer"
                ? "border-[#FAD293] bg-[#FAD293] text-black shadow-lg shadow-[#FAD293]/15"
                : "border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <Truck size={14} />
            <span>Mobile Van Fitting</span>
          </button>

          <button
            type="button"
            onClick={() => onServiceModeChange("provider")}
            className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
              serviceMode === "provider"
                ? "border-[#FAD293] bg-[#FAD293] text-black shadow-lg shadow-[#FAD293]/15"
                : "border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <Building size={14} />
            <span>Certified Garage Fitting</span>
          </button>
        </div>
      </div>

      {/* 2. Top Filter Controls Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search model, tyre brand, e.g. Pilot Sport, P Zero..."
            className="w-full pl-9 pr-8 py-2 sm:py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#FAD293] transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Dropdowns row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Brand */}
          <select
            value={selectedBrand}
            onChange={(e) => onBrandChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:border-[#FAD293] outline-none"
          >
            {TYRE_BRANDS.map((b) => (
              <option key={b} value={b} className="bg-neutral-900">
                {b}
              </option>
            ))}
          </select>

          {/* Season */}
          <select
            value={selectedSeason}
            onChange={(e) => onSeasonChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:border-[#FAD293] outline-none"
          >
            <option value="all" className="bg-neutral-900">All Seasons</option>
            <option value="summer" className="bg-neutral-900">Summer Tyres</option>
            <option value="all_season" className="bg-neutral-900">All-Season (3PMSF)</option>
            <option value="winter" className="bg-neutral-900">Winter Tyres</option>
          </select>

          {/* Vehicle Type */}
          <select
            value={selectedVehicleType}
            onChange={(e) => onVehicleTypeChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:border-[#FAD293] outline-none"
          >
            <option value="all" className="bg-neutral-900">All Vehicle Types</option>
            <option value="passenger" className="bg-neutral-900">Passenger / Saloon</option>
            <option value="suv_4x4" className="bg-neutral-900">SUV / 4x4 Off-Road</option>
            <option value="ev" className="bg-neutral-900">EV Specific</option>
          </select>

          {/* Sorting */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:border-[#FAD293] outline-none"
          >
            <option value="default" className="bg-neutral-900">Sort by: Recommended</option>
            <option value="price_low" className="bg-neutral-900">Price: Low to High</option>
            <option value="price_high" className="bg-neutral-900">Price: High to Low</option>
            <option value="fuel_economy" className="bg-neutral-900">Best Fuel Efficiency</option>
            <option value="wet_grip" className="bg-neutral-900">Best Wet Grip</option>
          </select>
        </div>
      </div>

      {/* 3. Quick Toggle Chips (EV Ready, Run Flat, Reset) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          {/* EV Toggle */}
          <button
            type="button"
            onClick={() => onEvToggle(!isEvOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              isEvOnly
                ? "border-emerald-500 bg-emerald-950/80 text-emerald-300 shadow-sm"
                : "border-white/10 bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            <Zap size={12} className={isEvOnly ? "text-emerald-400" : "text-white/40"} />
            <span>EV / Hybrid Ready</span>
          </button>

          {/* Run-Flat Toggle */}
          <button
            type="button"
            onClick={() => onRunflatToggle(!isRunflatOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              isRunflatOnly
                ? "border-purple-500 bg-purple-950/80 text-purple-300 shadow-sm"
                : "border-white/10 bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            <Shield size={12} className={isRunflatOnly ? "text-purple-400" : "text-white/40"} />
            <span>Run-Flat Only</span>
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#FAD293] bg-[#FAD293]/10 hover:bg-[#FAD293]/20 transition"
            >
              <RotateCcw size={11} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="text-xs text-white/50">
          Showing <strong className="text-[#FAD293]">{totalCount}</strong> matching {totalCount === 1 ? "tyre" : "tyres"}
        </div>
      </div>
    </div>
  );
};
