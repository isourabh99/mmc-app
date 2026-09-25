"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Car,
  ChevronDown,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import {
  getCarTypes,
  searchChauffeurs,
  type CarType,
  type Chauffeur,
  type ChauffeurSearchContent,
} from "@/lib/service/chauffeur.api";
import { ChauffeurCard } from "@/components/chauffeur/ChauffeurCard";

const PAGE_LIMIT = 10;

const featuresList = [
  {
    icon: "✦",
    title: "Luxury",
    text: "Premium vehicles",
  },
  {
    icon: "◷",
    title: "On Time",
    text: "Reliable pickups",
  },
  {
    icon: "👥",
    title: "24/7",
    text: "Always available",
  },
];

export default function ChauffeurServicePage() {
  // Car Types from Backend
  const [carTypes, setCarTypes] = useState<CarType[]>([]);
  const [selectedCarTypeId, setSelectedCarTypeId] = useState<number | "">("");
  const [loadingCarTypes, setLoadingCarTypes] = useState(true);

  // Chauffeurs from Backend & Infinite Scroll State
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [searchMeta, setSearchMeta] = useState<ChauffeurSearchContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");

  // Sentinel ref for infinite scroll
  const observerTarget = useRef<HTMLDivElement | null>(null);

  // Sidebar Filter Form State
  const [filterDate, setFilterDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "rating">("newest");

  // Wishlist
  const [wishlist, setWishlist] = useState<number[]>([]);

  // Fetch initial Chauffeurs list
  const fetchInitialChauffeurs = async (typeId: number, date: string) => {
    try {
      setLoading(true);
      setErrorMessage("");
      setPage(1);

      const result = await searchChauffeurs({
        car_type_id: typeId,
        date,
        limit: PAGE_LIMIT,
        offset: 0,
      });

      setSearchMeta(result);
      const data = result?.data || [];
      setChauffeurs(data);

      const total = result?.total || data.length;
      setHasMore(data.length >= PAGE_LIMIT && data.length < total);
    } catch (err: unknown) {
      console.error("Error fetching chauffeurs from backend:", err);
      setErrorMessage("Failed to fetch chauffeurs from backend. Please try again.");
      setChauffeurs([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial Car Types & Chauffeurs on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingCarTypes(true);
        setErrorMessage("");

        const types = await getCarTypes();
        setCarTypes(types || []);

        const activeType = types?.find((t) => t.status === 1) || types?.[0];
        const initialTypeId = activeType ? activeType.id : 1;
        setSelectedCarTypeId(initialTypeId);

        const todayStr = new Date().toISOString().split("T")[0];
        await fetchInitialChauffeurs(initialTypeId, todayStr);
      } catch (err: unknown) {
        console.error("Failed to load initial chauffeur data from backend:", err);
        setErrorMessage("Unable to fetch chauffeurs from backend. Please verify your connection.");
      } finally {
        setLoadingCarTypes(false);
      }
    };

    fetchInitialData();
  }, []);

  // Load More function for Infinite Scroll
  const loadMoreChauffeurs = useCallback(async () => {
    if (!selectedCarTypeId || loadingMore || !hasMore || loading) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const nextOffset = (nextPage - 1) * PAGE_LIMIT;

      const result = await searchChauffeurs({
        car_type_id: Number(selectedCarTypeId),
        date: filterDate,
        limit: PAGE_LIMIT,
        offset: nextOffset,
      });

      if (result && result.data && result.data.length > 0) {
        setChauffeurs((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const uniqueNew = result.data.filter((c) => !existingIds.has(c.id));
          return [...prev, ...uniqueNew];
        });
        setSearchMeta(result);
        setPage(nextPage);

        const total = result.total || 0;
        const currentCount = chauffeurs.length + result.data.length;
        if (result.data.length < PAGE_LIMIT || (total > 0 && currentCount >= total)) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to load more chauffeurs on scroll:", err);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [selectedCarTypeId, loadingMore, hasMore, loading, page, filterDate, chauffeurs.length]);

  // IntersectionObserver for Infinite Scroll
  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMoreChauffeurs();
        }
      },
      { threshold: 0.1, rootMargin: "150px" }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [loadMoreChauffeurs, hasMore, loading, loadingMore]);

  // Handle Apply Filters from Sidebar
  const handleApplyFilters = () => {
    if (!selectedCarTypeId) {
      setErrorMessage("Please select a car type.");
      return;
    }
    fetchInitialChauffeurs(Number(selectedCarTypeId), filterDate);
  };

  // Reset Filters
  const handleResetFilters = () => {
    const firstType = carTypes.find((t) => t.status === 1) || carTypes[0];
    const firstTypeId = firstType ? firstType.id : 1;
    const todayStr = new Date().toISOString().split("T")[0];

    setSelectedCarTypeId(firstTypeId);
    setFilterDate(todayStr);
    setSortBy("newest");
    fetchInitialChauffeurs(firstTypeId, todayStr);
  };

  // Toggle Wishlist
  const toggleWishlist = (id: number) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Sorted Chauffeurs
  const sortedChauffeurs = useMemo(() => {
    const list = [...chauffeurs];
    if (sortBy === "price_asc") {
      return list.sort(
        (a, b) =>
          parseFloat(a.hourly_rate || a.daily_rate || "0") -
          parseFloat(b.hourly_rate || b.daily_rate || "0")
      );
    }
    if (sortBy === "price_desc") {
      return list.sort(
        (a, b) =>
          parseFloat(b.hourly_rate || b.daily_rate || "0") -
          parseFloat(a.hourly_rate || a.daily_rate || "0")
      );
    }
    if (sortBy === "rating") {
      return list.sort(
        (a, b) => (b.provider?.avg_rating || 0) - (a.provider?.avg_rating || 0)
      );
    }
    return list;
  }, [chauffeurs, sortBy]);

  return (
    <div className="min-h-screen bg-[#090706] text-white py-6 font-sans selection:bg-[#e7bd78] selection:text-black">
      <div className="mx-auto max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] px-4 sm:px-6 lg:px-8">
        {/* =========================================================================
            1. HERO SECTION
        ========================================================================== */}
        <div className="grid items-center gap-7 lg:grid-cols-[0.9fr_1.1fr] mb-6">
          {/* Left Hero Content */}
          <div className="order-2 lg:order-1">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d9a85f]/40 bg-[#e7bd78]/5 px-3 py-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e7bd78]">
                ✦ PREMIUM TRAVEL
              </span>
            </div>

            <h1 className="font-serif text-4xl leading-[1.05] sm:text-5xl lg:text-[54px] text-white">
              Chauffeur
              <br />
              <span className="text-[#e7bd78]">Service</span>
            </h1>

            <p className="mt-4 max-w-md text-sm leading-6 text-white/60 sm:text-base">
              Rides with professional chauffeurs. Travel in comfort, style & class.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#chauffeur-grid"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#f2cb87] to-[#d09a50] px-5 py-3 text-sm font-bold text-[#17100b] transition hover:brightness-105 shadow-lg shadow-[#e7bd78]/10"
              >
                BOOK YOUR RIDE
                <ArrowRight size={16} />
              </a>

              <Link
                href="/account?tab=bookings"
                className="inline-flex items-center gap-2 rounded-xl border border-[#d9a85f]/60 bg-[#1a1410] px-5 py-3 text-sm font-bold text-[#e7bd78] transition hover:bg-[#251e18] hover:text-white shadow-lg"
              >
                <Calendar size={16} />
                MY BOOKINGS
              </Link>
            </div>
          </div>

          {/* Right Hero Image Card */}
          <div className="order-1 lg:order-2">
            <div className="relative overflow-hidden rounded-[26px] border border-[#d9a85f]/60 bg-black shadow-2xl">
              <div className="h-[260px] sm:h-[320px] lg:h-[340px]">
                <img
                  src="https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1400&q=85"
                  alt="Professional chauffeur Range Rover"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

              <div className="absolute bottom-0 left-0 p-5 sm:p-7">
                <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-[#e7bd78] font-bold">
                  PREMIUM EXPERIENCE
                </p>

                <h2 className="font-serif text-2xl sm:text-3xl text-white leading-tight">
                  Arrive in style with
                  <br />
                  professional chauffeurs
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. THREE FEATURES CARDS
        ========================================================================== */}
        <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {featuresList.map((feature) => (
            <div
              key={feature.title}
              className="flex items-center gap-3.5 rounded-2xl border border-[#d9a85f]/30 bg-[#16120e] p-4 sm:p-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e7bd78]/10 text-lg text-[#e7bd78]">
                {feature.icon}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                <p className="text-xs text-white/45 mt-0.5">{feature.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* =========================================================================
            3. MAIN TWO-COLUMN LAYOUT WITH STICKY SIDEBAR
        ========================================================================== */}
        <div id="chauffeur-grid" className="grid gap-7 lg:grid-cols-[290px_1fr] items-start">
          {/* =====================================================
              LEFT COLUMN: STICKY FILTERS SIDEBAR & PROMO CARD
          ====================================================== */}
          <div className="lg:sticky lg:top-24 space-y-6 self-start">
            {/* Filter Chauffeurs Box */}
            <div className="rounded-2xl border border-[#2c2219] bg-[#16120e] p-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <h3 className="font-bold text-white text-base">Filter Chauffeurs</h3>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-white/50 transition hover:text-[#e7bd78]"
                >
                  Reset
                </button>
              </div>

              <div className="space-y-4">
                {/* Car Type Dropdown */}
                <div>
                  <label className="block text-xs text-white/60 mb-1.5 font-medium">
                    Car Type
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCarTypeId}
                      disabled={loadingCarTypes}
                      onChange={(e) =>
                        setSelectedCarTypeId(e.target.value ? Number(e.target.value) : "")
                      }
                      aria-label="Filter by Car Type"
                      className="h-11 w-full appearance-none rounded-xl border border-[#33271d] bg-[#100d0a] px-3.5 text-xs text-white outline-none focus:border-[#e7bd78] transition disabled:opacity-50"
                    >
                      {loadingCarTypes ? (
                        <option value="">Loading car types...</option>
                      ) : carTypes.length === 0 ? (
                        <option value="">No car types found</option>
                      ) : (
                        carTypes.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.id})
                          </option>
                        ))
                      )}
                    </select>
                    <ChevronDown
                      size={15}
                      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40"
                    />
                  </div>
                </div>

                {/* Date Input */}
                <div>
                  <label className="block text-xs text-white/60 mb-1.5 font-medium">
                    Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="h-11 w-full rounded-xl border border-[#33271d] bg-[#100d0a] px-3.5 text-xs text-white outline-none focus:border-[#e7bd78] transition"
                    />
                  </div>
                </div>

                {/* Apply Filters Button */}
                <button
                  type="button"
                  onClick={handleApplyFilters}
                  disabled={loading}
                  className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f2cb87] to-[#d09a50] text-xs font-bold text-[#140e0a] transition hover:brightness-105 disabled:opacity-60 shadow-md shadow-[#e7bd78]/10"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : "Apply Filters"}
                </button>
              </div>
            </div>

            {/* Promo Card */}
            <div className="overflow-hidden rounded-2xl border border-[#2c2219] bg-[#16120e] p-5 shadow-xl">
              <div className="relative h-36 w-full overflow-hidden rounded-xl bg-black mb-4">
                <img
                  src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80"
                  alt="Audi cockpit luxury"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#16120e] via-transparent to-transparent" />
              </div>

              <h4 className="font-serif text-lg font-bold text-white leading-snug">
                Experience
                <br />
                First Class Travel
              </h4>

              <p className="mt-2 text-xs text-white/55 leading-relaxed">
                Professional chauffeurs, premium vehicles, unforgettable journeys.
              </p>

              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#f2cb87] to-[#d09a50] px-4 py-2.5 text-xs font-bold text-[#140e0a] transition hover:brightness-105"
              >
                Learn More
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* =====================================================
              RIGHT COLUMN: BACKEND CHAUFFEURS LISTINGS (INFINITE SCROLL)
          ====================================================== */}
          <div className="space-y-6">
            {/* Top Bar: Title & Results Count & Sort Dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide">
                  Available Chauffeurs
                </h2>
                <p className="text-xs text-white/50 mt-0.5">
                  Showing {sortedChauffeurs.length} results for {filterDate}
                </p>
              </div>

              {/* Actions & Sort Dropdown */}
              <div className="flex items-center gap-3">
                <Link
                  href="/account?tab=bookings"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#d9a85f]/50 bg-[#1f1711] px-3.5 text-xs font-semibold text-[#e7bd78] transition hover:bg-[#2c2017] hover:text-white"
                >
                  <Calendar size={13} />
                  <span>My Bookings</span>
                </Link>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50">Sort</span>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) =>
                        setSortBy(e.target.value as "newest" | "price_asc" | "price_desc" | "rating")
                      }
                      aria-label="Sort chauffeurs by"
                      className="h-9 appearance-none rounded-xl border border-[#33271d] bg-[#16120e] pl-3 pr-8 text-xs font-medium text-white outline-none focus:border-[#e7bd78]"
                    >
                      <option value="newest">Newest</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="rating">Highest Rated</option>
                    </select>
                    <ChevronDown
                      size={14}
                      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-400">
                <AlertTriangle size={16} className="shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Initial Loading State */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 size={36} className="animate-spin text-[#e7bd78] mb-3" />
                <p className="text-xs text-white/50">Fetching available chauffeurs from backend...</p>
              </div>
            ) : sortedChauffeurs.length === 0 ? (
              <div className="rounded-2xl border border-[#2c2219] bg-[#16120e] p-12 text-center">
                <Car size={40} className="mx-auto mb-3 text-white/25" />
                <h3 className="text-base font-bold text-white">No Chauffeurs Found</h3>
                <p className="mt-1 text-xs text-white/45 max-w-xs mx-auto">
                  No chauffeur records returned from backend for this car type or date.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-4 rounded-xl border border-[#e7bd78] bg-[#e7bd78]/10 px-4 py-2 text-xs font-bold text-[#e7bd78]"
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Chauffeurs 3-Column Card Grid */}
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {sortedChauffeurs.map((chauffeur) => (
                    <ChauffeurCard
                      key={chauffeur.id}
                      chauffeur={chauffeur}
                      isWishlisted={wishlist.includes(chauffeur.id)}
                      onToggleWishlist={toggleWishlist}
                    />
                  ))}
                </div>

                {/* Infinite Scroll Intersection Sentinel & Loader */}
                <div
                  ref={observerTarget}
                  className="py-6 flex flex-col items-center justify-center text-xs text-white/40"
                >
                  {loadingMore ? (
                    <div className="flex items-center gap-2 text-[#e7bd78]">
                      <Loader2 size={20} className="animate-spin" />
                      <span>Loading more chauffeurs...</span>
                    </div>
                  ) : hasMore ? (
                    <span className="text-white/30">Scroll to view more</span>
                  ) : sortedChauffeurs.length > 0 ? (
                    <span className="text-white/30">You've reached the end of available chauffeurs</span>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}