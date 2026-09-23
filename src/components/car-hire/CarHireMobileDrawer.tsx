"use client";

import React from "react";
import {
  X,
  SlidersHorizontal,
  RotateCcw,
  Layers,
  Car,
  Gauge,
  Check,
} from "lucide-react";
import { Category, CarType } from "@/lib/service/car.api";

interface CarHireMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
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
  totalCount: number;
}

export const CarHireMobileDrawer: React.FC<CarHireMobileDrawerProps> = ({
  isOpen,
  onClose,
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
  totalCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden bg-black/80 backdrop-blur-md">
      {/* Tap backdrop to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Content */}
      <div className="relative w-full max-h-[85vh] bg-[#110e0c] border-t border-white/20 rounded-t-3xl p-5 overflow-y-auto shadow-2xl space-y-5 animate-slide-up">
        {/* Drag handle & Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-[#FAD293]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Filters & Options
            </h3>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAD293] text-black">
                {activeFilterCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="flex items-center gap-1 text-xs text-[#FAD293] hover:underline"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 1. Category Selection */}
        {categories.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
              <Layers size={13} className="text-[#FAD293]" />
              <span>Category</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onSelectCategory(cat.id)}
                    className={`p-2 rounded-xl text-xs font-medium text-left truncate transition border ${
                      isSelected
                        ? "bg-[#FAD293] text-black border-[#FAD293] font-bold"
                        : "bg-white/5 text-white/70 border-white/10"
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Vehicle Types */}
        {carTypes.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-white/8">
            <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
              <Car size={13} className="text-[#FAD293]" />
              <span>Vehicle Type</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onSelectCarType("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                  selectedCarTypeId === "all"
                    ? "bg-[#FAD293] text-black border-[#FAD293] font-bold"
                    : "bg-white/5 text-white/70 border-white/10"
                }`}
              >
                All
              </button>
              {carTypes.map((type) => {
                const isSelected = selectedCarTypeId === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => onSelectCarType(type.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                      isSelected
                        ? "bg-[#FAD293] text-black border-[#FAD293] font-bold"
                        : "bg-white/5 text-white/70 border-white/10"
                    }`}
                  >
                    {type.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Transmission */}
        <div className="space-y-2 pt-3 border-t border-white/8">
          <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
            <Gauge size={13} className="text-[#FAD293]" />
            <span>Transmission</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "all", label: "All" },
              { id: "Automatic", label: "Automatic" },
              { id: "Manual", label: "Manual" },
            ].map((item) => {
              const isSelected = transmissionFilter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTransmissionChange(item.id)}
                  className={`py-2 rounded-xl text-xs font-medium transition border text-center ${
                    isSelected
                      ? "bg-[#FAD293] text-black border-[#FAD293] font-bold"
                      : "bg-white/5 text-white/70 border-white/10"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Sort By */}
        <div className="space-y-2 pt-3 border-t border-white/8">
          <label className="text-xs font-semibold text-white/70">
            Sort Order
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#FAD293]"
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
              Most Seats First
            </option>
            <option value="newest" className="bg-neutral-900">
              Newest Models First
            </option>
          </select>
        </div>

        {/* Apply Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 rounded-xl font-bold text-black text-xs shadow-lg flex items-center justify-center gap-2"
          style={{
            background: "linear-gradient(135deg, #FAD293, #CEA46B)",
          }}
        >
          <span>Apply Filters ({totalCount} {totalCount === 1 ? "car" : "cars"})</span>
        </button>
      </div>
    </div>
  );
};
