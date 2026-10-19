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
  Tag,
  ChevronRight,
} from "lucide-react";
import { BookingNotification, resolveNotificationImageUrl } from "@/lib/service/notifications.api";
import { formatToNumericBookingId } from "@/lib/service/bookings.api";

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
  const bookingRef =
    notification.readableId || notification.bookingId || raw.booking_id || raw.id
      ? formatToNumericBookingId(notification.readableId || notification.bookingId || raw.booking_id || raw.id)
      : "N/A";

  // Comprehensive image resolution for modal banner & avatar
  const resolvedImage =
    notification.image ||
    resolveNotificationImageUrl(raw) ||
    resolveNotificationImageUrl(notification) ||
    (typeof raw.image === "string" ? resolveNotificationImageUrl({ image: raw.image }) : null) ||
    null;

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

    const targetBookingId =
      notification.readableId || notification.bookingId
        ? formatToNumericBookingId(notification.readableId || notification.bookingId)
        : "";

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("mmc-open-booking-modal", {
          detail: {
            bookingId: targetBookingId,
            readableId: targetBookingId,
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
        {/* Drag Handle Bar (matching mobile screenshot) */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-2" />

        {/* Top Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition cursor-pointer"
          title="Close (Esc)"
        >
          <X size={18} />
        </button>

        {/* Header: Circle Avatar + Title & Time */}
        <div className="flex items-center gap-3.5 pr-8">
          {resolvedImage ? (
            <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 border border-[#FAD293]/40 bg-black/50 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolvedImage}
                alt={notification.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  const currentSrc = target.src;
                  if (currentSrc.includes("/storage/app/public/notification/")) {
                    target.src = currentSrc.replace(
                      "/storage/app/public/notification/",
                      "/storage/app/public/push-notification/"
                    );
                  } else if (currentSrc.includes("/storage/app/public/push-notification/")) {
                    target.src = currentSrc.replace(
                      "/storage/app/public/push-notification/",
                      "/storage/app/public/"
                    );
                  } else {
                    target.style.display = "none";
                  }
                }}
              />
            </div>
          ) : notification.actionType === "quote" || notification.category === "quote" ? (
            <div className="w-14 h-14 rounded-full bg-[#2A231C] border border-[#FAD293]/35 flex items-center justify-center shrink-0 shadow-lg text-[#CEA46B]">
              <Tag size={24} />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#1C1713] border border-[#FAD293]/30 flex items-center justify-center shrink-0 shadow-lg text-[#FAD293]">
              {getCategoryIcon()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
              {notification.title}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-white/50">{notification.timeAgo}</span>
              {notification.actionType === "quote" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAD293]/20 text-[#FAD293] border border-[#FAD293]/30">
                  Specialist Bid
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description / Content Body */}
        {notification.description && (
          <p className="text-sm sm:text-base text-white/85 leading-relaxed pt-1 whitespace-pre-wrap">
            {notification.description}
          </p>
        )}

        {/* Attached Notification Image / Media Banner */}
        {resolvedImage && (
          <div className="relative w-full rounded-2xl overflow-hidden border border-[#FAD293]/30 bg-black/60 shadow-xl my-2 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolvedImage}
              alt={notification.title || "Notification Attachment"}
              className="w-full max-h-[320px] sm:max-h-[380px] object-contain mx-auto bg-black/40 rounded-2xl transition-transform duration-300 group-hover:scale-[1.01]"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                const currentSrc = target.src;
                if (currentSrc.includes("/storage/app/public/notification/")) {
                  target.src = currentSrc.replace(
                    "/storage/app/public/notification/",
                    "/storage/app/public/push-notification/"
                  );
                } else if (currentSrc.includes("/storage/app/public/push-notification/")) {
                  target.src = currentSrc.replace(
                    "/storage/app/public/push-notification/",
                    "/storage/app/public/"
                  );
                } else {
                  (target.parentElement as HTMLElement).style.display = "none";
                }
              }}
            />
          </div>
        )}

        {/* Fare Breakdown Card (as shown in mobile screenshot 2) */}
        {((notification.fareBreakdown && notification.fareBreakdown.length > 0) || notification.totalFare) && (
          <div className="bg-[#1C1814] border border-[#2D261E] rounded-2xl p-4 sm:p-5 space-y-3">
            {notification.fareBreakdown?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs sm:text-sm text-white/80">
                <span className="font-medium">{item.label}</span>
                <span className="font-semibold text-white">{item.amount}</span>
              </div>
            ))}

            {notification.totalFare && (
              <div className="border-t border-[#2D261E] pt-3 flex justify-between items-center">
                <span className="text-sm sm:text-base font-bold text-[#FAD293]">Fare Amount</span>
                <span className="text-base sm:text-lg font-black text-[#FAD293]">
                  {notification.totalFare}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Optional Booking Details Grid (only shown if specific booking item with ref) */}
        {notification.actionType === "booking" && bookingRef !== "N/A" && (
          <>
            <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Booking ID:
                </span>
                <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                  #{bookingRef}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyId}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-[11px] font-semibold transition cursor-pointer"
                title="Copy Booking ID"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FAD293] flex items-center gap-1.5">
                  <Calendar size={13} /> Schedule
                </span>
                <p className="text-white font-medium">{notification.scheduleTime || "Scheduled"}</p>
              </div>

              {location && (
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FAD293] flex items-center gap-1.5">
                    <MapPin size={13} /> Location
                  </span>
                  <p className="text-white font-medium truncate">{location}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Action Buttons: Clear separation between View Details and Close */}
        {(() => {
          const hasAction =
            notification.actionType === "quote" ||
            notification.actionType === "question" ||
            (notification.actionType === "booking" && bookingRef !== "N/A") ||
            Boolean(notification.targetUrl);

          const actionLabel =
            notification.actionButtonText ||
            (notification.actionType === "quote"
              ? "View Quote Bids"
              : notification.actionType === "question"
              ? "View Question"
              : "View Booking Details");

          return (
            <div className="space-y-2 pt-2">
              {hasAction && (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      notification.actionType === "quote" ||
                      notification.actionType === "question"
                    ) {
                      router.push(notification.targetUrl || "/account?tab=quotes");
                      handleClose();
                    } else {
                      handleOpenBooking();
                    }
                  }}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#FAD293] via-[#E8AF66] to-[#CEA46B] hover:brightness-105 active:scale-98 text-[#1A1612] font-black text-sm sm:text-base tracking-wide shadow-[0_4px_25px_rgba(206,164,107,0.35)] transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{actionLabel}</span>
                  <ChevronRight size={16} />
                </button>
              )}

              {/* Close Button: Purely closes modal, NEVER redirects to bookings */}
              <button
                type="button"
                onClick={handleClose}
                className={`w-full py-3 rounded-full font-bold text-xs sm:text-sm tracking-wide transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  hasAction
                    ? "bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 hover:text-white"
                    : "bg-gradient-to-r from-[#FAD293] via-[#E8AF66] to-[#CEA46B] text-[#1A1612] font-black hover:brightness-105"
                }`}
              >
                <span>Close</span>
              </button>
            </div>
          );
        })()}

        {/* Optional Dismiss Link */}
        {onDismiss && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                onDismiss(notification.id);
                handleClose();
              }}
              className="text-xs text-white/40 hover:text-red-400 transition cursor-pointer"
            >
              Dismiss from history
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
}
