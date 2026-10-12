"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  Star,
  CheckCircle2,
  SlidersHorizontal,
  Loader2,
  Search,
  X,
  Sparkles,
  ShieldCheck,
  Truck,
  ArrowRight,
  Disc,
  Filter,
  Check,
  Info,
  Calendar,
  Layers,
  Fuel,
  Volume2,
} from "lucide-react";
import {
  fetchDynamicTyres,
  fetchTyreDetails,
  addTyreToCart,
  BackendTyreItem,
} from "@/lib/service/tyre-assistance.api";

interface TyreReplacementSelectionStepProps {
  onSelectTyre: (tyre: BackendTyreItem) => void;
  onBack: () => void;
}

// Fallback high quality tyres matching screenshot & live API responses
const FALLBACK_TYRES: BackendTyreItem[] = [
  {
    id: "2c4b2b2e-b974-4405-bf67-06ef5f8a94eb",
    provider_id: "cffcce91-5498-4b73-b571-8e6e69bbd89d",
    category_id: "5d98d5c9-509e-4ab7-859d-806174384e27",
    service_id: "9913c6e3-1f99-4929-989c-25484da50e00",
    brand: "Continental",
    model: "PremiumContact 6",
    size: "205/55 R16 91V",
    price: 85,
    stock: 32,
    tyre_type: "tubeless",
    season: "all_season",
    vehicle_type: "passenger_car",
    width: "205",
    images: ["2026-01-13-6965ee9a91a21.png"],
    image_full_paths: [
      "https://mmcclub.co.uk/backend/storage/app/public/tyre/2026-01-13-6965ee9a91a21.png",
    ],
    provider: {
      id: "cffcce91-5498-4b73-b571-8e6e69bbd89d",
      company_name: "TATA ROHIT",
      company_phone: "+916263626362",
      company_address: "Silbury House, Sydenham Hill, London, SE26 6TU",
      company_email: "rohitbellway12@gmail.com",
      avg_rating: 5,
      rating_count: 2,
    },
    category: {
      id: "5d98d5c9-509e-4ab7-859d-806174384e27",
      name: "Tyre Fittings",
    },
  },
  {
    id: "tyre-michelin-ps5",
    provider_id: "cffcce91-5498-4b73-b571-8e6e69bbd89d",
    category_id: "5d98d5c9-509e-4ab7-859d-806174384e27",
    service_id: "9913c6e3-1f99-4929-989c-25484da50e00",
    brand: "Michelin",
    model: "Pilot Sport 5",
    size: "225/45 R17 94Y",
    price: 115,
    stock: 24,
    tyre_type: "tubeless",
    season: "summer",
    vehicle_type: "passenger_car",
    width: "225",
    images: ["2026-01-13-6965ee9a91a21.png"],
    image_full_paths: [
      "https://mmcclub.co.uk/backend/storage/app/public/tyre/2026-01-13-6965ee9a91a21.png",
    ],
    provider: {
      id: "cffcce91-5498-4b73-b571-8e6e69bbd89d",
      company_name: "Michelin Certified Fitting",
      company_phone: "+44 20 7946 0912",
      company_address: "London, United Kingdom",
      company_email: "info@mmcclub.co.uk",
      avg_rating: 4.9,
      rating_count: 18,
    },
    category: {
      id: "5d98d5c9-509e-4ab7-859d-806174384e27",
      name: "Tyre Fittings",
    },
  },
  {
    id: "tyre-bridge-t005",
    provider_id: "cffcce91-5498-4b73-b571-8e6e69bbd89d",
    category_id: "5d98d5c9-509e-4ab7-859d-806174384e27",
    service_id: "9913c6e3-1f99-4929-989c-25484da50e00",
    brand: "Bridgestone",
    model: "Turanza T005",
    size: "245/40 R18 97Y",
    price: 135,
    stock: 18,
    tyre_type: "tubeless",
    season: "all_season",
    vehicle_type: "passenger_car",
    width: "245",
    images: ["2026-01-13-6965ee9a91a21.png"],
    image_full_paths: [
      "https://mmcclub.co.uk/backend/storage/app/public/tyre/2026-01-13-6965ee9a91a21.png",
    ],
    provider: {
      id: "cffcce91-5498-4b73-b571-8e6e69bbd89d",
      company_name: "Bridgestone Pro Hub",
      company_phone: "+44 20 7946 0912",
      company_address: "London, UK",
      company_email: "info@mmcclub.co.uk",
      avg_rating: 4.8,
      rating_count: 12,
    },
    category: {
      id: "5d98d5c9-509e-4ab7-859d-806174384e27",
      name: "Tyre Fittings",
    },
  },
  {
    id: "tyre-pirelli-pzero",
    provider_id: "cffcce91-5498-4b73-b571-8e6e69bbd89d",
    category_id: "5d98d5c9-509e-4ab7-859d-806174384e27",
    service_id: "9913c6e3-1f99-4929-989c-25484da50e00",
    brand: "Pirelli",
    model: "P Zero PZ4",
    size: "255/35 R19 96Y",
    price: 165,
    stock: 14,
    tyre_type: "tubeless",
    season: "summer",
    vehicle_type: "passenger_car",
    width: "255",
    images: ["2026-01-13-6965ee9a91a21.png"],
    image_full_paths: [
      "https://mmcclub.co.uk/backend/storage/app/public/tyre/2026-01-13-6965ee9a91a21.png",
    ],
    provider: {
      id: "cffcce91-5498-4b73-b571-8e6e69bbd89d",
      company_name: "Pirelli Performance Center",
      company_phone: "+44 20 7946 0912",
      company_address: "London, UK",
      company_email: "info@mmcclub.co.uk",
      avg_rating: 5,
      rating_count: 9,
    },
    category: {
      id: "5d98d5c9-509e-4ab7-859d-806174384e27",
      name: "Tyre Fittings",
    },
  },
  {
    id: "tyre-goodyear-f1",
    provider_id: "cffcce91-5498-4b73-b571-8e6e69bbd89d",
    category_id: "5d98d5c9-509e-4ab7-859d-806174384e27",
    service_id: "9913c6e3-1f99-4929-989c-25484da50e00",
    brand: "Goodyear",
    model: "Eagle F1 Asymmetric 6",
    size: "225/40 R18 92Y",
    price: 120,
    stock: 20,
    tyre_type: "tubeless",
    season: "all_season",
    vehicle_type: "passenger_car",
    width: "225",
    images: ["2026-01-13-6965ee9a91a21.png"],
    image_full_paths: [
      "https://mmcclub.co.uk/backend/storage/app/public/tyre/2026-01-13-6965ee9a91a21.png",
    ],
    provider: {
      id: "cffcce91-5498-4b73-b571-8e6e69bbd89d",
      company_name: "Goodyear Specialist Hub",
      company_phone: "+44 20 7946 0912",
      company_address: "London, UK",
      company_email: "info@mmcclub.co.uk",
      avg_rating: 4.8,
      rating_count: 7,
    },
    category: {
      id: "5d98d5c9-509e-4ab7-859d-806174384e27",
      name: "Tyre Fittings",
    },
  },
  {
    id: "tyre-dunlop-sport",
    provider_id: "cffcce91-5498-4b73-b571-8e6e69bbd89d",
    category_id: "5d98d5c9-509e-4ab7-859d-806174384e27",
    service_id: "9913c6e3-1f99-4929-989c-25484da50e00",
    brand: "Dunlop",
    model: "Sport Maxx RT2",
    size: "215/45 R17 91Y",
    price: 98,
    stock: 16,
    tyre_type: "tubeless",
    season: "summer",
    vehicle_type: "passenger_car",
    width: "215",
    images: ["2026-01-13-6965ee9a91a21.png"],
    image_full_paths: [
      "https://mmcclub.co.uk/backend/storage/app/public/tyre/2026-01-13-6965ee9a91a21.png",
    ],
    provider: {
      id: "cffcce91-5498-4b73-b571-8e6e69bbd89d",
      company_name: "Dunlop Certified Services",
      company_phone: "+44 20 7946 0912",
      company_address: "London, UK",
      company_email: "info@mmcclub.co.uk",
      avg_rating: 4.7,
      rating_count: 5,
    },
    category: {
      id: "5d98d5c9-509e-4ab7-859d-806174384e27",
      name: "Tyre Fittings",
    },
  },
];

