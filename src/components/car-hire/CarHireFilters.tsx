"use client";

import React from "react";
import {
  Search,
  SlidersHorizontal,
  Car,
  Layers,
  Sparkles,
  X,
  ChevronDown,
} from "lucide-react";
import { Category, CarType } from "@/lib/service/car.api";

interface CarHireFiltersProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  carTypes: CarType[];
  selectedCarTypeId: number | "all";
  onSelectCarType: (typeId: number | "all") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  transmissionFilter: string;
  onTransmissionChange: (trans: string) => void;
  totalCount: number;
}

export const CarHireFilters: React.FC<CarHireFiltersProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  carTypes,
  selectedCarTypeId,
  onSelectCarType,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  transmissionFilter,
  onTransmissionChange,
  totalCount,
}) => {
  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCarTypeId !== "all" ||
    transmissionFilter !== "all" ||
    sortBy !== "default";

  const clearFilters = () => {
    onSearchChange("");
    onSelectCarType("all");
    onTransmissionChange("all");
    onSortChange("default");
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 1. Category Switcher Tabs */}
      {categories.length > 0 && (
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 no-scrollbar">
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

      {/* 2. Search & Filter Bar */}
      <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-white/10 bg-[#0d0d0d] backdrop-blur-md space-y-2.5">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-2 sm:gap-3">
          {/* Search Input */}
          <div className="col-span-2 md:col-span-5 relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              type="text"
              id="car-search-input"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by brand, model, or keywords..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#FAD293] transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Car Type Selector */}
          {carTypes.length > 0 && (
            <div className="md:col-span-3">
              <select
                id="car-type-select"
                value={selectedCarTypeId}
                onChange={(e) =>
                  onSelectCarType(
                    e.target.value === "all" ? "all" : Number(e.target.value)
                  )
                }
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/90 focus:outline-none focus:border-[#FAD293] transition"
              >
                <option value="all" className="bg-neutral-900 text-white">
                  All Vehicle Types
                </option>
                {carTypes.map((type) => (
                  <option
                    key={type.id}
                    value={type.id}
                    className="bg-neutral-900 text-white"
                  >
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Transmission Selector */}
          <div className="md:col-span-2">
            <select
              id="car-transmission-select"
              value={transmissionFilter}
              onChange={(e) => onTransmissionChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/90 focus:outline-none focus:border-[#FAD293] transition"
            >
              <option value="all" className="bg-neutral-900 text-white">
                Transmission: All
              </option>
              <option value="Automatic" className="bg-neutral-900 text-white">
                Automatic
              </option>
              <option value="Manual" className="bg-neutral-900 text-white">
                Manual
              </option>
            </select>
          </div>

          {/* Sort By Selector */}
          <div className="md:col-span-2">
            <select
              id="car-sort-select"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/90 focus:outline-none focus:border-[#FAD293] transition"
            >
              <option value="default" className="bg-neutral-900 text-white">
                Sort: Default
              </option>
              <option value="price_low" className="bg-neutral-900 text-white">
                Price: Low to High
              </option>
              <option value="price_high" className="bg-neutral-900 text-white">
                Price: High to Low
              </option>
              <option value="seats_desc" className="bg-neutral-900 text-white">
                Most Seats
              </option>
              <option value="newest" className="bg-neutral-900 text-white">
                Newest Models
              </option>
            </select>
          </div>
        </div>

        {/* Filter Stats & Reset */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
          <span className="text-white/50">
            Showing <strong className="text-[#FAD293]">{totalCount}</strong>{" "}
            {totalCount === 1 ? "car" : "cars"} available
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-[#FAD293] hover:underline"
            >
              <X size={12} />
              <span>Clear all filters</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
