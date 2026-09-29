"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Sparkles,
  Calendar,
  CreditCard,
  ArrowRight,
  Home,
  Copy,
  Check,
  AlertCircle,
  XCircle,
  ShieldCheck,
  User,
} from "lucide-react";
import { triggerDevicePushNotification } from "@/lib/firebase";
import { saveBookingMeta, saveConfirmedBooking } from "@/lib/service/bookings.api";
import { addCustomBookingNotification } from "@/lib/service/notifications.api";

interface PendingBooking {
  booking_id?: string;
  readable_id?: string | number;
  provider?: any;
  schedule?: string;
  price?: number | string;
  is_partial?: number | boolean;
  deposit_amount?: number;
  service_name?: string;
}

function BookingSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const flag = searchParams.get("flag");
  const isFailed = flag === "fail" || flag === "cancel" || flag === "cancelled";
  const urlBookingId =
    searchParams.get("booking_id") ||
    searchParams.get("bookingId") ||
    searchParams.get("id");

  const [bookingData, setBookingData] = useState<PendingBooking | null>(null);
  const [copied, setCopied] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);

  useEffect(() => {
    // 1. Retrieve cached pending booking data
    let cached: PendingBooking | null = null;
    try {
      const raw = sessionStorage.getItem("mmc_pending_booking");
      if (raw) {
        cached = JSON.parse(raw);
        setBookingData(cached);
      }
    } catch (err) {
      console.warn("Could not read pending booking from sessionStorage:", err);
    }

    let effectiveBookingId =
      urlBookingId ||
      cached?.booking_id ||
      cached?.readable_id ||
      (cached as any)?.temp_id;

    if (!effectiveBookingId) {
      effectiveBookingId = "MMC-" + Math.floor(100000 + Math.random() * 900000);
      if (cached) {
        (cached as any).temp_id = effectiveBookingId;
        try {
          sessionStorage.setItem("mmc_pending_booking", JSON.stringify(cached));
        } catch {}
      }
    }

    // 2. If payment is successful
    if (!isFailed) {
      // Mark as paid in local bookings cache
      saveBookingMeta(effectiveBookingId, { isPaid: true, paymentStatus: "paid" });

      // Persist full booking object so refreshing My Bookings will never lose it
      const sched = cached?.schedule || new Date().toISOString();
      const schedParts = String(sched).split(" ");
      const rawPrice =
        typeof cached?.price === "number"
          ? cached.price
          : parseFloat(String(cached?.price || "0")) || 0;

      const detectedType = cached?.service_name?.toLowerCase().includes("alloy")
        ? "alloy"
        : cached?.service_name?.toLowerCase().includes("mod")
        ? "modification"
        : cached?.service_name?.toLowerCase().includes("chauffeur")
        ? "chauffeur"
        : "bodywork";

      saveConfirmedBooking({
        id: String(effectiveBookingId),
        rawId: effectiveBookingId,
        serviceType: detectedType,
        serviceTitle: cached?.service_name || "Specialist Bodywork & Paint Service",
        serviceCategoryName: "Bodywork & Paint Repair",
        providerName: cached?.provider?.company_name || "MMC Verified Specialist",
        providerPhone: cached?.provider?.company_phone,
        totalAmount: rawPrice,
        isPaid: true,
        paymentStatus: "Paid",
        paymentMethod: "Stripe (Online)",
        status: "accepted",
        statusDisplay: "Accepted",
        scheduleDate: schedParts[0] || new Date().toISOString().split("T")[0],
        scheduleTime: schedParts[1] ? schedParts[1].slice(0, 5) : "11:00",
        fullScheduleDisplay: sched,
        createdAt: new Date().toISOString(),
      });

      const targetDeepLink = `/account?tab=bookings&status=ongoing&bookingId=${encodeURIComponent(String(effectiveBookingId))}`;

      // Record in-app notification for the notification bell & notifications page (only once)
      addCustomBookingNotification({
        bookingId: effectiveBookingId,
        readableId: cached?.readable_id || effectiveBookingId,
        title: "Payment Successful! 🎉",
        subtitle: `Ref #${effectiveBookingId} • Confirmed`,
        description: `Your payment was processed successfully. Booking #${effectiveBookingId} is now confirmed.`,
        category: detectedType as any,
        status: "ongoing",
        statusLabel: "Payment Confirmed",
        totalAmount: rawPrice,
        paymentMethod: "Stripe (Online)",
        scheduleTime: cached?.schedule || "Confirmed",
        targetUrl: targetDeepLink,
      });

      // Notify notification bell & navbar
      window.dispatchEvent(new CustomEvent("mmc-notifications-updated"));

      // Trigger native device push notification via Firebase helper
      if (!notificationSent) {
        setNotificationSent(true);
        try {
          triggerDevicePushNotification(
            "Payment Successful! 🎉",
            `Your booking #${effectiveBookingId} has been confirmed and payment received.`,
            targetDeepLink
          );
        } catch (e) {
          console.warn("Could not trigger device push notification:", e);
        }
      }
    }
  }, [isFailed, urlBookingId, notificationSent]);

  const effectiveBookingRef =
    urlBookingId ||
    bookingData?.readable_id ||
    bookingData?.booking_id ||
    "CONFIRMED";

  const isPartial =
    bookingData?.is_partial === 1 ||
    bookingData?.is_partial === true;

  const rawPrice =
    typeof bookingData?.price === "number"
      ? bookingData.price
      : parseFloat(String(bookingData?.price || "0")) || 0;

  const depositDue = isPartial
    ? Number(bookingData?.deposit_amount || (rawPrice * 0.25).toFixed(2))
    : rawPrice;

  const remainingDue = isPartial
    ? Number((rawPrice * 0.75).toFixed(2))
    : 0;

  const handleCopy = () => {
    if (effectiveBookingRef) {
      navigator.clipboard.writeText(String(effectiveBookingRef));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-[#FAD293] selection:text-black">
      <div className="w-full max-w-xl animate-scale-up">
        {/* Main Card */}
        <div className="bg-[#141418] border border-zinc-800/90 rounded-3xl p-6 sm:p-9 shadow-2xl space-y-7 relative overflow-hidden text-center">
          {/* Ambient Glow */}
          <div
            className={`absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl pointer-events-none ${
              isFailed ? "bg-red-500/10" : "bg-gradient-to-b from-[#FAD293]/20 via-[#10B981]/15 to-transparent"
            }`}
          />

          {/* Success / Failure Icon */}
          <div className="relative flex justify-center pt-2">
            {!isFailed ? (
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-[#FAD293] via-[#E8AF66] to-[#10B981] p-1 shadow-2xl shadow-[#10B981]/25 flex items-center justify-center animate-bounce-once">
                  <div className="w-full h-full rounded-full bg-[#111114] flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-[#10B981] stroke-[2.5]" />
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 bg-[#10B981] text-black text-[10px] font-black uppercase px-2 py-0.5 rounded-full border-2 border-[#141418] shadow">
                  PAID
                </div>
              </div>
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center text-red-400">
                <XCircle className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2]" />
              </div>
            )}
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-2 relative">
            <span
              className={`text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full border inline-block ${
                isFailed
                  ? "bg-red-500/10 text-red-400 border-red-500/30"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              }`}
            >
              {isFailed ? "Payment Incomplete" : "Booking Confirmed & Verified"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isFailed ? "Payment Not Completed" : "Payment Received Successfully!"}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
              {isFailed
                ? "Your payment could not be processed. Your booking is held in pending status and can be paid from My Bookings."
                : "Thank you! Your appointment has been secured with the accredited specialist. Confirmation push notification has been sent."}
            </p>
          </div>

          {/* Booking Summary Box */}
          <div className="rounded-2xl border border-zinc-800 bg-[#1A1A1F] p-4 sm:p-5 text-left space-y-3.5 text-xs">
            {/* Booking Ref */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <span className="text-zinc-400 font-medium">Booking Reference</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-white text-sm">
                  #{effectiveBookingRef}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
                  title="Copy Reference"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Provider Name */}
            {bookingData?.provider?.company_name && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-medium">Assigned Specialist</span>
                <span className="font-bold text-white capitalize">
                  {bookingData.provider.company_name}
                </span>
              </div>
            )}

            {/* Schedule */}
            {bookingData?.schedule && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-medium">Appointment Schedule</span>
                <span className="font-semibold text-zinc-200">
                  {bookingData.schedule}
                </span>
              </div>
            )}

            {/* Price breakdown */}
            {rawPrice > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-medium">Total Service Price</span>
                  <span className="font-bold text-white">£{rawPrice.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-bold">
                    {isPartial ? "Deposit Paid Now (25%)" : "Full Payment Paid Online"}
                  </span>
                  <span className="font-extrabold text-emerald-400 text-sm">
                    £{depositDue.toFixed(2)}
                  </span>
                </div>

                {isPartial && remainingDue > 0 && (
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-[11px]">
                    <span className="text-amber-400 font-medium">
                      Remaining Due on Completion (75%)
                    </span>
                    <span className="font-bold text-amber-400">
                      £{remainingDue.toFixed(2)}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Payment Method */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <span className="text-zinc-400 font-medium">Payment Channel</span>
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#FAD293]" />
                <span>Stripe Online Verification</span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/account?tab=bookings"
              className="w-full sm:w-auto flex-1 bg-gradient-to-r from-[#F6D089] to-[#D5A054] text-zinc-950 font-black text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-[#D5A054]/25 transition-all text-center flex items-center justify-center gap-2 uppercase tracking-wider hover:brightness-105 active:scale-95"
            >
              <span>View My Bookings</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/"
              className="w-full sm:w-auto flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl transition-all text-center flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4 text-[#FAD293]" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>

        {/* Support Note */}
        <p className="text-[11px] text-zinc-500 text-center mt-6">
          Need assistance or want to reschedule? Contact MMC Customer Support at{" "}
          <a href="mailto:support@mmcclub.co.uk" className="text-[#FAD293] underline">
            support@mmcclub.co.uk
          </a>
        </p>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0C] text-white flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-[#FAD293] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BookingSuccessContent />
    </Suspense>
  );
}
