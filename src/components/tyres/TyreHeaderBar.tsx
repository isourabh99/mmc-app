"use client";

import React, { useState } from "react";
import {
  Search,
  X,
  Car,
  Truck,
  Building,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Zap,
  Shield,
  RotateCcw,
  Sun,
  Snowflake,
} from "lucide-react";
import {
  TYRE_WIDTHS,
  TYRE_PROFILES,
  TYRE_RIMS,
  TYRE_BRANDS,
  UK_VEHICLE_DATABASE,
  UKVehicleLookup,
} from "@/lib/data/tyres.data";

interface TyreHeaderBarProps {
  // Vehicle & Dimension Search
  onSearchByDimensions: (width: number | "all", profile: number | "all", rim: number | "all") => void;
  onSelectVehicle: (vehicle: UKVehicleLookup | null) => void;
  selectedVehicle: UKVehicleLookup | null;
  selectedWidth: number | "all";
  selectedProfile: number | "all";
  selectedRim: number | "all";

  // Text search & Filters
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

export const TyreHeaderBar: React.FC<TyreHeaderBarProps> = ({
  onSearchByDimensions,
  onSelectVehicle,
  selectedVehicle,
  selectedWidth,
  selectedProfile,
  selectedRim,
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
  const [regInput, setRegInput] = useState("");
  const [showDimensionPicker, setShowDimensionPicker] = useState(false);

  const [width, setWidth] = useState<number | "all">(selectedWidth);
  const [profile, setProfile] = useState<number | "all">(selectedProfile);
  const [rim, setRim] = useState<number | "all">(selectedRim);

  const handleRegSearch = (plateToSearch?: string) => {
    const raw = (plateToSearch || regInput).toUpperCase().replace(/\s+/g, "");
    if (!raw) return;

    const matched = UK_VEHICLE_DATABASE[raw];

    if (matched) {
      onSelectVehicle(matched);
      setRegInput(matched.registration);

      const parts = matched.recommended_front_size.match(/(\d+)\/(\d+)\s+R(\d+)/);
      if (parts) {
        const w = parseInt(parts[1], 10);
        const p = parseInt(parts[2], 10);
        const r = parseInt(parts[3], 10);
        setWidth(w);
        setProfile(p);
        setRim(r);
        onSearchByDimensions(w, p, r);
      }
    } else {
      const mockCar: UKVehicleLookup = {
        registration: plateToSearch || regInput.toUpperCase(),
        make: "UK Registered",
        model: "Vehicle Match",
        year: "2023",
        color: "Metallic",
        recommended_front_size: "225/45 R17",
        recommended_rear_size: "225/45 R17",
      };
      onSelectVehicle(mockCar);
      setWidth(225);
      setProfile(45);
      setRim(17);
      onSearchByDimensions(225, 45, 17);
    }
  };

  const handleApplyDimensions = () => {
    onSearchByDimensions(width, profile, rim);
    setShowDimensionPicker(false);
  };

  const handleClearDimensions = () => {
    setWidth("all");
    setProfile("all");
    setRim("all");
    onSearchByDimensions("all", "all", "all");
    setShowDimensionPicker(false);
  };

  const hasDimensionFilter =
    selectedWidth !== "all" || selectedProfile !== "all" || selectedRim !== "all";

  const hasActiveFilters =
    searchQuery ||
    selectedBrand !== "All Brands" ||
    selectedSeason !== "all" ||
    selectedVehicleType !== "all" ||
    isRunflatOnly ||
    isEvOnly ||
    sortBy !== "default" ||
    hasDimensionFilter ||
    selectedVehicle !== null;

  return (
    <div className="space-y-3">
      {/* 1. Header Title & Zone Bar (Compact) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#FAD293]/10 text-[#FAD293] border border-[#FAD293]/20">
              <Sparkles size={11} className="text-[#FAD293]" />
              <span>MMC Mobile Tyre Service</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Tyre Fitting,{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Delivered To Your Doorstep
            </span>
          </h1>
        </div>

        {/* GPS Zone Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-medium self-start sm:self-auto backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Zone: <strong className="text-white font-mono">London Central (a1614dbe)</strong></span>
        </div>
      </div>

      {/* 2. Unified Compact Search & Service Bar */}
      <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-3 sm:p-4 shadow-xl space-y-3">
        {/* Row A: Reg Plate Search + Fitting Mode Switcher */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Left: Compact Reg Plate Lookup */}
          <div className="flex items-center gap-2 flex-1 max-w-xl">
            {/* UK Plate Input */}
            <div className="flex items-center h-10 rounded-xl border border-[#eab308]/60 bg-[#facc15] shadow-sm overflow-hidden flex-1">
              <div className="w-8 h-full bg-[#1d4ed8] text-white flex items-center justify-center font-bold text-[9px] select-none shrink-0">
                <span>GB</span>
              </div>
              <input
                type="text"
                value={regInput}
                onChange={(e) => setRegInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRegSearch();
                }}
                placeholder="ENTER REG (e.g. UK22 ABC)"
                className="w-full bg-transparent px-2.5 text-xs sm:text-sm font-black text-black uppercase tracking-wider outline-none placeholder:text-black/40 font-mono"
              />
              {regInput && (
                <button
                  type="button"
                  onClick={() => setRegInput("")}
                  className="px-2 text-black/50 hover:text-black"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <button
              type="button"
              id="lookup-reg-btn"
              onClick={() => handleRegSearch()}
              className="h-10 px-4 rounded-xl font-bold text-black text-xs flex items-center justify-center gap-1.5 transition hover:brightness-110 active:scale-98 shrink-0 shadow-md"
              style={{
                background: "linear-gradient(135deg, #FAD293, #CEA46B)",
              }}
            >
              <Search size={14} />
              <span>Lookup</span>
            </button>

            {/* By Dimensions Button Toggle */}
            <button
              type="button"
              onClick={() => setShowDimensionPicker(!showDimensionPicker)}
              className={`h-10 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition shrink-0 ${
                hasDimensionFilter || showDimensionPicker
                  ? "border-[#FAD293] bg-[#FAD293]/15 text-[#FAD293]"
                  : "border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <Sliders size={13} />
              <span className="hidden sm:inline">Dimensions</span>
              {hasDimensionFilter && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#FAD293]" />
              )}
            </button>
          </div>

          {/* Right: Compact Fitting Mode Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => onServiceModeChange("customer")}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                serviceMode === "customer"
                  ? "bg-[#FAD293] text-black font-bold shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Truck size={13} />
              <span>Mobile Van</span>
            </button>

            <button
              type="button"
              onClick={() => onServiceModeChange("provider")}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                serviceMode === "provider"
                  ? "bg-[#FAD293] text-black font-bold shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Building size={13} />
              <span>Garage Station</span>
            </button>
          </div>
        </div>

        {/* Dimension Picker Sub-Panel (Only open when clicked) */}
        {showDimensionPicker && (
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 animate-in fade-in duration-150">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-white/60">Width</label>
              <select
                value={width}
                onChange={(e) => setWidth(e.target.value === "all" ? "all" : parseInt(e.target.value, 10))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-white/10 text-xs text-white outline-none focus:border-[#FAD293]"
              >
                <option value="all">All Widths</option>
                {TYRE_WIDTHS.map((w) => (
                  <option key={w} value={w}>{w} mm</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-white/60">Profile</label>
              <select
                value={profile}
                onChange={(e) => setProfile(e.target.value === "all" ? "all" : parseInt(e.target.value, 10))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-white/10 text-xs text-white outline-none focus:border-[#FAD293]"
              >
                <option value="all">All Profiles</option>
                {TYRE_PROFILES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-white/60">Rim Size</label>
              <select
                value={rim}
                onChange={(e) => setRim(e.target.value === "all" ? "all" : parseInt(e.target.value, 10))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-white/10 text-xs text-white outline-none focus:border-[#FAD293]"
              >
                <option value="all">All Rim Sizes</option>
                {TYRE_RIMS.map((r) => (
                  <option key={r} value={r}>R{r}"</option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={handleApplyDimensions}
                className="flex-1 py-1.5 rounded-lg font-bold text-black text-xs bg-[#FAD293] hover:brightness-110 transition"
              >
                Apply
              </button>
              {hasDimensionFilter && (
                <button
                  type="button"
                  onClick={handleClearDimensions}
                  className="px-2.5 py-1.5 rounded-lg text-xs text-white/50 hover:text-white bg-white/5"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Selected Vehicle Chip OR Sample Reg Suggestions */}
        {selectedVehicle ? (
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="font-mono font-bold text-[11px] bg-[#facc15] text-black px-1.5 py-0.5 rounded shadow-sm shrink-0">
                {selectedVehicle.registration}
              </span>
              <span className="font-semibold text-white truncate">
                {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
              </span>
              <span className="text-white/50 hidden sm:inline">•</span>
              <span className="text-[#FAD293] font-mono hidden sm:inline">
                Fitment: {selectedVehicle.recommended_front_size}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onSelectVehicle(null)}
              className="text-white/40 hover:text-white p-1 shrink-0"
              title="Clear vehicle"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px] text-white/40 no-scrollbar">
            <span className="shrink-0">Sample UK Plates:</span>
            {Object.keys(UK_VEHICLE_DATABASE).map((key) => {
              const car = UK_VEHICLE_DATABASE[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleRegSearch(car.registration)}
                  className="px-2 py-0.5 rounded-md bg-white/5 border border-white/8 hover:border-[#FAD293]/40 text-white/70 hover:text-[#FAD293] font-mono shrink-0 transition"
                >
                  {car.registration}
                </button>
              );
            })}
          </div>
        )}

        {/* Row B: Clean Inline Filter & Sorting Strip */}
        <div className="pt-2 border-t border-white/8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tyre model or brand..."
              className="w-full pl-8 pr-7 py-1.5 sm:py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#FAD293] transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Quick Filter Selects */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Brand Dropdown */}
            <select
              value={selectedBrand}
              onChange={(e) => onBrandChange(e.target.value)}
              className="px-2.5 py-1.5 sm:py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:border-[#FAD293] outline-none"
            >
              {TYRE_BRANDS.map((b) => (
                <option key={b} value={b} className="bg-neutral-900">
                  {b}
                </option>
              ))}
            </select>

            {/* Season Dropdown */}
            <select
              value={selectedSeason}
              onChange={(e) => onSeasonChange(e.target.value)}
              className="px-2.5 py-1.5 sm:py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:border-[#FAD293] outline-none"
            >
              <option value="all" className="bg-neutral-900">All Seasons</option>
              <option value="summer" className="bg-neutral-900">Summer</option>
              <option value="all_season" className="bg-neutral-900">All-Season</option>
              <option value="winter" className="bg-neutral-900">Winter</option>
            </select>

            {/* EV Chip */}
            <button
              type="button"
              onClick={() => onEvToggle(!isEvOnly)}
              className={`flex items-center gap-1 px-2.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold border transition ${
                isEvOnly
                  ? "border-emerald-500 bg-emerald-950/80 text-emerald-300"
                  : "border-white/10 bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              <Zap size={11} className={isEvOnly ? "text-emerald-400" : "text-white/40"} />
              <span>EV</span>
            </button>

            {/* Runflat Chip */}
            <button
              type="button"
              onClick={() => onRunflatToggle(!isRunflatOnly)}
              className={`flex items-center gap-1 px-2.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold border transition ${
                isRunflatOnly
                  ? "border-purple-500 bg-purple-950/80 text-purple-300"
                  : "border-white/10 bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              <Shield size={11} className={isRunflatOnly ? "text-purple-400" : "text-white/40"} />
              <span>Run-Flat</span>
            </button>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="px-2.5 py-1.5 sm:py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:border-[#FAD293] outline-none"
            >
              <option value="default" className="bg-neutral-900">Sort: Recommended</option>
              <option value="price_low" className="bg-neutral-900">Price: Low to High</option>
              <option value="price_high" className="bg-neutral-900">Price: High to Low</option>
              <option value="fuel_economy" className="bg-neutral-900">Fuel Efficiency</option>
              <option value="wet_grip" className="bg-neutral-900">Wet Grip</option>
            </select>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="p-2 rounded-xl text-xs text-[#FAD293] bg-[#FAD293]/10 hover:bg-[#FAD293]/20 transition"
                title="Reset all filters"
              >
                <RotateCcw size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Count Line */}
      <div className="flex items-center justify-between text-xs text-white/50 px-1">
        <span>
          Showing <strong className="text-[#FAD293]">{totalCount}</strong> matching {totalCount === 1 ? "tyre" : "tyres"}
        </span>
        <span className="text-[11px] text-white/40 hidden sm:inline">
          Prices include fitting, new valves, wheel balancing &amp; eco disposal
        </span>
      </div>
    </div>
  );
};
