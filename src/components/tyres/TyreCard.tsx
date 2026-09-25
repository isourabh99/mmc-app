"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Fuel,
  Droplets,
  Volume2,
  Zap,
  Snowflake,
  Sun,
  Layers,
  CheckCircle2,
  Plus,
  Minus,
  Truck,
  Sparkles,
  ArrowRight,
  Shield,
  Car,
} from "lucide-react";
import { TyreItem } from "@/lib/data/tyres.data";
import { isAuthenticated } from "@/lib/auth.api";

interface TyreCardProps {
  tyre: TyreItem;
  serviceMode: "customer" | "provider"; // Mobile Fitting vs Garage
  onBookNow: (tyre: TyreItem, quantity: number) => void;
}

export const TyreCard: React.FC<TyreCardProps> = ({
  tyre,
  serviceMode,
  onBookNow,
}) => {
  const router = useRouter();
  const [quantity, setQuantity] = useState(2);


  const totalPrice = (tyre.unit_price + tyre.fitting_fee) * quantity;

  const handleIncrement = () => {
    if (quantity < 8) setQuantity(quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const formatGBP = (val: number) =>
    `£${val.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="group relative flex flex-col rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0d0d0d] overflow-hidden transition-all duration-300 hover:border-[#FAD293]/40 hover:shadow-[0_12px_40px_rgba(250,210,147,0.08)] hover:-translate-y-1">
      {/* Top Badges Row */}
      <div className="p-4 sm:p-5 pb-0 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Brand Pill */}
          <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-white/10 text-white border border-white/15">
            {tyre.brand}
          </span>

          {/* Season Pill */}
          {tyre.season === "all_season" ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-950/70 text-amber-300 border border-amber-500/30">
              <Sun size={10} />
              <span>All-Season</span>
            </span>
          ) : tyre.season === "winter" ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-950/70 text-blue-300 border border-blue-500/30">
              <Snowflake size={10} />
              <span>Winter 3PMSF</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-950/40 text-[#FAD293] border border-[#FAD293]/30">
              <Sun size={10} />
              <span>Summer</span>
            </span>
          )}

          {/* EV Ready / RunFlat Badges */}
          {tyre.is_ev_compatible && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
              <Zap size={10} />
              <span>EV Ready</span>
            </span>
          )}

          {tyre.is_runflat && (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-950/70 text-purple-300 border border-purple-500/30">
              Run-Flat
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>In Stock ({tyre.in_stock})</span>
        </div>
      </div>

      {/* Main Card Content */}
      <div className="p-4 sm:p-5 pt-3 space-y-4 flex-1 flex flex-col justify-between">
        {/* Tyre Image & Title Grid */}
        <div className="grid grid-cols-12 gap-3 items-center">
          {/* Tyre Visual */}
          <div className="col-span-4 sm:col-span-4 relative h-28 sm:h-32 rounded-xl bg-neutral-900/80 border border-white/5 overflow-hidden flex items-center justify-center p-2 group-hover:border-[#FAD293]/20 transition">
            <img
              src={tyre.image_url}
              alt={`${tyre.brand} ${tyre.model}`}
              className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=600&q=80";
              }}
            />
          </div>

          {/* Titles & Dimensions */}
          <div className="col-span-8 sm:col-span-8 space-y-1.5">
            <h3 className="text-base sm:text-lg font-black text-white group-hover:text-[#FAD293] transition-colors leading-tight">
              {tyre.model}
            </h3>

            {/* Prominent Size String */}
            <div className="inline-block font-mono font-extrabold text-sm sm:text-base text-[#FAD293] bg-[#FAD293]/10 px-2.5 py-0.5 rounded-lg border border-[#FAD293]/20">
              {tyre.size_string}
            </div>

            <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">
              {tyre.description}
            </p>
          </div>
        </div>

        {/* EU Tyre Ratings Label Strip */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-white/5 border border-white/8 text-[11px]">
          {/* Fuel Efficiency */}
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-500/20">
              <Fuel size={13} />
            </div>
            <div>
              <span className="text-white/40 block text-[9px] uppercase font-bold leading-none">Fuel</span>
              <span className="font-extrabold text-white text-xs">Class {tyre.eu_label.fuel_efficiency}</span>
            </div>
          </div>

          {/* Wet Grip */}
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-sky-950/60 text-sky-400 border border-sky-500/20">
              <Droplets size={13} />
            </div>
            <div>
              <span className="text-white/40 block text-[9px] uppercase font-bold leading-none">Wet Grip</span>
              <span className="font-extrabold text-white text-xs">Class {tyre.eu_label.wet_grip}</span>
            </div>
          </div>

          {/* Noise dB */}
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-purple-950/60 text-purple-400 border border-purple-500/20">
              <Volume2 size={13} />
            </div>
            <div>
              <span className="text-white/40 block text-[9px] uppercase font-bold leading-none">Noise</span>
              <span className="font-extrabold text-white text-xs">{tyre.eu_label.noise_db} dB ({tyre.eu_label.noise_class})</span>
            </div>
          </div>
        </div>

        {/* Inclusive Inclusions Line */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-white/60">
          <span className="flex items-center gap-1">
            <CheckCircle2 size={11} className="text-emerald-400" />
            <span>New Rubber Valve</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 size={11} className="text-emerald-400" />
            <span>Wheel Balancing</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 size={11} className="text-emerald-400" />
            <span>Eco Disposal</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-[#FAD293]">
            <Truck size={11} />
            <span>{serviceMode === "customer" ? "Mobile Van Dispatch" : "Garage Fitting"}</span>
          </span>
        </div>

        {/* Pricing, Quantity, and Booking CTA Row */}
        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Price per tyre & Total */}
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs text-white/50">Each:</span>
              <span className="text-sm font-bold text-white">
                {formatGBP(tyre.unit_price + tyre.fitting_fee)}
              </span>
              <span className="text-[10px] text-white/40">fitted</span>
            </div>

            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xs font-semibold text-white/70">Total ({quantity}):</span>
              <span
                className="text-lg sm:text-xl font-black"
                style={{
                  background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {formatGBP(totalPrice)}
              </span>
            </div>
          </div>

          {/* Quantity Counter & Book CTA */}
          <div className="flex items-center gap-2">
            {/* Quantity Controls */}
            <div className="flex items-center rounded-xl bg-white/5 border border-white/15 p-1">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={quantity <= 1}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white disabled:opacity-30 transition"
              >
                <Minus size={12} />
              </button>
              <span className="w-8 text-center text-xs font-bold font-mono text-white">
                {quantity}
              </span>
              <button
                type="button"
                onClick={handleIncrement}
                disabled={quantity >= 8}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white disabled:opacity-30 transition"
              >
                <Plus size={12} />
              </button>
            </div>

            {/* Book Button */}
            <button
              type="button"
              id={`book-tyre-${tyre.id}`}
              onClick={() => {
                if (!isAuthenticated()) {
                  router.push("/login");
                  return;
                }
                onBookNow(tyre, quantity);
              }}
              className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl font-extrabold text-black text-xs transition shadow-lg hover:brightness-110 active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #FAD293, #CEA46B)",
              }}
            >
              <Sparkles size={14} />
              <span>Book Fitting</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
