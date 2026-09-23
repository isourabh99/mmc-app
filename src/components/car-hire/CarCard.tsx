"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  Fuel,
  Gauge,
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  Shield,
  Snowflake,
} from "lucide-react";
import {
  CarItem,
  formatCurrency,
  getCarPrimaryImage,
} from "@/lib/service/car.api";

interface CarCardProps {
  car: CarItem;
  onBookNow?: (car: CarItem) => void;
}

export const CarCard: React.FC<CarCardProps> = ({ car, onBookNow }) => {
  const primaryImage = getCarPrimaryImage(car);
  const hourlyRateNum = parseFloat(car.hourly_rate || "0");
  const dailyRateNum = parseFloat(car.daily_rate || "0");
  const depositNum = parseFloat(car.security_deposit || "0");

  const displayRate =
    hourlyRateNum > 0
      ? { amount: car.hourly_rate, unit: "hour" }
      : dailyRateNum > 0
      ? { amount: car.daily_rate, unit: "day" }
      : { amount: "0.00", unit: "day" };

  const providerLogo =
    car.provider?.logo_full_path ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80";

  return (
    <div className="group relative flex flex-col rounded-xl sm:rounded-2xl border border-white/10 bg-[#0d0d0d] overflow-hidden transition-all duration-300 hover:border-[#FAD293]/40 hover:shadow-[0_12px_40px_rgba(250,210,147,0.08)] hover:-translate-y-0.5">
      {/* Vehicle Image Container */}
      <div className="relative h-32 sm:h-40 md:h-44 w-full overflow-hidden bg-neutral-900">
        <img
          src={primaryImage}
          alt={car.brand || "Hire Car"}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-black/30" />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1">
          {/* Category / Type Badge */}
          <span
            className="px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-full text-[9px] sm:text-[10px] font-semibold tracking-wide uppercase shadow-md backdrop-blur-md truncate max-w-[55%]"
            style={{
              background: "linear-gradient(135deg, rgba(250,210,147,0.95), rgba(206,164,107,0.95))",
              color: "#1a120b",
            }}
          >
            {car.type?.name || car.category?.name || "Hire"}
          </span>

          {/* Status Badge */}
          <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-full text-[9px] sm:text-[10px] font-medium bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 backdrop-blur-md shrink-0">
            <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
            <span>{car.status === 1 ? "Available" : "Reserved"}</span>
          </div>
        </div>

        {/* Bottom Image Stats (Seats & Transmission) */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1">
          {car.seating_capacity && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/70 border border-white/10 text-[9px] sm:text-[10px] text-white/90 backdrop-blur-md">
              <Users size={10} className="text-[#FAD293]" />
              <span>{car.seating_capacity} Seats</span>
            </div>
          )}
          {car.transmission_type && (
            <div className="hidden xs:flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/70 border border-white/10 text-[9px] sm:text-[10px] text-white/90 backdrop-blur-md">
              <Gauge size={10} className="text-[#FAD293]" />
              <span>{car.transmission_type}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-3.5">
        {/* Title & Pricing Header */}
        <div className="flex items-start justify-between gap-1.5 mb-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#FAD293] transition-colors truncate">
              {car.brand}
            </h3>
            <div className="flex items-center gap-1 text-[10px] text-white/40">
              {car.manufacture_year && (
                <span className="font-mono">{car.manufacture_year}</span>
              )}
              {car.model && (
                <>
                  <span>•</span>
                  <span className="truncate">{car.model}</span>
                </>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <div
              className="text-xs sm:text-sm md:text-base font-extrabold tracking-tight"
              style={{
                background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {formatCurrency(displayRate.amount)}
            </div>
            <span className="text-[9px] uppercase tracking-wider text-white/40 block leading-tight">
              per {displayRate.unit}
            </span>
          </div>
        </div>

        {/* Vehicle Highlights Row */}
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-1 my-1.5 py-1.5 border-y border-white/8 text-[10px] sm:text-[11px] text-white/60">
          <div className="flex items-center gap-1 truncate">
            <Shield size={11} className="text-[#FAD293] shrink-0" />
            <span className="truncate">
              {depositNum > 0
                ? `Dep: ${formatCurrency(depositNum)}`
                : "No Deposit"}
            </span>
          </div>

          <div className="flex items-center gap-1 truncate">
            <Clock size={11} className="text-[#FAD293] shrink-0" />
            <span className="truncate">
              {car.available_hours_start && car.available_hours_end
                ? `${car.available_hours_start.slice(0, 5)} - ${car.available_hours_end.slice(0, 5)}`
                : "Flexible"}
            </span>
          </div>

          {car.air_conditioning === 1 && (
            <div className="hidden xs:flex items-center gap-1 truncate">
              <Snowflake size={11} className="text-[#FAD293] shrink-0" />
              <span className="truncate">Air Conditioned</span>
            </div>
          )}

          <div className="flex items-center gap-1 truncate">
            <MapPin size={11} className="text-[#FAD293] shrink-0" />
            <span className="truncate">
              {car.postcode || car.address || "London"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto grid grid-cols-2 gap-1.5 pt-2">
          <Link
            href={`/car-hire/${car.id}`}
            id={`view-details-${car.id}`}
            className="flex items-center justify-center gap-1 py-1.5 sm:py-2 px-1.5 rounded-lg sm:rounded-xl border border-white/15 bg-white/5 text-[10px] sm:text-xs font-semibold text-white transition hover:bg-white/10 hover:border-[#FAD293]/40 text-center"
          >
            <span>Details</span>
            <ArrowRight size={11} className="text-[#FAD293]" />
          </Link>

          {onBookNow ? (
            <button
              type="button"
              id={`book-now-${car.id}`}
              onClick={() => onBookNow(car)}
              className="flex items-center justify-center py-1.5 sm:py-2 px-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold text-black transition shadow-md hover:brightness-110 active:scale-98 text-center"
              style={{
                background: "linear-gradient(135deg, #FAD293, #CEA46B)",
              }}
            >
              Book Hire
            </button>
          ) : (
            <Link
              href={`/car-hire/${car.id}/book`}
              id={`book-now-${car.id}`}
              className="flex items-center justify-center py-1.5 sm:py-2 px-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold text-black transition shadow-md hover:brightness-110 active:scale-98 text-center"
              style={{
                background: "linear-gradient(135deg, #FAD293, #CEA46B)",
              }}
            >
              Book Hire
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
