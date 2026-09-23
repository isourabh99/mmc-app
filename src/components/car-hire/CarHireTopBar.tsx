"use client";

import React from "react";
import { Search, X, SlidersHorizontal, Car, Sparkles } from "lucide-react";
import { Category } from "@/lib/service/car.api";

interface CarHireTopBarProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenMobileFilters: () => void;
  activeFilterCount: number;
  totalCount: number;
}

export const CarHireTopBar: React.FC<CarHireTopBarProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onOpenMobileFilters,
  activeFilterCount,
  totalCount,
}) => {
  return (
    <div className="space-y-3.5">
      {/* 0. Page Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-1 pt-0.5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#FAD293]/10 text-[#FAD293] border border-[#FAD293]/25 shadow-sm">
              <Sparkles size={11} className="text-[#FAD293]" />
              <span>MMC Fleet &amp; Vehicle Rentals</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Hire a Car,{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Make Your Journey Better
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-white/60 mt-0.5">
            Discover verified luxury, performance, and everyday vehicles available for self-drive or doorstep delivery.
          </p>
        </div>
      </div>

      {/* 1. Category Switcher Tabs */}
      {categories.length > 0 && (
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                id={`filter-cat-${cat.id}`}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 border ${
                  isSelected
                    ? "border-[#FAD293] text-black shadow-[0_0_15px_rgba(250,210,147,0.25)] scale-[1.02]"
                    : "border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20"
                }`}
                style={
                  isSelected
                    ? {
                        background:
                          "linear-gradient(135deg, #FAD293, #CEA46B)",
                      }
                    : {}
                }
              >
                <Car
                  size={13}
                  className={isSelected ? "text-black" : "text-[#FAD293]"}
                />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 2. Search & Mobile Filters Bar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            type="text"
            id="car-search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search brand, model, location..."
            className="w-full pl-10 pr-8 py-2 sm:py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#FAD293] transition"
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

        {/* Mobile Filter Toggle Button (Visible only on mobile lg:hidden) */}
        <button
          type="button"
          onClick={onOpenMobileFilters}
          className="lg:hidden flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-white/90 hover:border-[#FAD293]/40 hover:bg-white/10 transition shrink-0"
        >
          <SlidersHorizontal size={14} className="text-[#FAD293]" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#FAD293] text-black">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Results Count Line */}
      <div className="flex items-center justify-between text-[11px] text-white/50 px-1">
        <span>
          Showing <strong className="text-[#FAD293]">{totalCount}</strong>{" "}
          {totalCount === 1 ? "vehicle" : "vehicles"}
        </span>
      </div>
    </div>
  );
};
