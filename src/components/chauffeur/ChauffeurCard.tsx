"use client";

import React from "react";
import {
  Users,
  Star,
  Heart,
  Tag,
  MapPin,
  CreditCard,
  Snowflake,
} from "lucide-react";
import type { Chauffeur } from "@/lib/service/chauffeur.api";

interface ChauffeurCardProps {
  chauffeur: Chauffeur;
  isWishlisted: boolean;
  onToggleWishlist: (id: number) => void;
  onViewDetails: (chauffeur: Chauffeur) => void;
  onBookNow: (chauffeur: Chauffeur) => void;
}

export const ChauffeurCard: React.FC<ChauffeurCardProps> = ({
  chauffeur,
  isWishlisted,
  onToggleWishlist,
  onViewDetails,
  onBookNow,
}) => {
  const carPhoto =
    chauffeur.image_full_paths?.[0] ||
    (chauffeur.images?.[0] && !chauffeur.images[0].endsWith(".png")
      ? chauffeur.images[0]
      : "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80");

  const providerLogo =
    chauffeur.provider?.logo_full_path ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80";

  const formatPrice = (price: string | null | undefined) => {
    if (!price) return "£0.00";
    const num = parseFloat(price);
    if (isNaN(num)) return price;
    return `£${num.toFixed(2)}`;
  };

  return (
    <div className="group flex flex-col rounded-2xl border border-[#2c2219] bg-[#16120e] p-3.5 transition hover:border-[#d9a85f]/60 hover:shadow-xl hover:shadow-[#e7bd78]/5">
      {/* Top Vehicle Image Banner */}
      <div className="relative h-44 w-full overflow-hidden rounded-xl bg-black">
        <img
          src={carPhoto}
          alt={`${chauffeur.brand || ""} ${chauffeur.model || ""}`}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Wishlist Heart Icon */}
        <button
          type="button"
          onClick={() => onToggleWishlist(chauffeur.id)}
          aria-label="Add to wishlist"
          className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 border border-white/15 text-white/80 backdrop-blur-md transition hover:scale-110 hover:text-red-500"
        >
          <Heart
            size={14}
            className={
              isWishlisted ? "fill-red-500 text-red-500" : "text-white/80"
            }
          />
        </button>

        {/* Image Carousel Dots & Capacity Indicator */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 text-[10px] text-white/70 backdrop-blur-md bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
          <Users size={11} className="text-[#e7bd78]" />
          <span>{chauffeur.seating_capacity || 4}</span>
          <span className="text-white/30">•</span>
          <div className="flex gap-1">
            <span className="h-1 w-1 rounded-full bg-[#e7bd78]" />
            <span className="h-1 w-1 rounded-full bg-white/40" />
          </div>
        </div>

        {/* Status Green Badge */}
        <div className="absolute bottom-2.5 right-2.5 rounded-md border border-[#1e542a] bg-[#102919] px-2 py-0.5 text-[10px] font-semibold text-[#34d399] backdrop-blur-md">
          {chauffeur.status === 1 ? "Available" : "Unavailable"}
        </div>
      </div>

      {/* Brand, Model & Hourly Rate */}
      <div className="mt-3 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-white group-hover:text-[#e7bd78] transition">
            {chauffeur.brand || "Chauffeur Vehicle"}
          </h3>
          <p className="text-xs text-white/45">{chauffeur.model || ""}</p>
        </div>

        <div className="text-right">
          <div className="text-base font-bold text-[#e7bd78]">
            {formatPrice(chauffeur.hourly_rate || chauffeur.daily_rate)}
          </div>
          <p className="text-[10px] text-white/40">
            {chauffeur.pricing_type === "daily" ? "per day" : "per hour"}
          </p>
        </div>
      </div>

      {/* Specs List with Backend Data */}
      <div className="my-3 space-y-1.5 border-y border-white/10 py-2.5 text-[11px] text-white/60">
        {/* Car Type / Category */}
        <div className="flex items-center gap-2">
          <Tag size={12} className="text-[#e7bd78] shrink-0" />
          <span className="truncate">
            {chauffeur.type?.name || chauffeur.category?.name || "Chauffeur"}
          </span>
        </div>

        {/* Preferred Areas */}
        <div className="flex items-center gap-2">
          <MapPin size={12} className="text-[#e7bd78] shrink-0" />
          <span className="truncate">
            {chauffeur.preferred_areas ||
              chauffeur.address ||
              chauffeur.provider?.company_address ||
              "Location on request"}
          </span>
        </div>

        {/* Registration Number */}
        <div className="flex items-center gap-2">
          <CreditCard size={12} className="text-[#e7bd78] shrink-0" />
          <span className="truncate">
            {chauffeur.registration_number || "Verified Registration"}
          </span>
        </div>

        {/* AC Available */}
        <div className="flex items-center gap-2">
          <Snowflake size={12} className="text-[#e7bd78] shrink-0" />
          <span>
            {chauffeur.air_conditioning === 1 ? "AC Available" : "Standard"}
          </span>
        </div>
      </div>

      {/* Provider Row */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full overflow-hidden border border-[#3a2d21] bg-[#221a14] shrink-0">
            <img
              src={providerLogo}
              alt={chauffeur.provider?.company_name || "Provider"}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80";
              }}
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-white leading-tight truncate max-w-[120px]">
              {chauffeur.provider?.company_name || "Certified Partner"}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-white/50">
              <Star size={10} className="fill-[#f59e0b] text-[#f59e0b]" />
              <span>
                {chauffeur.provider?.avg_rating || 0} (
                {chauffeur.provider?.rating_count || 0} Reviews)
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onViewDetails(chauffeur)}
          className="text-[11px] text-[#e7bd78] hover:underline"
        >
          View Profile &rsaquo;
        </button>
      </div>

      {/* Action Buttons: View Details & Book Now */}
      <div className="mt-auto grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onViewDetails(chauffeur)}
          className="rounded-xl border border-[#33271d] bg-[#1a140f] py-2 text-xs font-semibold text-white transition hover:bg-[#241c15] text-center"
        >
          View Details
        </button>

        <button
          type="button"
          onClick={() => onBookNow(chauffeur)}
          className="rounded-xl bg-gradient-to-r from-[#f2cb87] to-[#d09a50] py-2 text-xs font-bold text-[#140e0a] transition hover:brightness-105 text-center shadow-md shadow-[#e7bd78]/10"
        >
          Book Now
        </button>
      </div>
    </div>
  );
};