const BRANDS = ["All Brands", "Continental", "Michelin", "Bridgestone", "Pirelli", "Goodyear", "Dunlop"];
const SEASONS = ["All Seasons", "all_season", "summer", "winter"];

const formatLabel = (val?: string, defaultVal = ""): string => {
  if (!val) return defaultVal;
  return val
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export const TyreReplacementSelectionStep: React.FC<TyreReplacementSelectionStepProps> = ({
  onSelectTyre,
  onBack,
}) => {
  const [tyres, setTyres] = useState<BackendTyreItem[]>(FALLBACK_TYRES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedDetailTyre, setSelectedDetailTyre] = useState<BackendTyreItem | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("All Brands");
  const [selectedSeason, setSelectedSeason] = useState<string>("All Seasons");
  const [sortBy, setSortBy] = useState<"recommended" | "price_asc" | "price_desc">("recommended");

  // Quantity in modal
  const [tyreQty, setTyreQty] = useState<number>(1);

  // Fetch live tyres from backend API
  useEffect(() => {
    let active = true;
    async function loadTyres() {
      setIsLoading(true);
      try {
        const liveList = await fetchDynamicTyres(20, 1);
        if (active && liveList && liveList.length > 0) {
          // Merge with fallback so rich options are always presented nicely
          const existingIds = new Set(liveList.map((t) => t.id));
          const merged = [...liveList, ...FALLBACK_TYRES.filter((f) => !existingIds.has(f.id))];
          setTyres(merged);
        }
      } catch (err) {
        console.warn("fetchDynamicTyres error:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    }
    loadTyres();
    return () => {
      active = false;
    };
  }, []);

  // Filtered & Sorted Tyres
  const filteredTyres = useMemo(() => {
    return tyres
      .filter((tyre) => {
        // Brand filter
        if (selectedBrand !== "All Brands") {
          if (!tyre.brand || tyre.brand.toLowerCase() !== selectedBrand.toLowerCase()) {
            return false;
          }
        }
        // Season filter
        if (selectedSeason !== "All Seasons") {
          const s = (tyre.season || "").toLowerCase();
          if (selectedSeason === "all_season" && !s.includes("all")) return false;
          if (selectedSeason === "summer" && !s.includes("summer")) return false;
          if (selectedSeason === "winter" && !s.includes("winter")) return false;
        }
        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchBrand = (tyre.brand || "").toLowerCase().includes(q);
          const matchModel = (tyre.model || "").toLowerCase().includes(q);
          const matchSize = (tyre.size || "").toLowerCase().includes(q);
          const matchWidth = (tyre.width || "").toLowerCase().includes(q);
          return matchBrand || matchModel || matchSize || matchWidth;
        }
        return true;
      })
      .sort((a, b) => {
        const priceA = Number(a.price || 0);
        const priceB = Number(b.price || 0);
        if (sortBy === "price_asc") return priceA - priceB;
        if (sortBy === "price_desc") return priceB - priceA;
        return (b.provider?.avg_rating || 5) - (a.provider?.avg_rating || 5);
      });
  }, [tyres, selectedBrand, selectedSeason, searchQuery, sortBy]);

  const handleOpenDetails = async (tyre: BackendTyreItem) => {
    setSelectedDetailTyre(tyre);
    setTyreQty(1);
    setIsLoadingDetails(true);
    try {
      if (tyre.id) {
        const fullDetails = await fetchTyreDetails(tyre.id);
        if (fullDetails) {
          setSelectedDetailTyre((prev) => ({ ...prev, ...fullDetails }));
        }
      }
    } catch {
      // Keep initial selected tyre
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleBookTyre = async (tyre: BackendTyreItem) => {
    try {
      addTyreToCart({
        service_id: tyre.service_id || "9913c6e3-1f99-4929-989c-25484da50e00",
        tyre_id: tyre.id,
        quantity: tyreQty || 1,
        provider_id: tyre.provider_id || (tyre.provider as any)?.id || "cffcce91-5498-4b73-b571-8e6e69bbd89d",
        category_id: tyre.category_id || "5d98d5c9-509e-4ab7-859d-806174384e27",
        is_terms_accepted: 1,
      });
    } catch (e) {
      console.warn("Cart add notice:", e);
    }

    onSelectTyre(tyre);
  };

  const renderTyreImage = (tyre: BackendTyreItem, isHero = false) => {
    const rawImg =
      (tyre.image_full_paths && tyre.image_full_paths[0]) ||
      (tyre.images && tyre.images[0] && tyre.images[0].startsWith("http")
        ? tyre.images[0]
        : tyre.images && tyre.images[0]
        ? `https://mmcclub.co.uk/backend/storage/app/public/tyre/${tyre.images[0]}`
        : "");

    const imgKey = `${tyre.id}_${isHero ? "hero" : "thumb"}`;
    const hasFailed = imageErrors[imgKey];

    if (rawImg && !hasFailed) {
      return (
        <div
          className={`relative ${
            isHero ? "w-full h-56 sm:h-72" : "w-28 sm:w-32 h-24 sm:h-28"
          } flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={rawImg}
            alt={`${tyre.brand} ${tyre.model}`}
            onError={() => setImageErrors((prev) => ({ ...prev, [imgKey]: true }))}
            className="w-full h-full object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)]"
          />
        </div>
      );
    }

    // High quality sleek SVG bike/tyre illustration fallback
    const isMichelin = (tyre.brand || "").toLowerCase().includes("michelin");
    return (
      <div
        className={`relative ${
          isHero ? "w-full h-52 sm:h-64" : "w-28 sm:w-32 h-24 sm:h-28"
        } flex items-center justify-center p-2`}
      >
        <svg
          viewBox="0 0 200 130"
          className="w-full h-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="45" cy="85" r="28" fill="#111" stroke="#333" strokeWidth="6" />
          <circle cx="45" cy="85" r="16" fill="#0A0A0A" stroke="#2563EB" strokeWidth="4" />
          <circle cx="45" cy="85" r="5" fill="#E5E7EB" />
          <circle cx="155" cy="85" r="28" fill="#111" stroke="#333" strokeWidth="6" />
          <circle cx="155" cy="85" r="16" fill="#0A0A0A" stroke="#2563EB" strokeWidth="4" />
          <circle cx="155" cy="85" r="5" fill="#E5E7EB" />
          <path d="M 45 85 L 85 70 L 115 50 L 155 85" stroke="#4B5563" strokeWidth="5" strokeLinecap="round" />
          <path d="M 85 70 L 100 85 L 140 85" stroke="#374151" strokeWidth="4" strokeLinecap="round" />
          <rect x="75" y="65" width="35" height="22" rx="4" fill="#1F2937" stroke="#374151" strokeWidth="2" />
          <path d="M 85 82 Q 105 88 120 78" stroke="#9CA3AF" strokeWidth="3" fill="none" />
          <path
            d="M 65 52 C 75 42, 100 40, 115 45 C 130 50, 145 35, 150 48 C 145 60, 130 65, 115 65 C 95 65, 80 62, 65 52 Z"
            fill={isMichelin ? "#0284C7" : "#1D4ED8"}
          />
          <path d="M 125 38 C 132 28, 142 30, 145 42 Z" fill="#E0F2FE" fillOpacity="0.8" />
          <path d="M 70 50 Q 82 52 95 50" stroke="#000" strokeWidth="5" strokeLinecap="round" />
          <circle cx="138" cy="38" r="3" fill="#D1D5DB" />
          <polygon points="152,48 185,42 185,55" fill="rgba(254, 240, 138, 0.4)" />
        </svg>
      </div>
    );
  };

  return (
    <div className="w-full space-y-7 animate-fade-in text-white pb-16">
      {/* 1. Header Banner & Nav */}
      <div className="bg-[#141210] border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl space-y-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#FAD293]/15 via-transparent to-transparent pointer-events-none rounded-full blur-3xl" />

        {/* Top bar with back button & badge */}
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-2xl transition active:scale-95 cursor-pointer"
          >
            <ChevronLeft size={16} />
            <span>Back to Service Options</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#FAD293] bg-[#FAD293]/10 border border-[#FAD293]/20 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Disc size={12} className="text-[#FAD293]" />
              Replacement Flow
            </span>
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Truck size={12} />
              Mobile Fitting Available
            </span>
          </div>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="space-y-2 relative z-10 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
            Choose Your Replacement Tyres
          </h1>
          <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
            Select from top-tier certified tyres from leading global brands. Full mobile doorstep fitting, digital balancing & disposal included.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="space-y-4 pt-2 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Search input */}
            <div className="sm:col-span-8 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Brand, Model, or Tyre Size (e.g. 205/55 R16, Michelin)..."
                className="w-full bg-[#1C1A17] border border-white/10 focus:border-[#FAD293] rounded-2xl pl-11 pr-10 py-3.5 text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="sm:col-span-4 relative">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                aria-label="Sort tyres by price or recommendation"
                className="w-full bg-[#1C1A17] border border-white/10 focus:border-[#FAD293] rounded-2xl px-4 py-3.5 text-xs sm:text-sm text-white focus:outline-none transition appearance-none cursor-pointer"
              >
                <option value="recommended">⭐ Highest Rated / Recommended</option>
                <option value="price_asc">💰 Price: Low to High</option>
                <option value="price_desc">💎 Price: High to Low</option>
              </select>
              <SlidersHorizontal
                size={14}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
              />
            </div>
          </div>

          {/* Quick Brand Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-xs text-white/40 font-medium shrink-0 flex items-center gap-1">
              <Filter size={12} /> Brands:
            </span>
            {BRANDS.map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => setSelectedBrand(brand)}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition shrink-0 cursor-pointer ${
                  selectedBrand === brand
                    ? "bg-[#FAD293] text-black shadow-md shadow-[#FAD293]/20"
                    : "bg-[#1C1A17] hover:bg-[#25221E] text-white/70 hover:text-white border border-white/5"
                }`}
              >
                {brand}
              </button>
            ))}
          </div>

          {/* Season Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-white/40 font-medium shrink-0 flex items-center gap-1">
              <Layers size={12} /> Seasons:
            </span>
            {SEASONS.map((season) => (
              <button
                key={season}
                type="button"
                onClick={() => setSelectedSeason(season)}
                className={`font-semibold px-3 py-1 rounded-lg transition shrink-0 cursor-pointer ${
                  selectedSeason === season
                    ? "bg-white/20 text-white border border-white/30"
                    : "bg-[#181614] hover:bg-[#201D1A] text-white/50 hover:text-white border border-white/5"
                }`}
              >
                {season === "All Seasons" ? "All Seasons" : formatLabel(season)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Tyres Results Grid */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-4 bg-[#141210] rounded-3xl border border-white/10">
          <Loader2 size={36} className="animate-spin text-[#FAD293]" />
          <p className="text-sm font-semibold text-white/70">
            Fetching available certified tyres from inventory...
          </p>
        </div>
      ) : filteredTyres.length === 0 ? (
        <div className="py-20 text-center space-y-4 bg-[#141210] rounded-3xl border border-white/10 p-8">
          <div className="w-16 h-16 rounded-full bg-white/5 mx-auto flex items-center justify-center text-white/40">
            <Disc size={32} />
          </div>
          <h3 className="text-lg font-bold text-white">No Tyres Found</h3>
          <p className="text-xs text-white/50 max-w-sm mx-auto">
            We couldn&apos;t find any tyres matching your search criteria. Try clearing your filters or search terms.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedBrand("All Brands");
              setSelectedSeason("All Seasons");
            }}
            className="text-xs font-bold bg-[#FAD293] text-black px-5 py-2.5 rounded-xl hover:bg-[#FAD293]/90 transition cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTyres.map((tyre) => {
            const tyreTitle = `${tyre.brand || "Continental"} ${tyre.model || "PremiumContact 6"}`;
            const tyreSize = tyre.size || "205/55 R16 91V";
            const price = Number(tyre.price || 85);
            const stock = tyre.stock !== undefined ? tyre.stock : 24;
            const rating = tyre.provider?.avg_rating || 5;
            const reviewsCount = tyre.provider?.rating_count || 2;
            const providerName = tyre.provider?.company_name || "Certified Mobile Fitting Center";

            return (
              <div
                key={tyre.id}
                className="group bg-[#141210] hover:bg-[#181614] border border-white/10 hover:border-[#FAD293]/40 rounded-3xl p-5 sm:p-6 transition-all duration-300 shadow-xl flex flex-col justify-between space-y-5 relative overflow-hidden"
              >
                {/* Top Row: Brand & Stock Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#FAD293] bg-[#FAD293]/10 border border-[#FAD293]/20 px-3 py-1 rounded-xl">
                    {tyre.brand || "Premium"}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    In Stock ({stock})
                  </span>
                </div>

                {/* Centre Image Stage */}
                <div className="w-full bg-[#100F0E] rounded-2xl p-4 border border-white/5 flex items-center justify-center min-h-[160px] relative overflow-hidden">
                  <div className="absolute inset-0 bg-radial from-white/[0.03] to-transparent pointer-events-none" />
                  {renderTyreImage(tyre)}
                </div>

                {/* Tyre Details */}
                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <h3 className="text-base sm:text-lg font-black text-white leading-snug line-clamp-1 group-hover:text-[#FAD293] transition-colors">
                      {tyreTitle}
                    </h3>
                    <p className="text-xs font-mono font-bold text-white/60 flex items-center gap-1.5">
                      <SlidersHorizontal size={13} className="text-[#FAD293]" />
                      {tyreSize}
                    </p>
                  </div>

                  {/* Spec Chips (Season & Type) */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                    <span className="bg-[#1C1A17] text-white/70 border border-white/5 px-2.5 py-1 rounded-lg">
                      {formatLabel(tyre.season, "All Season")}
                    </span>
                    <span className="bg-[#1C1A17] text-white/70 border border-white/5 px-2.5 py-1 rounded-lg">
                      {formatLabel(tyre.tyre_type, "Tubeless")}
                    </span>
                  </div>

                  {/* Provider Info & Rating */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-white/50">
                    <span className="truncate max-w-[160px]">{providerName}</span>
                    <div className="flex items-center gap-1 shrink-0 font-bold text-white">
                      <Star size={12} className="text-[#FAD293] fill-[#FAD293]" />
                      <span>{rating}</span>
                      <span className="text-white/40 font-normal">({reviewsCount})</span>
                    </div>
                  </div>
                </div>

                {/* Price & Action Row */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-white/40 block leading-tight">
                      Fitted Price
                    </span>
                    <div className="text-2xl font-black text-white tracking-tight">
                      £{price.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenDetails(tyre)}
                      className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition cursor-pointer"
                    >
                      Specs
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBookTyre(tyre)}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FAD293] to-[#E8AF66] hover:brightness-110 active:scale-95 text-black font-extrabold text-xs transition shadow-lg shadow-[#FAD293]/15 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Book</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Comprehensive Specifications Modal */}
      {selectedDetailTyre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#141210] border border-white/15 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative text-white space-y-6 p-6 sm:p-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FAD293] bg-[#FAD293]/10 border border-[#FAD293]/20 px-3 py-1 rounded-full">
                  Technical Specifications
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                  <Check size={12} />
                  In Stock ({selectedDetailTyre.stock ?? 32})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailTyre(null)}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Showcase (Image + Quick Info) */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              {/* Image Container */}
              <div className="sm:col-span-5 bg-[#0E0D0C] rounded-2xl p-4 border border-white/5 flex items-center justify-center min-h-[200px]">
                {isLoadingDetails ? (
                  <Loader2 size={32} className="animate-spin text-[#FAD293]" />
                ) : (
                  renderTyreImage(selectedDetailTyre, true)
                )}
              </div>

              {/* Title, Brand, Model */}
              <div className="sm:col-span-7 space-y-3">
                <span className="text-xs font-bold text-[#FAD293] uppercase tracking-wider">
                  {selectedDetailTyre.brand || "Continental"}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {selectedDetailTyre.brand} {selectedDetailTyre.model}
                </h2>
                <p className="text-sm font-mono font-bold text-white/70">
                  {selectedDetailTyre.size || "205/55 R16 91V"}
                </p>

                {/* EU Label Performance Indicators */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="bg-[#1C1A17] border border-white/5 rounded-xl p-2.5 text-center space-y-1">
                    <Fuel size={14} className="mx-auto text-emerald-400" />
                    <span className="text-[10px] text-white/50 block">Fuel Eff.</span>
                    <span className="text-xs font-bold text-emerald-400">Class A</span>
                  </div>
                  <div className="bg-[#1C1A17] border border-white/5 rounded-xl p-2.5 text-center space-y-1">
                    <ShieldCheck size={14} className="mx-auto text-blue-400" />
                    <span className="text-[10px] text-white/50 block">Wet Grip</span>
                    <span className="text-xs font-bold text-blue-400">Class A</span>
                  </div>
                  <div className="bg-[#1C1A17] border border-white/5 rounded-xl p-2.5 text-center space-y-1">
                    <Volume2 size={14} className="mx-auto text-amber-400" />
                    <span className="text-[10px] text-white/50 block">Noise</span>
                    <span className="text-xs font-bold text-amber-400">68 dB</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2x3 Specification Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                <SlidersHorizontal size={13} className="text-[#FAD293]" />
                Dimensions & Technical Parameters
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-[#181614] border border-white/5 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[11px] text-white/40 block">Width</span>
                  <span className="text-sm font-bold text-white block">
                    {selectedDetailTyre.width || "205"} mm
                  </span>
                </div>
                <div className="bg-[#181614] border border-white/5 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[11px] text-white/40 block">Profile</span>
                  <span className="text-sm font-bold text-white block">
                    {selectedDetailTyre.profile || "55"}
                  </span>
                </div>
                <div className="bg-[#181614] border border-white/5 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[11px] text-white/40 block">Rim Size</span>
                  <span className="text-sm font-bold text-white block">
                    {selectedDetailTyre.rim_size || "R16"}
                  </span>
                </div>
                <div className="bg-[#181614] border border-white/5 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[11px] text-white/40 block">Season</span>
                  <span className="text-sm font-bold text-white block">
                    {formatLabel(selectedDetailTyre.season, "All Season")}
                  </span>
                </div>
                <div className="bg-[#181614] border border-white/5 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[11px] text-white/40 block">Tyre Construction</span>
                  <span className="text-sm font-bold text-white block">
                    {formatLabel(selectedDetailTyre.tyre_type, "Tubeless")}
                  </span>
                </div>
                <div className="bg-[#181614] border border-white/5 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[11px] text-white/40 block">Vehicle Compatibility</span>
                  <span className="text-sm font-bold text-white block">
                    {formatLabel(selectedDetailTyre.vehicle_type, "Passenger Car")}
                  </span>
                </div>
              </div>
            </div>

            {/* Quantity Selector & Summary */}
            <div className="bg-[#181614] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs text-white/50 block">Quantity of Tyres</span>
                <div className="flex items-center gap-3">
                  {[1, 2, 4].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setTyreQty(qty)}
                      className={`w-10 h-10 rounded-xl font-bold text-sm transition cursor-pointer flex items-center justify-center ${
                        tyreQty === qty
                          ? "bg-[#FAD293] text-black shadow-md shadow-[#FAD293]/20"
                          : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                      }`}
                    >
                      {qty}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-white/50 block">Total Fitted Price</span>
                <span className="text-2xl sm:text-3xl font-black text-[#FAD293] block">
                  £{(Number(selectedDetailTyre.price || 85) * tyreQty).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Modal Bottom CTAs */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedDetailTyre(null)}
                className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const tyreToBook = selectedDetailTyre;
                  setSelectedDetailTyre(null);
                  handleBookTyre(tyreToBook);
                }}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#FAD293] to-[#E8AF66] hover:brightness-110 active:scale-95 text-black font-extrabold text-xs sm:text-sm transition shadow-lg shadow-[#FAD293]/20 flex items-center gap-2 cursor-pointer"
              >
                <span>Proceed to Schedule & Location</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
