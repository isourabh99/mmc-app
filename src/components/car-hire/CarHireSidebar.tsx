"use client";

import React from "react";
import {
  Filter,
  Layers,
  Car,
  Gauge,
  SlidersHorizontal,
  X,
  RotateCcw,
  Check,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Category, CarType } from "@/lib/service/car.api";

interface CarHireSidebarProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  carTypes: CarType[];
  selectedCarTypeId: number | "all";
  onSelectCarType: (id: number | "all") => void;
  transmissionFilter: string;
  onTransmissionChange: (trans: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
}

export const CarHireSidebar: React.FC<CarHireSidebarProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  carTypes,
  selectedCarTypeId,
  onSelectCarType,
  transmissionFilter,
  onTransmissionChange,
  sortBy,
  onSortChange,
  onResetFilters,
  hasActiveFilters,
  activeFilterCount,
}) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-5 space-y-6">
      {/* Header with Active Badges & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-[#FAD293]" />
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">
            Filters
          </h3>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAD293] text-black">
              {activeFilterCount}
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1 text-[11px] text-[#FAD293] hover:underline"
          >
            <RotateCcw size={11} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* 1. Category Selection */}
      {categories.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white/70">
            <Layers size={13} className="text-[#FAD293]" />
            <span>Categories</span>
          </div>

          <div className="space-y-1">
            {categories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition text-left ${
                    isSelected
                      ? "bg-gradient-to-r from-[#FAD293]/20 to-transparent border border-[#FAD293]/40 text-[#FAD293]"
                      : "text-white/70 hover:bg-white/5 hover:text-white border border-transparent"
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  {isSelected && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FAD293] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Vehicle Types */}
      {carTypes.length > 0 && (
        <div className="space-y-2.5 pt-3 border-t border-white/8">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white/70">
            <Car size={13} className="text-[#FAD293]" />
            <span>Vehicle Type</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onSelectCarType("all")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition border ${
                selectedCarTypeId === "all"
                  ? "bg-[#FAD293] text-black border-[#FAD293] font-bold"
                  : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
              }`}
            >
              All Types
            </button>
            {carTypes.map((type) => {
              const isSelected = selectedCarTypeId === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => onSelectCarType(type.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition border ${
                    isSelected
                      ? "bg-[#FAD293] text-black border-[#FAD293] font-bold"
                      : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
                  }`}
                >
                  {type.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Transmission Filter */}
      <div className="space-y-2.5 pt-3 border-t border-white/8">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-white/70">
          <Gauge size={13} className="text-[#FAD293]" />
          <span>Transmission</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: "all", label: "All" },
            { id: "Automatic", label: "Auto" },
            { id: "Manual", label: "Manual" },
          ].map((item) => {
            const isSelected = transmissionFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTransmissionChange(item.id)}
                className={`py-1.5 rounded-lg text-[11px] font-medium transition border text-center ${
                  isSelected
                    ? "bg-[#FAD293] text-black border-[#FAD293] font-bold"
                    : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Sort By */}
      <div className="space-y-2.5 pt-3 border-t border-white/8">
        <label className="block text-xs font-semibold text-white/70">
          Sort By
        </label>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#FAD293]"
        >
          <option value="default" className="bg-neutral-900">
            Default Order
          </option>
          <option value="price_low" className="bg-neutral-900">
            Price: Low to High
          </option>
          <option value="price_high" className="bg-neutral-900">
            Price: High to Low
          </option>
          <option value="seats_desc" className="bg-neutral-900">
            Most Seating Capacity
          </option>
          <option value="newest" className="bg-neutral-900">
            Newest Vehicles First
          </option>
        </select>
      </div>
    </div>
  );
};
