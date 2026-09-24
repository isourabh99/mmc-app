"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Car,
  AlertCircle,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";
import {
  CarItem,
  Category,
  CarType,
  getCarCategories,
  getCarList,
  getCarTypes,
} from "@/lib/service/car.api";
import { CarCard } from "@/components/car-hire/CarCard";
import { CarHireTopBar } from "@/components/car-hire/CarHireTopBar";
import { CarHireSidebar } from "@/components/car-hire/CarHireSidebar";
import { CarHireMobileDrawer } from "@/components/car-hire/CarHireMobileDrawer";
import { CarBookingModal } from "@/components/car-hire/CarBookingModal";

const DEFAULT_CAR_HIRE_CATEGORY_ID = "35f3a758-c66b-444e-83fb-9325a345e2db";

export default function CarHirePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    DEFAULT_CAR_HIRE_CATEGORY_ID
  );
  const [carTypes, setCarTypes] = useState<CarType[]>([]);
  const [selectedCarTypeId, setSelectedCarTypeId] = useState<number | "all">(
    "all"
  );
  const [transmissionFilter, setTransmissionFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");

  const [cars, setCars] = useState<CarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [selectedCarForBooking, setSelectedCarForBooking] =
    useState<CarItem | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // 1. Fetch Categories & Car Types on Mount
  useEffect(() => {
    const initData = async () => {
      try {
        const [cats, types] = await Promise.all([
          getCarCategories(20, 1),
          getCarTypes(),
        ]);

        if (cats && cats.length > 0) {
          const active = cats.filter(
            (c) =>
              c.is_active === 1 &&
              !c.name.toLowerCase().includes("emergency")
          );
          setCategories(active);

          const found = active.find(
            (c) =>
              c.id === DEFAULT_CAR_HIRE_CATEGORY_ID ||
              c.name.toLowerCase().includes("hire")
          );
          if (found) {
            setSelectedCategoryId(found.id);
          } else if (active[0]) {
            setSelectedCategoryId(active[0].id);
          }
        }

        if (types) {
          setCarTypes(types);
        }
      } catch (err) {
        console.error("Failed to load car hire categories:", err);
      }
    };

    initData();
  }, []);

  // 2. Fetch Cars whenever Selected Category Changes
  const fetchCarsForCategory = async (catId: string) => {
    try {
      setLoading(true);
      setError("");
      const list = await getCarList(catId);
      setCars(list);
    } catch (err) {
      console.error("Failed to fetch car list:", err);
      setError("Unable to load vehicles for this category. Please try again.");
      setCars([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCategoryId) {
      fetchCarsForCategory(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  // Active filter count & reset
  const activeFilterCount =
    (selectedCarTypeId !== "all" ? 1 : 0) +
    (transmissionFilter !== "all" ? 1 : 0) +
    (sortBy !== "default" ? 1 : 0) +
    (searchQuery ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCarTypeId("all");
    setTransmissionFilter("all");
    setSortBy("default");
  };

  // 3. Client-side Filtering & Sorting
  const filteredAndSortedCars = useMemo(() => {
    let result = [...cars];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          (c.brand && c.brand.toLowerCase().includes(q)) ||
          (c.model && c.model.toLowerCase().includes(q)) ||
          (c.type?.name && c.type.name.toLowerCase().includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q)) ||
          (c.postcode && c.postcode.toLowerCase().includes(q))
      );
    }

    // Car Type filter
    if (selectedCarTypeId !== "all") {
      result = result.filter(
        (c) => c.car_type_id === selectedCarTypeId || c.type?.id === selectedCarTypeId
      );
    }

    // Transmission filter
    if (transmissionFilter !== "all") {
      result = result.filter(
        (c) =>
          (c.transmission_type &&
            c.transmission_type.toLowerCase() ===
              transmissionFilter.toLowerCase()) ||
          (c.transmission &&
            c.transmission.toLowerCase() ===
              transmissionFilter.toLowerCase())
      );
    }

    // Sorting
    if (sortBy === "price_low") {
      result.sort((a, b) => {
        const priceA = parseFloat(a.daily_rate || a.hourly_rate || "0");
        const priceB = parseFloat(b.daily_rate || b.hourly_rate || "0");
        return priceA - priceB;
      });
    } else if (sortBy === "price_high") {
      result.sort((a, b) => {
        const priceA = parseFloat(a.daily_rate || a.hourly_rate || "0");
        const priceB = parseFloat(b.daily_rate || b.hourly_rate || "0");
        return priceB - priceA;
      });
    } else if (sortBy === "seats_desc") {
      result.sort(
        (a, b) => (b.seating_capacity || 0) - (a.seating_capacity || 0)
      );
    } else if (sortBy === "newest") {
      result.sort((a, b) => {
        const yearA = parseInt(String(a.manufacture_year || a.year || "0"));
        const yearB = parseInt(String(b.manufacture_year || b.year || "0"));
        return yearB - yearA;
      });
    }

    return result;
  }, [cars, searchQuery, selectedCarTypeId, transmissionFilter, sortBy]);

  const handleBookNow = (car: CarItem) => {
    setSelectedCarForBooking(car);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Background Glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full blur-[140px] opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #FAD293, #CEA46B)",
        }}
      />

      <div className="max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-4 pt-3 sm:pt-5">
        {/* 1. Top Bar: Category Tabs & Search Input + Mobile Filter Toggle */}
        <CarHireTopBar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenMobileFilters={() => setIsMobileDrawerOpen(true)}
          activeFilterCount={activeFilterCount}
          totalCount={filteredAndSortedCars.length}
        />

        {/* 2. Main Content: Desktop Sidebar on Left + Vehicles Grid on Right */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Desktop Left Sidebar (Visible only on lg+) */}
          <div className="hidden lg:block lg:w-64 xl:w-72 2xl:w-80 shrink-0 sticky top-24">
            <CarHireSidebar
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
              carTypes={carTypes}
              selectedCarTypeId={selectedCarTypeId}
              onSelectCarType={setSelectedCarTypeId}
              transmissionFilter={transmissionFilter}
              onTransmissionChange={setTransmissionFilter}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onResetFilters={handleResetFilters}
              hasActiveFilters={hasActiveFilters}
              activeFilterCount={activeFilterCount}
            />
          </div>

          {/* Right Area: Cars Grid */}
          <div className="flex-1 min-w-0 w-full">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-white/10 bg-white/5 p-3 animate-pulse space-y-3"
                  >
                    <div className="h-32 sm:h-40 rounded-lg bg-white/10" />
                    <div className="h-4 w-3/4 rounded bg-white/10" />
                    <div className="h-3 w-1/2 rounded bg-white/5" />
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="h-7 rounded-lg bg-white/10" />
                      <div className="h-7 rounded-lg bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12 p-6 rounded-3xl border border-red-500/20 bg-red-500/5 space-y-4 max-w-lg mx-auto">
                <AlertCircle size={32} className="text-red-400 mx-auto" />
                <p className="text-sm text-red-300">{error}</p>
                <button
                  type="button"
                  onClick={() => fetchCarsForCategory(selectedCategoryId)}
                  className="px-5 py-2 rounded-xl border border-[#FAD293]/40 text-xs font-semibold text-[#FAD293] hover:bg-[#FAD293]/10 transition"
                >
                  Retry Loading
                </button>
              </div>
            ) : filteredAndSortedCars.length === 0 ? (
              <div className="text-center py-16 p-8 rounded-3xl border border-white/10 bg-[#0d0d0d] space-y-4">
                <Car size={36} className="text-white/30 mx-auto" />
                <h3 className="text-base font-bold text-white">
                  No Vehicles Found
                </h3>
                <p className="text-xs text-white/50 max-w-md mx-auto">
                  We couldn't find any vehicles matching your selected criteria. Try
                  resetting your filters.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-black"
                  style={{
                    background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                  }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
                {filteredAndSortedCars.map((car) => (
                  <CarCard
                    key={car.id}
                    car={car}
                    onBookNow={handleBookNow}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      <CarHireMobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        carTypes={carTypes}
        selectedCarTypeId={selectedCarTypeId}
        onSelectCarType={setSelectedCarTypeId}
        transmissionFilter={transmissionFilter}
        onTransmissionChange={setTransmissionFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        activeFilterCount={activeFilterCount}
        totalCount={filteredAndSortedCars.length}
      />

      {/* Booking Modal */}
      <CarBookingModal
        car={selectedCarForBooking}
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setSelectedCarForBooking(null);
        }}
      />
    </div>
  );
}
