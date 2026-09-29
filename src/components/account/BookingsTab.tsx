"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
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
  Search,
  Filter,
  X,
  Disc,
  Wrench,
  Sparkles,
  Phone,
  Truck,
  SlidersHorizontal,
  ChevronDown,
  Navigation,
  Eye,
  RotateCcw,
} from "lucide-react";
import apiClient from "@/lib/http/apiClient";
import { triggerDevicePushNotification } from "@/lib/firebase";
import {
  UnifiedBookingItem,
  BookingServiceType,
  getServiceCategoryLabel,
  extractReadableAddress,
  cleanReadableText,
  saveBookingMeta,
} from "@/lib/service/bookings.api";

interface BookingsTabProps {
  bookings: UnifiedBookingItem[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
  initialBookingId?: string | null;
  initialStatus?: string | null;
}

export const BookingsTab: React.FC<BookingsTabProps> = ({
  bookings,
  loading,
  error,
  onRefresh,
  initialBookingId,
  initialStatus,
}) => {
  // Filters State
  const [selectedServiceType, setSelectedServiceType] = useState<BookingServiceType>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount_desc" | "amount_asc">("newest");

  // Interaction State
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedBookingForModal, setSelectedBookingForModal] = useState<UnifiedBookingItem | null>(null);
  const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null);
  const [bookingForPayment, setBookingForPayment] = useState<UnifiedBookingItem | null>(null);
  const [payingRemaining, setPayingRemaining] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [pendingBookingIdToOpen, setPendingBookingIdToOpen] = useState<string | null>(
    initialBookingId ? String(initialBookingId) : null
  );

  // Sync initialStatus when provided (e.g. from notification clicks or url query)
  useEffect(() => {
    if (initialStatus) {
      const clean = String(initialStatus).toLowerCase();
      if (["pending", "ongoing", "completed", "canceled", "all"].includes(clean)) {
        setSelectedStatus(clean);
      }
    }
  }, [initialStatus]);

  // Check if returning from a successful payment callback or with bookingId query
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const isSuccess = urlParams.get("payment_success") === "true";
      const paidBookingId = urlParams.get("bookingId") || urlParams.get("booking_id");
      const targetBookingId = paidBookingId || urlParams.get("id");

      if (targetBookingId) {
        setPendingBookingIdToOpen(String(targetBookingId));
      }

      if (isSuccess && paidBookingId) {
        saveBookingMeta(paidBookingId, { isPaid: true, paymentStatus: "paid" });
        onRefresh();
        try {
          triggerDevicePushNotification(
            "Payment Successful! 🎉",
            `Payment for booking #${paidBookingId} has been confirmed.`,
            window.location.href
          );
        } catch {}
      }
    }
  }, [onRefresh]);

  // Robust function to find and open any booking in the modal
  const openBookingById = useCallback(
    (rawTargetId: string | number, preferredStatus?: string) => {
      if (!rawTargetId || bookings.length === 0) return;
      const cleanId = String(rawTargetId).trim().toLowerCase().replace(/^#/, "");

      const targetBooking = bookings.find((b) => {
        const bId = String(b.id || "").toLowerCase().replace(/^#/, "");
        const rawId = String(b.rawId || "").toLowerCase().replace(/^#/, "");
        const readableId = String(b.readableId || "").toLowerCase().replace(/^#/, "");
        const bBookingId = String(b.raw?.booking_id || b.raw?.id || "").toLowerCase().replace(/^#/, "");
        const bReadable = String(b.raw?.readable_id || "").toLowerCase().replace(/^#/, "");

        return (
          bId === cleanId ||
          rawId === cleanId ||
          readableId === cleanId ||
          bBookingId === cleanId ||
          bReadable === cleanId ||
          (cleanId.length >= 4 && (
            bId.includes(cleanId) ||
            rawId.includes(cleanId) ||
            readableId.includes(cleanId) ||
            bBookingId.includes(cleanId) ||
            cleanId.includes(bId) ||
            cleanId.includes(rawId) ||
            cleanId.includes(readableId)
          ))
        );
      });

      if (targetBooking) {
        setSelectedServiceType("all");
        if (preferredStatus && ["pending", "ongoing", "completed", "canceled"].includes(preferredStatus)) {
          setSelectedStatus(preferredStatus);
        } else if (targetBooking.status) {
          setSelectedStatus(targetBooking.status);
        }
        setSelectedBookingForModal(targetBooking);
        setHighlightedBookingId(targetBooking.id);
        setPendingBookingIdToOpen(null);

        setTimeout(() => {
          const el = document.getElementById(`booking-card-${targetBooking.id}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 350);
      }
    },
    [bookings]
  );

  // Listen for global custom event to open booking detail instantly from notifications
  useEffect(() => {
    const handleOpenEvent = (e: any) => {
      const targetId = e?.detail?.bookingId || e?.detail?.readableId;
      if (targetId) {
        setPendingBookingIdToOpen(String(targetId));
        openBookingById(targetId, e?.detail?.status);
      }
    };
    const handleUpdateEvent = () => {
      onRefresh();
    };
    window.addEventListener("mmc-open-booking-modal", handleOpenEvent);
    window.addEventListener("mmc-bookings-updated", handleUpdateEvent);
    return () => {
      window.removeEventListener("mmc-open-booking-modal", handleOpenEvent);
      window.removeEventListener("mmc-bookings-updated", handleUpdateEvent);
    };
  }, [openBookingById, onRefresh]);

  // When pending booking ID exists and bookings load/update, auto open modal
  useEffect(() => {
    if (pendingBookingIdToOpen && bookings.length > 0) {
      openBookingById(pendingBookingIdToOpen, initialStatus || undefined);
    }
  }, [pendingBookingIdToOpen, bookings, initialStatus, openBookingById]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatPrice = (price: number | string | null | undefined) => {
    if (price === null || price === undefined || price === "") return "£0.00";
    const num = typeof price === "number" ? price : parseFloat(String(price));
    if (isNaN(num)) return `£${price}`;
    return `£${num.toLocaleString("en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Service Counts for badges
  const serviceCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: bookings.length,
      chauffeur: 0,
      tyre: 0,
      emergency: 0,
      valet: 0,
      bodywork: 0,
      modification: 0,
      alloy: 0,
    };
    bookings.forEach((b) => {
      if (counts[b.serviceType] !== undefined) {
        counts[b.serviceType]++;
      }
    });
    return counts;
  }, [bookings]);

  // Filtered and Sorted Bookings
  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        // 1. Service Type Filter
        if (selectedServiceType !== "all" && b.serviceType !== selectedServiceType) {
          return false;
        }

        // 2. Status Filter
        if (selectedStatus !== "all") {
          if (selectedStatus === "pending" && b.status !== "pending") return false;
          if (selectedStatus === "accepted" && b.status !== "accepted") return false;
          if (selectedStatus === "ongoing" && b.status !== "ongoing") return false;
          if (selectedStatus === "completed" && b.status !== "completed") return false;
          if (selectedStatus === "canceled" && b.status !== "canceled") return false;
        }

        // 3. Payment Filter
        if (selectedPaymentStatus === "paid" && !b.isPaid) return false;
        if (selectedPaymentStatus === "pending" && b.isPaid) return false;

        // 4. Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matches =
            b.id.toLowerCase().includes(q) ||
            b.serviceTitle.toLowerCase().includes(q) ||
            (b.serviceSubtitle && b.serviceSubtitle.toLowerCase().includes(q)) ||
            (b.vehicleReg && b.vehicleReg.toLowerCase().includes(q)) ||
            (b.vehicleModel && b.vehicleModel.toLowerCase().includes(q)) ||
            (b.pickupLocation && b.pickupLocation.toLowerCase().includes(q)) ||
            (b.destinationLocation && b.destinationLocation.toLowerCase().includes(q)) ||
            (b.serviceAddress && b.serviceAddress.toLowerCase().includes(q)) ||
            (b.providerName && b.providerName.toLowerCase().includes(q));
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt || b.scheduleDate).getTime() - new Date(a.createdAt || a.scheduleDate).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt || a.scheduleDate).getTime() - new Date(b.createdAt || b.scheduleDate).getTime();
        }
        if (sortBy === "amount_desc") {
          return b.totalAmount - a.totalAmount;
        }
        if (sortBy === "amount_asc") {
          return a.totalAmount - b.totalAmount;
        }
        return 0;
      });
  }, [bookings, selectedServiceType, selectedStatus, selectedPaymentStatus, searchQuery, sortBy]);

  // Metrics
  const metrics = useMemo(() => {
    const totalSpent = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const completedCount = bookings.filter((b) => b.status === "completed").length;
    const activeCount = bookings.filter((b) => b.status === "pending" || b.status === "accepted" || b.status === "ongoing").length;
    return {
      totalSpent,
      completedCount,
      activeCount,
    };
  }, [bookings]);

  // Helper for Service Category Icon
  const getServiceIcon = (type: BookingServiceType) => {
    switch (type) {
      case "chauffeur":
        return <Car className="w-4 h-4 text-[#FAD293]" />;
      case "tyre":
        return <Disc className="w-4 h-4 text-[#FAD293]" />;
      case "emergency":
        return <Truck className="w-4 h-4 text-red-400" />;
      case "valet":
        return <Sparkles className="w-4 h-4 text-sky-400" />;
      case "bodywork":
        return <Wrench className="w-4 h-4 text-amber-400" />;
      case "modification":
      case "alloy":
        return <SlidersHorizontal className="w-4 h-4 text-purple-400" />;
      default:
        return <Car className="w-4 h-4 text-[#FAD293]" />;
    }
  };

  const getServiceColor = (type: BookingServiceType) => {
    switch (type) {
      case "chauffeur":
        return "bg-amber-500/10 text-[#FAD293] border-amber-500/30";
      case "tyre":
        return "bg-yellow-500/10 text-yellow-300 border-yellow-500/30";
      case "emergency":
        return "bg-red-500/10 text-red-400 border-red-500/30";
      case "valet":
        return "bg-sky-500/10 text-sky-400 border-sky-500/30";
      case "bodywork":
        return "bg-orange-500/10 text-orange-400 border-orange-500/30";
      case "modification":
      case "alloy":
        return "bg-purple-500/10 text-purple-300 border-purple-500/30";
      default:
        return "bg-white/10 text-white border-white/20";
    }
  };

  return (
    <div className="rounded-3xl border border-[#33271d] bg-[#14100c] p-4 sm:p-7 shadow-2xl space-y-6">
      {/* ========================================================================= */}
      {/* 1. HEADER & ACTIONS                                                       */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              All My Bookings & Reservations
            </h2>
            <span className="rounded-full border border-[#FAD293]/40 bg-[#FAD293]/10 px-3 py-0.5 text-xs font-black text-[#FAD293]">
              {bookings.length} {bookings.length === 1 ? "Booking" : "Bookings"}
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Real-time status across Chauffeur, Tyre Fitting, Roadside Assistance, and Valet services.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/services"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#f2cb87] to-[#d09a50] px-3.5 py-2 text-xs font-black text-black hover:brightness-105 transition shadow-md"
          >
            <span>+ Book New Service</span>
          </Link>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-[#33271d] bg-[#1a1410] px-3.5 py-2 text-xs font-semibold text-white/80 transition hover:border-[#FAD293]/50 hover:text-white disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              size={13}
              className={loading ? "animate-spin text-[#FAD293]" : ""}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUMMARY METRICS CARDS                                                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Bookings</span>
          <span className="text-xl font-black text-white block">{bookings.length}</span>
          <span className="text-[9px] text-zinc-500">Across entire account</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">In Progress</span>
          <span className="text-xl font-black text-[#FAD293] block">{metrics.activeCount}</span>
          <span className="text-[9px] text-amber-500/80">Pending & active trips</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Completed</span>
          <span className="text-xl font-black text-emerald-400 block">{metrics.completedCount}</span>
          <span className="text-[9px] text-emerald-500/80">Successfully fulfilled</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Invoiced</span>
          <span className="text-xl font-black text-[#FAD293] block">{formatPrice(metrics.totalSpent)}</span>
          <span className="text-[9px] text-zinc-500">Gross reservation fare</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SEARCH & STATUS FILTERS TOOLBAR                                         */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-2xl bg-[#17120e] border border-white/10">
        {/* Status, Search and Sort Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box (6 Cols) */}
          <div className="md:col-span-6 relative flex items-center bg-black/60 border border-zinc-700 focus-within:border-[#FAD293] rounded-xl px-3 py-2 text-xs">
            <Search size={14} className="text-zinc-400 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Booking ID, Reg Number, Car Model, Location..."
              className="w-full bg-transparent text-xs text-white placeholder:text-zinc-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Status Select (3 Cols) */}
          <div className="md:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-zinc-700 focus:border-[#FAD293] text-white text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-zinc-900">All Statuses</option>
              <option value="pending" className="bg-zinc-900">Pending / Requested</option>
              <option value="accepted" className="bg-zinc-900">Accepted / Confirmed</option>
              <option value="ongoing" className="bg-zinc-900">Ongoing / Dispatched</option>
              <option value="completed" className="bg-zinc-900">Completed</option>
              <option value="canceled" className="bg-zinc-900">Canceled</option>
            </select>
          </div>

          {/* Sort Select (3 Cols) */}
          <div className="md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-zinc-700 focus:border-[#FAD293] text-white text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-zinc-900">Sort: Newest First</option>
              <option value="oldest" className="bg-zinc-900">Sort: Oldest First</option>
              <option value="amount_desc" className="bg-zinc-900">Sort: Fare (High → Low)</option>
              <option value="amount_asc" className="bg-zinc-900">Sort: Fare (Low → High)</option>
            </select>
          </div>
        </div>

        {/* Secondary Payment Filter & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-400 font-bold uppercase mr-1">Payment:</span>
            {[
              { id: "all", label: "All" },
              { id: "paid", label: "✓ Paid Only" },
              { id: "pending", label: "⏳ Pending Payment" },
            ].map((pf) => (
              <button
                key={pf.id}
                type="button"
                onClick={() => setSelectedPaymentStatus(pf.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  selectedPaymentStatus === pf.id
                    ? "bg-[#FAD293] text-black font-bold"
                    : "bg-black/40 text-zinc-400 hover:text-white border border-white/5"
                }`}
              >
                {pf.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-zinc-400 font-medium">
            Showing <strong className="text-white">{filteredBookings.length}</strong> of {bookings.length} results
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. LOADING STATE                                                          */}
      {/* ========================================================================= */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <Loader2 size={36} className="animate-spin text-[#FAD293]" />
          <p className="text-xs text-white/70 font-medium">Synchronizing bookings across all services...</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ERROR STATE                                                            */}
      {/* ========================================================================= */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-950/20 p-6 text-center space-y-3">
          <AlertCircle size={32} className="mx-auto text-red-400" />
          <p className="text-xs text-red-300">{error}</p>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-xl border border-red-500/40 bg-red-900/30 px-4 py-2 text-xs font-semibold text-white hover:bg-red-900/50 transition cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. EMPTY STATE                                                            */}
      {/* ========================================================================= */}
      {!loading && !error && filteredBookings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 rounded-3xl border border-white/5 bg-black/40 p-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#33271d] bg-[#1a1410] text-[#FAD293]">
            <Search size={28} />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">No Bookings Found</h4>
            <p className="max-w-md text-xs text-zinc-400 mt-1">
              {searchQuery || selectedServiceType !== "all" || selectedStatus !== "all" || selectedPaymentStatus !== "all"
                ? "No reservations match your active filters. Try resetting the filters."
                : "You haven't placed any bookings yet. Book luxury chauffeur, tyres, emergency assistance, or valeting today."}
            </p>
          </div>

          {(searchQuery || selectedServiceType !== "all" || selectedStatus !== "all" || selectedPaymentStatus !== "all") ? (
            <button
              type="button"
              onClick={() => {
                setSelectedServiceType("all");
                setSelectedStatus("all");
                setSelectedPaymentStatus("all");
                setSearchQuery("");
              }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Clear All Filters</span>
            </button>
          ) : (
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#f2cb87] to-[#d09a50] px-5 py-2.5 text-xs font-black text-black shadow-md transition hover:brightness-105"
            >
              <span>Explore All MMC Services</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. UNIFIED BOOKINGS LIST                                                  */}
      {/* ========================================================================= */}
      {!loading && !error && filteredBookings.length > 0 && (
        <div className="space-y-4">
          {filteredBookings.map((item) => {
            const isCompleted = item.status === "completed";
            const isPending = item.status === "pending";
            const isOngoing = item.status === "ongoing";
            const isCanceled = item.status === "canceled";

            // Payment completion and remaining balance calculation
            const isFullyPaid = item.isPaid || item.raw?.is_paid === 1 || item.raw?.payment_status === "paid";
            const isOngoingOrPending = isOngoing || item.status === "accepted" || isPending;
            const isPartial =
              item.raw?.is_partial === 1 ||
              item.raw?.is_partial === "1" ||
              (Array.isArray(item.raw?.partial_payments) && item.raw.partial_payments.length > 0);
            const remainingBalance = isPartial
              ? Number(item.raw?.additional_charge ?? item.raw?.due_amount ?? (item.totalAmount * 0.75))
              : Number(item.totalAmount);

            return (
              <div
                key={item.id}
                id={`booking-card-${item.id}`}
                className={`rounded-3xl border p-4 sm:p-5 space-y-4 shadow-xl transition-all duration-300 ${
                  highlightedBookingId === item.id
                    ? "border-[#FAD293] bg-[#22170d] ring-2 ring-[#FAD293]/70 shadow-[0_0_35px_rgba(250,210,147,0.35)]"
                    : "border-[#33271d] bg-[#17120e] hover:border-[#FAD293]/60"
                }`}
              >
                {/* Top Row: Service Category Badge, Title, Status & Paid Badges */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-white/10 pb-3.5">
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* Thumbnail / Icon */}
                    <div className="relative h-14 w-16 sm:w-20 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black flex items-center justify-center">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.serviceTitle}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="p-3">
                          {getServiceIcon(item.serviceType)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Service Category Tag */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${getServiceColor(item.serviceType)}`}>
                          {getServiceIcon(item.serviceType)}
                          <span>{item.serviceCategoryName}</span>
                        </span>
                        {highlightedBookingId === item.id && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#f2cb87] to-[#d09a50] text-black font-extrabold text-[10px] uppercase tracking-wider animate-pulse shadow-md">
                            Just Placed
                          </span>
                        )}
                        {item.vehicleReg && (
                          <span className="rounded bg-[#251b13] px-2 py-0.5 font-mono font-bold text-[10px] text-[#FAD293] border border-[#3a2d21]">
                            {item.vehicleReg}
                          </span>
                        )}
                        {item.vehicleModel && (
                          <span className="rounded bg-white/5 px-2 py-0.5 font-semibold text-[10px] text-zinc-300 border border-white/10">
                            {item.vehicleModel}
                          </span>
                        )}
                      </div>

                      {/* Main Service Title */}
                      <h3 className="text-base font-bold text-white tracking-tight mt-1 truncate">
                        {item.serviceTitle}
                      </h3>

                      {/* Subtitle / Booking ID */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 mt-0.5">
                        <div className="flex items-center gap-1.5">
                          <span>Ref:</span>
                          <span className="font-mono text-zinc-300 font-bold">{item.id}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.id)}
                            className="text-zinc-500 hover:text-white transition p-0.5 cursor-pointer"
                            title="Copy ID"
                          >
                            {copiedId === item.id ? (
                              <Check size={12} className="text-emerald-400" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>

                        {item.serviceSubtitle && (
                          <span className="text-zinc-500 truncate max-w-xs hidden sm:inline">
                            • {cleanReadableText(item.serviceSubtitle)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status & Payment Badges */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                        isCompleted
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : isOngoing
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse"
                          : isPending
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : isCanceled
                          ? "bg-red-500/20 text-red-300 border border-red-500/40"
                          : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                      }`}
                    >
                      {item.statusDisplay}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        item.isPaid
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      }`}
                    >
                      {item.isPaid ? "✓ Paid" : "Payment Pending"}
                    </span>
                  </div>
                </div>

                {/* Content Grid: Route / Location + Schedule & Contacts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Location / Route Details */}
                  <div className="rounded-2xl border border-white/5 bg-[#110e0b] p-3.5 space-y-2.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#FAD293] flex items-center gap-1.5">
                      <MapPin size={12} />
                      Location & Dispatch Address
                    </span>

                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] text-zinc-400 block uppercase font-bold">
                            {item.destinationLocation ? "Pickup Location" : "Service Location"}
                          </span>
                          <span className="text-white font-medium break-words block">
                            {extractReadableAddress(item.pickupLocation || item.serviceAddress) || "Address on record"}
                          </span>
                          {item.coordinates?.latitude && (
                            <span className="text-[10px] text-emerald-400 font-mono block mt-0.5">
                              📍 Coordinates: {Number(item.coordinates.latitude).toFixed(4)}, {Number(item.coordinates.longitude).toFixed(4)}
                            </span>
                          )}
                        </div>
                      </div>

                      {item.destinationLocation && (
                        <div className="flex items-start gap-2 pt-1 border-t border-white/5">
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-400" />
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] text-zinc-400 block uppercase font-bold">Destination</span>
                            <span className="text-white font-medium break-words block">
                              {extractReadableAddress(item.destinationLocation)}
                            </span>
                            {item.destinationCoordinates?.latitude && (
                              <span className="text-[10px] text-red-400 font-mono block mt-0.5">
                                📍 Coordinates: {Number(item.destinationCoordinates.latitude).toFixed(4)}, {Number(item.destinationCoordinates.longitude).toFixed(4)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Schedule, Timing & Provider Info */}
                  <div className="rounded-2xl border border-white/5 bg-[#110e0b] p-3.5 space-y-2.5 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#FAD293] flex items-center gap-1.5">
                        <Calendar size={12} />
                        Schedule & Service Timing
                      </span>

                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <span className="text-zinc-400 text-[10px] block font-bold">Service Date</span>
                          <span className="font-semibold text-white">
                            {formatDate(item.scheduleDate)}
                          </span>
                          {item.scheduleEndDate && item.scheduleEndDate !== item.scheduleDate && (
                            <span className="text-[10px] text-zinc-400 block">
                              to {formatDate(item.scheduleEndDate)}
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-zinc-400 text-[10px] block font-bold">Time Window</span>
                          <span className="font-semibold text-white flex items-center gap-1">
                            <Clock size={11} className="text-emerald-400" />
                            {item.scheduleTime || "As Scheduled"}
                          </span>
                          {item.scheduleEndTime && (
                            <span className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                              <Clock size={11} className="text-red-400" />
                              {item.scheduleEndTime}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Provider / Serviceman footer */}
                    {(item.providerName || item.servicemanName) && (
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
                        <span className="truncate">
                          Assigned: <strong className="text-white">{item.providerName || item.servicemanName}</strong>
                        </span>
                        {(item.providerPhone || item.servicemanPhone) && (
                          <a
                            href={`tel:${item.providerPhone || item.servicemanPhone}`}
                            className="text-[#FAD293] hover:underline shrink-0 font-bold flex items-center gap-1"
                          >
                            <Phone size={10} />
                            <span>Call</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Bar: Total Fare, Payment Method & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <div>
                      <span className="text-[10px] uppercase text-zinc-400 font-bold block">Total Amount</span>
                      <span className="text-xl font-black text-[#FAD293]">
                        {formatPrice(item.totalAmount)}
                      </span>
                    </div>

                    <div className="border-l border-white/10 pl-4">
                      <span className="text-[10px] uppercase text-zinc-400 font-bold block">Payment Method</span>
                      <span className="text-xs font-semibold text-zinc-300 capitalize flex items-center gap-1.5 mt-0.5">
                        <CreditCard size={13} className="text-[#FAD293]" />
                        {item.paymentMethod}
                      </span>
                    </div>

                    <div className="border-l border-white/10 pl-4 hidden lg:block">
                      <span className="text-[10px] uppercase text-zinc-400 font-bold block">Booked On</span>
                      <span className="text-xs text-zinc-300">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                    {/* Pay Now Button for In-Progress / Pending bookings with remaining unpaid balance */}
                    {!isFullyPaid && isOngoingOrPending && (
                      <button
                        type="button"
                        onClick={() => setBookingForPayment(item)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#F6D089] via-[#E8AF66] to-[#D5A054] hover:brightness-110 text-zinc-950 font-black text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow-md shadow-[#D5A054]/20 cursor-pointer active:scale-95"
                      >
                        <CreditCard size={13} className="text-zinc-950" />
                        <span>Pay Remaining (£{remainingBalance.toFixed(2)})</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedBookingForModal(item)}
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye size={13} />
                      <span>View Details</span>
                    </button>

                    <Link
                      href="/services"
                      className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-bold transition flex items-center gap-1 border border-white/10"
                    >
                      <span>Rebook</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. COMPREHENSIVE BOOKING DETAILS MODAL                                    */}
      {/* ========================================================================= */}
      {selectedBookingForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#14110e] border border-white/20 p-6 sm:p-7 space-y-5 shadow-2xl text-left my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedBookingForModal(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${getServiceColor(selectedBookingForModal.serviceType)}`}>
                  {getServiceIcon(selectedBookingForModal.serviceType)}
                  <span>{selectedBookingForModal.serviceCategoryName}</span>
                </span>
                <span className="text-xs font-mono text-zinc-400 font-bold">
                  ID: {selectedBookingForModal.id}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                {selectedBookingForModal.serviceTitle}
              </h3>
              {selectedBookingForModal.serviceSubtitle && (
                <p className="text-xs text-zinc-400 mt-0.5">
                  {selectedBookingForModal.serviceSubtitle}
                </p>
              )}
            </div>

            {/* Status Timeline */}
            <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Booking Status</span>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#FAD293] animate-pulse" />
                  {selectedBookingForModal.statusDisplay}
                </span>
                <span className="text-xs font-bold text-[#FAD293]">
                  {selectedBookingForModal.paymentStatus} ({selectedBookingForModal.paymentMethod})
                </span>
              </div>
            </div>

            {/* Itinerary & Timing Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FAD293] flex items-center gap-1">
                  <MapPin size={12} />
                  Addresses
                </span>
                <div className="space-y-1">
                  <span className="text-zinc-400 text-[10px] block font-bold">Location:</span>
                  <p className="text-white font-medium">
                    {extractReadableAddress(selectedBookingForModal.pickupLocation || selectedBookingForModal.serviceAddress) || "Standard Service Location"}
                  </p>
                  {selectedBookingForModal.destinationLocation && (
                    <div className="pt-1 mt-1 border-t border-white/10">
                      <span className="text-zinc-400 text-[10px] block font-bold">Destination:</span>
                      <p className="text-white font-medium">
                        {extractReadableAddress(selectedBookingForModal.destinationLocation)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FAD293] flex items-center gap-1">
                  <Calendar size={12} />
                  Schedule & Dates
                </span>
                <div className="space-y-1">
                  <span className="text-zinc-400 text-[10px] block font-bold">Appointment:</span>
                  <p className="text-white font-medium">{selectedBookingForModal.fullScheduleDisplay || formatDate(selectedBookingForModal.scheduleDate)}</p>
                  <span className="text-zinc-400 text-[10px] block mt-1 font-bold">Booked Timestamp:</span>
                  <p className="text-zinc-300 font-mono text-[11px]">{formatDate(selectedBookingForModal.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Vehicle & Contacts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {selectedBookingForModal.vehicleReg && (
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Vehicle</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#FAD293] bg-[#251b13] px-2 py-0.5 rounded border border-[#3a2d21]">
                      {selectedBookingForModal.vehicleReg}
                    </span>
                    <span className="text-white font-medium">{selectedBookingForModal.vehicleModel}</span>
                  </div>
                </div>
              )}

              {(selectedBookingForModal.providerName || selectedBookingForModal.providerPhone) && (
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Assigned Provider</span>
                  <p className="text-white font-medium">{selectedBookingForModal.providerName || "MMC Certified Fleet"}</p>
                  {selectedBookingForModal.providerPhone && (
                    <a href={`tel:${selectedBookingForModal.providerPhone}`} className="text-[#FAD293] hover:underline block text-[11px] font-bold">
                      📞 {selectedBookingForModal.providerPhone}
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Total Fare & Dismiss */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Gross Amount</span>
                <span className="text-2xl font-black text-[#FAD293]">
                  {formatPrice(selectedBookingForModal.totalAmount)}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {!(
                  selectedBookingForModal.isPaid ||
                  selectedBookingForModal.raw?.is_paid === 1 ||
                  selectedBookingForModal.raw?.payment_status === "paid"
                ) &&
                  (selectedBookingForModal.status === "ongoing" ||
                    selectedBookingForModal.status === "accepted" ||
                    selectedBookingForModal.status === "pending") && (
                    <button
                      type="button"
                      onClick={() => setBookingForPayment(selectedBookingForModal)}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F6D089] via-[#E8AF66] to-[#D5A054] hover:brightness-110 text-zinc-950 font-black text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow-md shadow-[#D5A054]/20 cursor-pointer active:scale-95"
                    >
                      <CreditCard size={13} className="text-zinc-950" />
                      <span>
                        Pay Remaining (£
                        {(
                          selectedBookingForModal.raw?.is_partial === 1 ||
                          selectedBookingForModal.raw?.is_partial === "1"
                            ? selectedBookingForModal.totalAmount * 0.75
                            : selectedBookingForModal.totalAmount
                        ).toFixed(2)}
                        )
                      </span>
                    </button>
                  )}

                <button
                  type="button"
                  onClick={() => setSelectedBookingForModal(null)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. PAY REMAINING BALANCE MODAL                                            */}
      {/* ========================================================================= */}
      {bookingForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-[#141518] border border-zinc-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl animate-scale-up text-left">
            <button
              type="button"
              onClick={() => {
                setBookingForPayment(null);
                setPaymentSuccess(false);
              }}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700/80 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X size={16} />
            </button>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#FAD293] block">
                Outstanding Balance Payment
              </span>
              <h3 className="text-xl font-black text-white mt-1">
                {bookingForPayment.serviceTitle}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                Booking #{bookingForPayment.id} • {bookingForPayment.statusDisplay}
              </p>
            </div>

            {/* Price breakdown */}
            <div className="rounded-2xl border border-white/10 bg-black/50 p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Total Agreed Price:</span>
                <span className="font-bold text-white">£{bookingForPayment.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Advance Deposit (25% Paid):</span>
                <span className="font-semibold text-emerald-400">
                  -£{(bookingForPayment.totalAmount * 0.25).toFixed(2)}
                </span>
              </div>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between font-bold text-sm">
                <span className="text-[#FAD293]">Remaining Amount Due:</span>
                <span className="text-base font-extrabold text-[#FAD293]">
                  £{(bookingForPayment.totalAmount * 0.75).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment method selector */}
            <div className="p-4 rounded-2xl border border-[#D5A054]/40 bg-[#1C1A16] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAD293]/20 border border-[#FAD293]/40 flex items-center justify-center text-[#FAD293]">
                  <CreditCard size={18} />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Online Payment (Stripe)</span>
                  <span className="text-[11px] text-zinc-400">Debit / Credit Card, Apple Pay, Google Pay</span>
                </div>
              </div>
              <Check className="w-4 h-4 text-[#FAD293]" />
            </div>

            {paymentSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center space-y-1">
                <Check className="w-6 h-6 mx-auto stroke-[3]" />
                <p>Payment Received Successfully!</p>
                <p className="text-[11px] text-zinc-400 font-normal">Updating your booking records...</p>
              </div>
            ) : (
              <button
                type="button"
                disabled={payingRemaining}
                onClick={async () => {
                  setPayingRemaining(true);
                  try {
                    const bookingId = bookingForPayment.rawId || bookingForPayment.id;
                    const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
                    const userObj = userStr ? JSON.parse(userStr) : null;
                    const userId = userObj?.id || "";

                    const callbackUrl = `${window.location.origin}/account?tab=bookings&status=ongoing&bookingId=${bookingId}&payment_success=true`;

                    let redirectUrl = "";

                    // 1. Try calling Demandium customer payment API endpoint
                    try {
                      const res = await apiClient.post("/customer/booking/payment", {
                        booking_id: bookingId,
                        payment_method: "stripe",
                        payment_platform: "app",
                        callback: callbackUrl,
                      });

                      redirectUrl =
                        res.data?.content?.redirect_url ||
                        res.data?.content?.redirect_link ||
                        res.data?.content?.payment_url ||
                        res.data?.content?.url;
                    } catch (e: any) {
                      // Fallback to direct gateway URL
                    }

                    // 2. Direct Demandium Stripe checkout gateway link
                    if (!redirectUrl) {
                      redirectUrl = `https://mmcclub.co.uk/payment/stripe?booking_id=${encodeURIComponent(String(bookingId))}&user_id=${encodeURIComponent(String(userId))}&callback=${encodeURIComponent(callbackUrl)}`;
                    }

                    // Redirect to live Stripe payment portal
                    window.location.href = redirectUrl;
                  } catch (err: any) {
                    console.error("Payment initiation failed:", err);
                    setPayingRemaining(false);
                  }
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#F6D089] via-[#E8AF66] to-[#D5A054] hover:brightness-105 active:scale-[0.99] text-zinc-950 font-black text-xs sm:text-sm uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-xl shadow-[#D5A054]/20 cursor-pointer disabled:opacity-50"
              >
                {payingRemaining ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>Connecting to Stripe Gateway...</span>
                  </>
                ) : (
                  <>
                    <span>
                      Pay Remaining £{(bookingForPayment.totalAmount * 0.75).toFixed(2)} Now
                    </span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
