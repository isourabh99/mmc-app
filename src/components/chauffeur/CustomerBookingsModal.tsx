"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  ShieldCheck,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  Car,
  ExternalLink,
  ChevronRight,
  Phone,
  Mail,
  AlertCircle,
  Tag,
} from "lucide-react";
import {
  getCustomerBookings,
  type CustomerBookingItem,
} from "@/lib/service/chauffeur.api";

interface CustomerBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBookingNew?: () => void;
}

export const CustomerBookingsModal: React.FC<CustomerBookingsModalProps> = ({
  isOpen,
  onClose,
  onOpenBookingNew,
}) => {
  const [bookings, setBookings] = useState<CustomerBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch bookings from backend
  const fetchBookings = useCallback(async (statusFilter: string = "all") => {
    try {
      setLoading(true);
      setError("");
      const data = await getCustomerBookings({
        limit: 20,
        offset: 1,
        booking_status: statusFilter === "all" ? "all" : statusFilter,
        service_type: "all",
        booking_type: "car",
      });
      setBookings(data);
    } catch (err: any) {
      console.error("Error fetching bookings:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to load your reservations. Please check your login session."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchBookings(activeTab);
    }
  }, [isOpen, activeTab, fetchBookings]);

  // Copy booking ID helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatPrice = (price: string | number | null | undefined) => {
    if (!price) return "£0.00";
    const num = typeof price === "number" ? price : parseFloat(price);
    if (isNaN(num)) return String(price);
    return `£${num.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  // Filtered list
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "all") return true;
    return (
      b.booking_status?.toLowerCase() === activeTab.toLowerCase() ||
      (activeTab === "pending" && (b.booking_status === "pending" || b.payment_status === "pending"))
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[#d9a85f]/40 bg-[#14100c] text-white shadow-2xl shadow-black/90">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#18130e] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d9a85f]/40 bg-[#221810] text-[#e7bd78]">
              <Calendar size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white sm:text-lg">My Reservations</h3>
                <span className="rounded-full border border-[#d9a85f]/40 bg-[#d9a85f]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#e7bd78]">
                  {bookings.length} {bookings.length === 1 ? "Trip" : "Trips"}
                </span>
              </div>
              <p className="text-xs text-white/50">Manage your chauffeur bookings and live trip itineraries</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchBookings(activeTab)}
              disabled={loading}
              title="Refresh Bookings"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#33271d] bg-[#1a1410] text-white/70 transition hover:border-[#d9a85f]/50 hover:text-white disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin text-[#e7bd78]" : ""} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#33271d] bg-[#1a1410] text-white/70 transition hover:border-[#d9a85f]/50 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Filter Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-white/10 bg-[#120e0b] px-5 py-2.5 overflow-x-auto no-scrollbar">
          {[
            { id: "all", label: "All Bookings" },
            { id: "pending", label: "Pending / Unpaid" },
            { id: "accepted", label: "Confirmed" },
            { id: "completed", label: "Completed" },
            { id: "canceled", label: "Canceled" },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                  isSelected
                    ? "bg-gradient-to-r from-[#f2cb87] to-[#d09a50] text-[#140e0a] shadow-sm"
                    : "text-white/60 hover:bg-[#1e1712] hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar">
          
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <Loader2 size={32} className="animate-spin text-[#e7bd78]" />
              <p className="text-xs text-white/60">Fetching your chauffeur reservations...</p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="rounded-2xl border border-red-500/40 bg-red-950/20 p-5 text-center space-y-3">
              <AlertCircle size={28} className="mx-auto text-red-400" />
              <p className="text-xs text-red-300">{error}</p>
              <button
                type="button"
                onClick={() => fetchBookings(activeTab)}
                className="rounded-xl border border-red-500/40 bg-red-900/30 px-4 py-2 text-xs font-semibold text-white hover:bg-red-900/50"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredBookings.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#33271d] bg-[#1a1410] text-[#e7bd78]">
                <Car size={32} />
              </div>
              <h4 className="text-base font-bold text-white">No Reservations Found</h4>
              <p className="max-w-xs text-xs text-white/50">
                You haven&apos;t booked any chauffeur rides under this filter yet.
              </p>
              {onOpenBookingNew && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenBookingNew();
                  }}
                  className="mt-2 rounded-xl bg-gradient-to-r from-[#f2cb87] to-[#d09a50] px-5 py-2.5 text-xs font-bold text-[#140e0a] shadow-md hover:brightness-105"
                >
                  Book a Chauffeur Now
                </button>
              )}
            </div>
          )}

          {/* Bookings List */}
          {!loading &&
            !error &&
            filteredBookings.map((item) => {
              const car = item.car;
              const isPaid = item.is_paid === 1 || item.payment_status === "paid";
              const isPending = item.booking_status === "pending";
              const isCompleted = item.booking_status === "completed";

              return (
                <div
                  key={item.id || item.booking_id}
                  className="rounded-2xl border border-[#33271d] bg-[#17120e] p-4 sm:p-5 transition hover:border-[#d9a85f]/50 space-y-4 shadow-lg shadow-black/40"
                >
                  {/* Top Header: Car Info & Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border border-[#3a2d21] bg-black">
                        <img
                          src={
                            car?.image_full_paths?.[0] ||
                            car?.images?.[0] ||
                            "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80"
                          }
                          alt={car?.brand || "Chauffeur Car"}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">
                            {car?.brand || "Luxury Chauffeur"} {car?.model || ""}
                          </h4>
                          {car?.registration_number && (
                            <span className="rounded bg-[#241c15] px-1.5 py-0.5 font-mono text-[9px] text-[#e7bd78] border border-[#3a2d21]">
                              {car.registration_number}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-[11px] text-white/50 mt-0.5">
                          <span>Ref:</span>
                          <span className="font-mono text-white/80">{item.booking_id}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.booking_id)}
                            className="text-white/40 hover:text-white transition"
                            title="Copy Booking Reference"
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

                    {/* Status Badges */}
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
                        {isPaid ? "Paid" : "Payment Pending"}
                      </span>
                    </div>
                  </div>

                  {/* Route & Schedule Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Itinerary */}
                    <div className="rounded-xl border border-[#2d2218] bg-[#110e0b] p-3 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#e7bd78] flex items-center gap-1">
                        <MapPin size={12} />
                        Route Details
                      </span>

                      <div className="space-y-1.5">
                        <div className="flex items-start gap-2">
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#10b981]" />
                          <div className="min-w-0">
                            <span className="text-[10px] text-white/40 block uppercase">Pickup</span>
                            <span className="text-white font-medium break-words leading-tight block">
                              {item.pickup_location || "Not specified"}
                            </span>
                            {item.pickup_coordinates && (
                              <span className="text-[9px] text-[#10b981] font-mono">
                                {Number(item.pickup_coordinates.latitude).toFixed(4)}, {Number(item.pickup_coordinates.longitude).toFixed(4)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#ef4444]" />
                          <div className="min-w-0">
                            <span className="text-[10px] text-white/40 block uppercase">Destination</span>
                            <span className="text-white font-medium break-words leading-tight block">
                              {item.drop_location || "Not specified"}
                            </span>
                            {item.drop_coordinates && (
                              <span className="text-[9px] text-[#ef4444] font-mono">
                                {Number(item.drop_coordinates.latitude).toFixed(4)}, {Number(item.drop_coordinates.longitude).toFixed(4)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Schedule & Timing */}
                    <div className="rounded-xl border border-[#2d2218] bg-[#110e0b] p-3 space-y-2 flex flex-col justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#e7bd78] flex items-center gap-1">
                        <Calendar size={12} />
                        Dates & Timing
                      </span>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
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
                          <span className="text-white/40 text-[10px] block">Timing</span>
                          <span className="font-semibold text-white flex items-center gap-1">
                            <Clock size={10} className="text-[#10b981]" />
                            {item.pickup_time || "10:00 AM"}
                          </span>
                          {item.drop_time && (
                            <span className="text-[10px] text-white/60 flex items-center gap-1">
                              <Clock size={10} className="text-[#ef4444]" />
                              {item.drop_time}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Provider Info if available */}
                      {car?.provider && (
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-white/60">
                          <span className="truncate">Driver / Provider: <strong className="text-white">{car.provider.company_name}</strong></span>
                          {car.provider.company_phone && (
                            <a
                              href={`tel:${car.provider.company_phone}`}
                              className="text-[#e7bd78] hover:underline shrink-0"
                            >
                              Call
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Bar: Amount, Payment Method & Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-white/5">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-[10px] uppercase text-white/40 block">Total Amount</span>
                        <span className="text-lg font-bold text-[#e7bd78]">
                          {formatPrice(item.total_amount)}
                        </span>
                      </div>

                      <div className="border-l border-white/10 pl-3">
                        <span className="text-[10px] uppercase text-white/40 block">Payment Method</span>
                        <span className="text-xs font-medium text-white/80 capitalize flex items-center gap-1">
                          <CreditCard size={12} className="text-[#e7bd78]" />
                          {item.payment_method || "Stripe"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/40">
                        Booked on {formatDate(item.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
