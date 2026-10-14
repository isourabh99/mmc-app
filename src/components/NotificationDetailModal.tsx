"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  X,
  Calendar,
  MapPin,
  Car,
  CreditCard,
  Sparkles,
  Disc,
  Siren,
  Wrench,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  CircleDot,
  UserCheck,
} from "lucide-react";
import { BookingNotification } from "@/lib/service/notifications.api";

interface NotificationDetailModalProps {
  notification: BookingNotification | null;
  onClose: () => void;
  onDismiss?: (id: string) => void;
  urlParamKey?: "id" | "notificationId";
}

export default function NotificationDetailModal({
  notification,
  onClose,
  onDismiss,
  urlParamKey = "id",
}: NotificationDetailModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close handler with URL cleanup
  const handleClose = useCallback(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has(urlParamKey)) {
        url.searchParams.delete(urlParamKey);
        const search = url.searchParams.toString();
        window.history.replaceState({}, "", url.pathname + (search ? `?${search}` : ""));
      }
    }
    onClose();
  }, [onClose, urlParamKey]);

  // Keep URL updated when modal opens with this notification
  useEffect(() => {
    if (notification && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const targetParamValue = String(notification.id || notification.bookingId);
      if (url.searchParams.get(urlParamKey) !== targetParamValue) {
        url.searchParams.set(urlParamKey, targetParamValue);
        const search = url.searchParams.toString();
        window.history.replaceState({}, "", url.pathname + (search ? `?${search}` : ""));
      }
    }
  }, [notification, urlParamKey]);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (notification) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [notification]);

  // Handle ESC key to close
  useEffect(() => {
    if (!notification) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [notification, handleClose]);

  if (!mounted || !notification) return null;

  const raw = notification.raw || {};
  const bookingRef = String(notification.readableId || notification.bookingId || raw.id || "N/A");

  const handleCopyId = () => {
    if (bookingRef && bookingRef !== "N/A") {
      navigator.clipboard.writeText(bookingRef);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenBooking = () => {
    handleClose();

    // 1. Quotation notifications -> navigate to appropriate Quotes Hub
    if (notification.category === "alloy" || notification.targetUrl?.includes("alloy-wheel")) {
      router.push(notification.targetUrl || "/services/alloy-wheel?view=quotes");
      return;
    }
    if (notification.targetUrl) {
      router.push(notification.targetUrl);
      return;
    }
    if (notification.category === "quote" || notification.bookingType === "quote") {
      const text = `${notification.title} ${notification.subtitle || ""} ${notification.description}`.toLowerCase();
      if (text.includes("alloy") || text.includes("wheel") || text.includes("rim")) {
        router.push("/services/alloy-wheel?view=quotes");
      } else if (text.includes("mod") || text.includes("tuning")) {
        router.push("/services/modification?view=quotes");
      } else {
        router.push("/services/bodywork?view=quotes");
      }
      return;
    }

    // 2. Booking notifications -> deep link to exact status tab and open booking detail
    const targetStatus =
      notification.status === "completed"
        ? "completed"
        : notification.status === "ongoing" || notification.status === "accepted"
        ? "ongoing"
        : notification.status === "canceled"
        ? "canceled"
        : "pending";

    const targetBookingId = notification.bookingId || notification.readableId;

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("mmc-open-booking-modal", {
          detail: {
            bookingId: targetBookingId,
            readableId: notification.readableId,
            status: targetStatus,
          },
        })
      );
    }

    router.push(`/account?tab=bookings&status=${targetStatus}&bookingId=${encodeURIComponent(String(targetBookingId))}`);
  };

  // Category Icon selector
  const getCategoryIcon = () => {
    switch (notification.category) {
      case "quote":
        return <Sparkles className="w-5 h-5 text-[#e0b777] animate-pulse" />;
      case "car_hire":
      case "chauffeur":
        return <Car className="w-5 h-5 text-[#FAD293]" />;
      case "tyre":
        return <Disc className="w-5 h-5 text-amber-400" />;
      case "emergency":
        return <Siren className="w-5 h-5 text-red-400 animate-pulse" />;
      case "mechanical":
        return <Wrench className="w-5 h-5 text-blue-400" />;
      case "bodywork":
      case "alloy":
        return <Sparkles className="w-5 h-5 text-[#e0b777]" />;
      default:
        return <CircleDot className="w-5 h-5 text-[#FAD293]" />;
    }
  };

  // Status Badge
  const getStatusBadge = () => {
    switch (notification.status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={13} /> Completed
          </span>
        );
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={13} /> Accepted
          </span>
        );
      case "ongoing":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FAD293]/15 text-[#FAD293] border border-[#FAD293]/30">
            <Clock size={13} className="animate-spin" /> In Progress
          </span>
        );
      case "canceled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
            <AlertCircle size={13} /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock size={13} /> Pending Confirmation
          </span>
        );
    }
  };

  // Location resolution
  const location =
    notification.serviceLocation ||
    raw.pickup_location ||
    raw.service_address ||
    raw.delivery_address ||
    raw.postcode ||
    "London, UK (Service Location)";

  const destination = raw.destination_location || null;
  const provider = raw.provider?.company_name || raw.provider_name || null;
  const vehicle =
    notification.vehicleInfo ||
    (raw.car_model ? `${raw.car_model} ${raw.car_registration_number ? `(${raw.car_registration_number})` : ""}` : null) ||
    raw.car_registration_number ||
    null;

  const notes = raw.notes || raw.damage_description || raw.special_conditions || notification.description || null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={handleClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="relative w-full max-w-xl bg-[#14110E] border border-[#FAD293]/35 rounded-3xl p-6 sm:p-7 space-y-5 shadow-[0_25px_70px_rgba(0,0,0,0.95)] my-auto text-left animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: "0 25px 70px rgba(0,0,0,0.95), 0 0 50px rgba(250,210,147,0.12)",
        }}
      >
        {/* Top Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition cursor-pointer"
          title="Close details (Esc)"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 pr-10">
          <div className="w-12 h-12 rounded-2xl bg-[#1C1713] border border-[#FAD293]/30 flex items-center justify-center shrink-0 shadow-lg text-[#FAD293]">
            {getCategoryIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {getStatusBadge()}
              <span className="text-[11px] text-white/50">{notification.timeAgo}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {notification.title}
            </h2>
            {notification.subtitle && (
              <p className="text-xs sm:text-sm text-[#FAD293] font-medium mt-0.5">
                {notification.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Reference Number Strip */}
        <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Booking Ref:
            </span>
            <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded">
              #{bookingRef}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyId}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-[11px] font-semibold transition cursor-pointer"
            title="Copy Reference"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy ID</span>
              </>
            )}
          </button>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Schedule */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FAD293] flex items-center gap-1.5">
              <Calendar size={13} />
              Schedule & Time
            </span>
            <p className="text-white font-medium">
              {notification.scheduleTime || "Scheduled Service"}
            </p>
            <p className="text-[10px] text-zinc-400">
              Notification created: {new Date(notification.createdAt).toLocaleString("en-GB")}
            </p>
          </div>

          {/* Pricing & Payment */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CreditCard size={13} />
              Amount & Payment
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-white">
                £{Number(notification.totalAmount || 0).toFixed(2)}
              </span>
              <span
                className={`text-[11px] font-bold ${
                  notification.isPaid ? "text-emerald-400" : "text-amber-300"
                }`}
              >
                ({notification.isPaid ? "Paid in Full" : "Payment Pending"})
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">
              Method: {notification.paymentMethod || "Standard Gateway"}
            </p>
          </div>

          {/* Location */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FAD293] flex items-center gap-1.5">
              <MapPin size={13} />
              Location
            </span>
            <p className="text-white font-medium line-clamp-2">{location}</p>
            {destination && (
              <p className="text-[11px] text-zinc-400 pt-1 border-t border-white/10">
                To: {destination}
              </p>
            )}
          </div>

          {/* Vehicle */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FAD293] flex items-center gap-1.5">
              <Car size={13} />
              Vehicle Information
            </span>
            <p className="text-white font-medium">
              {vehicle || "Standard Fleet Vehicle"}
            </p>
            {provider && (
              <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                <UserCheck size={11} className="text-[#FAD293]" />
                Provider: {provider}
              </p>
            )}
          </div>
        </div>

        {/* Notes / Issue Description */}
        {notes && (
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1 text-xs">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Service Notes / Description
            </span>
            <p className="text-zinc-200 leading-relaxed">{notes}</p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          {onDismiss && (
            <button
              type="button"
              onClick={() => {
                onDismiss(notification.id);
                handleClose();
              }}
              className="text-xs text-white/50 hover:text-red-400 flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
            >
              <Trash2 size={13} />
              <span>Dismiss notification</span>
            </button>
          )}

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleOpenBooking}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FAD293] via-[#E8AF66] to-[#CEA46B] hover:brightness-105 active:scale-95 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#CEA46B]/20 flex items-center gap-2 transition cursor-pointer"
            >
              <span>View Full Booking</span>
              <ExternalLink size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
}
