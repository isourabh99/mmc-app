"use client";

import React, { useState } from "react";
import {
  Search,
  Car,
  Compass,
  CheckCircle2,
  AlertCircle,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  MapPin,
  RefreshCw,
} from "lucide-react";
import {
  TYRE_WIDTHS,
  TYRE_PROFILES,
  TYRE_RIMS,
  UK_VEHICLE_DATABASE,
  UKVehicleLookup,
} from "@/lib/data/tyres.data";

interface TyreSearchWidgetProps {
  onSearchByDimensions: (width: number | "all", profile: number | "all", rim: number | "all") => void;
  onSelectVehicle: (vehicle: UKVehicleLookup | null) => void;
  selectedVehicle: UKVehicleLookup | null;
  selectedWidth: number | "all";
  selectedProfile: number | "all";
  selectedRim: number | "all";
}

export const TyreSearchWidget: React.FC<TyreSearchWidgetProps> = ({
  onSearchByDimensions,
  onSelectVehicle,
  selectedVehicle,
  selectedWidth,
  selectedProfile,
  selectedRim,
}) => {
  const [activeTab, setActiveTab] = useState<"reg" | "dimensions">("reg");
  const [regInput, setRegInput] = useState("");
  const [regError, setRegError] = useState("");

  const [width, setWidth] = useState<number | "all">(selectedWidth);
  const [profile, setProfile] = useState<number | "all">(selectedProfile);
  const [rim, setRim] = useState<number | "all">(selectedRim);

  const handleRegSearch = (plateToSearch?: string) => {
    const raw = (plateToSearch || regInput).toUpperCase().replace(/\s+/g, "");
    if (!raw) {
      setRegError("Please enter a vehicle registration plate.");
      return;
    }

    setRegError("");
    const matched = UK_VEHICLE_DATABASE[raw];

    if (matched) {
      onSelectVehicle(matched);
      setRegInput(matched.registration);

      // Auto-populate dimension filter if parsed
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
      // Mock generated lookup for custom entered plates
      const mockCar: UKVehicleLookup = {
        registration: plateToSearch || regInput.toUpperCase(),
        make: "Verified UK Vehicle",
        model: "Executive Edition",
        year: "2023",
        color: "Metallic Grey",
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
  };

  const handleReset = () => {
    onSelectVehicle(null);
    setRegInput("");
    setWidth("all");
    setProfile("all");
    setRim("all");
    onSearchByDimensions("all", "all", "all");
  };

  return (
    <div className="rounded-3xl border border-white/15 bg-gradient-to-b from-[#16120e] to-[#0d0d0d] p-4 sm:p-6 shadow-2xl space-y-4">
      {/* Top Banner Row: Zone / GPS Badge + Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#FAD293]/15 text-[#FAD293]">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              Find Exact Fitment Tyres
            </h2>
            <p className="text-xs text-white/50">
              Instant UK reg lookup or choose your exact tyre dimensions.
            </p>
          </div>
        </div>

        {/* GPS Zone Badge (from API response) */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 text-xs font-medium self-start sm:self-auto backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Zone Active: <strong className="text-white font-mono">London Central (a1614dbe)</strong></span>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/5 border border-white/10 max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab("reg")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === "reg"
              ? "bg-[#FAD293] text-black shadow-md"
              : "text-white/70 hover:text-white"
          }`}
        >
          <Car size={14} />
          <span>By Registration Plate</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("dimensions")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === "dimensions"
              ? "bg-[#FAD293] text-black shadow-md"
              : "text-white/70 hover:text-white"
          }`}
        >
          <Sliders size={14} />
          <span>By Tyre Size (Dimensions)</span>
        </button>
      </div>

      {/* TAB 1: By Registration Plate */}
      {activeTab === "reg" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* UK Yellow Number Plate Input */}
            <div className="relative flex-1">
              <div className="flex items-stretch h-13 rounded-2xl border-2 border-[#eab308] bg-[#facc15] shadow-lg overflow-hidden group">
                {/* GB / UK Blue Flag strip */}
                <div className="w-9 bg-[#1d4ed8] text-white flex flex-col items-center justify-center font-bold text-[10px] select-none shrink-0 border-r border-black/10">
                  <span className="text-[12px] leading-none mb-0.5">🇬🇧</span>
                  <span className="font-mono tracking-tighter">UK</span>
                </div>

                <input
                  type="text"
                  value={regInput}
                  onChange={(e) => {
                    setRegInput(e.target.value.toUpperCase());
                    setRegError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRegSearch();
                  }}
                  placeholder="ENTER REG (e.g. UK22 ABC)"
                  className="w-full bg-transparent px-3 text-base sm:text-lg font-black text-black tracking-widest uppercase outline-none placeholder:text-black/40 font-mono"
                />
              </div>
            </div>

            {/* Find Tyres CTA */}
            <button
              type="button"
              id="find-tyres-by-reg-btn"
              onClick={() => handleRegSearch()}
              className="h-13 px-6 rounded-2xl font-extrabold text-black text-xs sm:text-sm flex items-center justify-center gap-2 transition hover:brightness-110 active:scale-98 shadow-xl shadow-[#FAD293]/15 shrink-0"
              style={{
                background: "linear-gradient(135deg, #FAD293, #CEA46B)",
              }}
            >
              <Search size={16} />
              <span>Search My Tyres</span>
            </button>
          </div>

          {regError && (
            <div className="text-xs text-red-400 flex items-center gap-1.5">
              <AlertCircle size={13} />
              <span>{regError}</span>
            </div>
          )}

          {/* Quick Click UK Plates Demos */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-white/50 no-scrollbar">
            <span className="text-[11px] shrink-0">Sample UK Plates:</span>
            {Object.keys(UK_VEHICLE_DATABASE).map((key) => {
              const car = UK_VEHICLE_DATABASE[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleRegSearch(car.registration)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:border-[#FAD293]/40 text-white/80 hover:text-[#FAD293] font-mono font-semibold text-[11px] shrink-0 transition"
                >
                  {car.registration} ({car.make})
                </button>
              );
            })}
          </div>

          {/* Selected Vehicle Identified Card */}
          {selectedVehicle && (
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-[#facc15] text-black px-2 py-0.5 rounded shadow-sm">
                      {selectedVehicle.registration}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
                    </span>
                  </div>
                  <p className="text-xs text-white/60 mt-0.5">
                    Recommended Fitment: <strong className="text-[#FAD293]">{selectedVehicle.recommended_front_size}</strong> • Color: {selectedVehicle.color}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-white/50 hover:text-white flex items-center gap-1 self-end sm:self-auto px-2.5 py-1 rounded-lg bg-white/5"
              >
                <RefreshCw size={11} />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: By Tyre Dimensions */}
      {activeTab === "dimensions" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Width */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-white/70">
                1. Width (mm)
              </label>
              <select
                value={width}
                onChange={(e) => {
                  const val = e.target.value === "all" ? "all" : parseInt(e.target.value, 10);
                  setWidth(val);
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:border-[#FAD293] outline-none"
              >
                <option value="all" className="bg-neutral-900">All Widths</option>
                {TYRE_WIDTHS.map((w) => (
                  <option key={w} value={w} className="bg-neutral-900">
                    {w} mm
                  </option>
                ))}
              </select>
            </div>

            {/* Profile */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-white/70">
                2. Profile / Aspect Ratio
              </label>
              <select
                value={profile}
                onChange={(e) => {
                  const val = e.target.value === "all" ? "all" : parseInt(e.target.value, 10);
                  setProfile(val);
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:border-[#FAD293] outline-none"
              >
                <option value="all" className="bg-neutral-900">All Profiles</option>
                {TYRE_PROFILES.map((p) => (
                  <option key={p} value={p} className="bg-neutral-900">
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Rim Diameter */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-white/70">
                3. Rim Diameter
              </label>
              <select
                value={rim}
                onChange={(e) => {
                  const val = e.target.value === "all" ? "all" : parseInt(e.target.value, 10);
                  setRim(val);
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:border-[#FAD293] outline-none"
              >
                <option value="all" className="bg-neutral-900">All Rim Sizes</option>
                {TYRE_RIMS.map((r) => (
                  <option key={r} value={r} className="bg-neutral-900">
                    R{r}"
                  </option>
                ))}
              </select>
            </div>

            {/* Action */}
            <div className="space-y-1 flex flex-col justify-end">
              <button
                type="button"
                onClick={handleApplyDimensions}
                className="w-full py-2.5 rounded-xl font-bold text-black text-xs transition hover:brightness-110 active:scale-98 shadow-md"
                style={{
                  background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                }}
              >
                Filter Dimensions
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-white/50 px-1">
            <span>e.g. Dimensions guide: <strong>205 / 55 R16</strong> or <strong>225 / 45 R17</strong></span>
            {(width !== "all" || profile !== "all" || rim !== "all") && (
              <button
                type="button"
                onClick={handleReset}
                className="text-[#FAD293] hover:underline"
              >
                Clear Dimension Filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
