"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Clock,
  CreditCard,
  Check,
  Copy,
  Car,
  RefreshCw,
  Loader2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { type CustomerBookingItem } from "@/lib/service/chauffeur.api";

interface BookingsTabProps {
  bookings: CustomerBookingItem[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
}

export const BookingsTab: React.FC<BookingsTabProps> = ({
  bookings,
  loading,
  error,
  onRefresh,
}) => {
  const [bookingFilter, setBookingFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatPrice = (price: string | number | null | undefined) => {
    if (!price) return "£0.00";
    const num = typeof price === "number" ? price : parseFloat(price);
    if (isNaN(num)) return String(price);
    return `£${num.toLocaleString("en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === "all") return true;
    if (bookingFilter === "pending")
      return b.booking_status === "pending" || b.payment_status === "pending";
    if (bookingFilter === "paid")
      return b.payment_status === "paid" || b.is_paid === 1;
    if (bookingFilter === "completed") return b.booking_status === "completed";
    if (bookingFilter === "canceled") return b.booking_status === "canceled";
    return b.booking_status === bookingFilter;
  });

  return (
    <div className="rounded-3xl border border-[#33271d] bg-[#14100c] p-4 sm:p-7 shadow-2xl space-y-5">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Chauffeur Reservations</h2>
            <span className="rounded-full border border-[#d9a85f]/40 bg-[#d9a85f]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#e7bd78]">
              {bookings.length} {bookings.length === 1 ? "Trip" : "Trips"}
            </span>
          </div>
          <p className="text-xs text-white/50 mt-0.5">
            Review live chauffeur itineraries, schedule, and payment details
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-[#33271d] bg-[#1a1410] px-3.5 py-1.5 text-xs font-semibold text-white/80 transition hover:border-[#d9a85f]/50 hover:text-white self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw
            size={13}
            className={loading ? "animate-spin text-[#e7bd78]" : ""}
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: "all", label: "All Reservations" },
          { id: "paid", label: "Paid" },
          { id: "pending", label: "Pending Payment" },
          { id: "completed", label: "Completed" },
          { id: "canceled", label: "Canceled" },
        ].map((filter) => {
          const isSelected = bookingFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setBookingFilter(filter.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                isSelected
                  ? "bg-gradient-to-r from-[#f2cb87] to-[#d09a50] text-[#140e0a] font-bold shadow-sm"
                  : "border border-[#33271d] bg-[#1a1410] text-white/60 hover:bg-[#221a14] hover:text-white"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <Loader2 size={36} className="animate-spin text-[#e7bd78]" />
          <p className="text-xs text-white/60">Fetching your bookings from server...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-950/20 p-6 text-center space-y-3">
          <AlertCircle size={32} className="mx-auto text-red-400" />
          <p className="text-xs text-red-300">{error}</p>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-xl border border-red-500/40 bg-red-900/30 px-4 py-2 text-xs font-semibold text-white hover:bg-red-900/50"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredBookings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="flex h-18 w-18 items-center justify-center rounded-3xl border border-[#33271d] bg-[#1a1410] text-[#e7bd78]">
            <Car size={32} />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">No Bookings Found</h4>
            <p className="max-w-xs text-xs text-white/50 mt-1">
              You haven&apos;t placed any reservations matching this filter.
            </p>
          </div>
          <Link
            href="/services/Chauffeur"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#f2cb87] to-[#d09a50] px-5 py-2.5 text-xs font-bold text-[#140e0a] shadow-md transition hover:brightness-105"
          >
            <span>Explore Chauffeur Fleet</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Bookings List Cards */}
      {!loading && !error && (
        <div className="space-y-4">
          {filteredBookings.map((item) => {
            const car = item.car;
            const isPaid = item.is_paid === 1 || item.payment_status === "paid";
            const isPending = item.booking_status === "pending";
            const isCompleted = item.booking_status === "completed";

            return (
              <div
                key={item.id || item.booking_id}
                className="rounded-2xl border border-[#33271d] bg-[#17120e] p-4 sm:p-5 space-y-4 shadow-xl transition hover:border-[#d9a85f]/60"
              >
                {/* Top Row: Vehicle Image, Title, Status Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border border-[#3a2d21] bg-black">
                      <img
                        src={
                          car?.image_full_paths?.[0] ||
                          (Array.isArray(car?.images) && car?.images?.[0]
                            ? `https://mmcclub.co.uk/storage/app/public/car/${car.images[0]}`
                            : "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80")
                        }
                        alt={car?.brand || "Chauffeur Vehicle"}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">
                          {car?.brand || "Luxury Chauffeur"} {car?.model || ""}
                        </h4>
                        {car?.registration_number && (
                          <span className="rounded bg-[#251b13] px-1.5 py-0.5 font-mono text-[9px] text-[#e7bd78] border border-[#3a2d21]">
                            {car.registration_number}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-white/50 mt-0.5">
                        <span>Booking ID:</span>
                        <span className="font-mono text-white/80">{item.booking_id}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.booking_id)}
                          className="text-white/40 hover:text-white transition"
                          title="Copy ID"
                        >
                          {copiedId === item.booking_id ? (
                            <Check size={12} className="text-[#10b981]" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isCompleted
                          ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40"
                          : isPending
                          ? "bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40"
                          : "bg-[#3b82f6]/20 text-[#60a5fa] border border-[#3b82f6]/40"
                      }`}
                    >
                      {item.booking_status || "Pending"}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isPaid
                          ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      }`}
                    >
                      {isPaid ? "✓ Paid" : "Payment Pending"}
                    </span>
                  </div>
                </div>

                {/* Route & Schedule Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  
                  {/* Itinerary */}
                  <div className="rounded-xl border border-[#2d2218] bg-[#110e0b] p-3 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#e7bd78] flex items-center gap-1.5">
                      <MapPin size={12} />
                      Route & Coordinates
                    </span>

                    <div className="space-y-1.5">
                      <div className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#10b981]" />
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] text-white/40 block uppercase">Pickup Location</span>
                          <span className="text-white font-medium break-words block">
                            {item.pickup_location || "Not specified"}
                          </span>
                          {item.pickup_coordinates && (
                            <span className="text-[9px] text-[#10b981] font-mono block mt-0.5">
                              📍 {Number(item.pickup_coordinates.latitude).toFixed(4)}, {Number(item.pickup_coordinates.longitude).toFixed(4)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#ef4444]" />
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] text-white/40 block uppercase">Destination</span>
                          <span className="text-white font-medium break-words block">
                            {item.drop_location || "Not specified"}
                          </span>
                          {item.drop_coordinates && (
                            <span className="text-[9px] text-[#ef4444] font-mono block mt-0.5">
                              📍 {Number(item.drop_coordinates.latitude).toFixed(4)}, {Number(item.drop_coordinates.longitude).toFixed(4)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Schedule & Timing */}
                  <div className="rounded-xl border border-[#2d2218] bg-[#110e0b] p-3 space-y-2 flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#e7bd78] flex items-center gap-1.5">
                      <Calendar size={12} />
                      Schedule & Timing
                    </span>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-white/40 text-[10px] block">Dates</span>
                        <span className="font-semibold text-white">
                          {formatDate(item.start_date)}
                        </span>
                        {item.end_date !== item.start_date && (
                          <span className="text-[10px] text-white/60 block">
                            to {formatDate(item.end_date)}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-white/40 text-[10px] block">Time Slots</span>
                        <span className="font-semibold text-white flex items-center gap-1">
                          <Clock size={10} className="text-[#10b981]" />
                          {item.pickup_time || "10:00 AM"}
                        </span>
                        {item.drop_time && (
                          <span className="text-[10px] text-white/60 flex items-center gap-1 mt-0.5">
                            <Clock size={10} className="text-[#ef4444]" />
                            {item.drop_time}
                          </span>
                        )}
                      </div>
                    </div>

                    {car?.provider && (
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-white/60">
                        <span className="truncate">Chauffeur: <strong className="text-white">{car.provider.company_name}</strong></span>
                        {car.provider.company_phone && (
                          <a
                            href={`tel:${car.provider.company_phone}`}
                            className="text-[#e7bd78] hover:underline shrink-0 font-medium"
                          >
                            Call Chauffeur
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Bar: Amount, Payment Method & Transaction ID */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-white/10">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <div>
                      <span className="text-[10px] uppercase text-white/40 block">Total Fare</span>
                      <span className="text-lg font-bold text-[#e7bd78]">
                        {formatPrice(item.total_amount)}
                      </span>
                    </div>

                    <div className="border-l border-white/10 pl-3">
                      <span className="text-[10px] uppercase text-white/40 block">Payment Method</span>
                      <span className="text-xs font-semibold text-white/80 capitalize flex items-center gap-1 mt-0.5">
                        <CreditCard size={12} className="text-[#e7bd78]" />
                        {item.payment_method || "Stripe"}
                      </span>
                    </div>

                    {Boolean(item.transaction_id) && (
                      <div className="border-l border-white/10 pl-3 hidden md:block">
                        <span className="text-[10px] uppercase text-white/40 block">Transaction Ref</span>
                        <span className="text-[10px] font-mono text-white/60">
                          {String(item.transaction_id)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-white/40 sm:text-right">
                    Booked on {formatDate(item.created_at)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
