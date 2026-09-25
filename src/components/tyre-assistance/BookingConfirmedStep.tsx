"use client";

import React from "react";
import {
  Calendar,
  Wrench,
  Car,
  MapPin,
  Receipt,
  Check,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Download,
  Share2,
  ArrowRight,
} from "lucide-react";
import { TyreAssistanceBooking } from "@/lib/data/tyre-assistance.data";
import { TyreAssistanceHeader } from "./TyreAssistanceHeader";

interface BookingConfirmedStepProps {
  booking: TyreAssistanceBooking;
  onViewBooking: () => void;
  onBack: () => void;
}

export const BookingConfirmedStep: React.FC<BookingConfirmedStepProps> = ({
  booking,
  onViewBooking,
  onBack,
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 py-4">
      {/* Mobile Header */}
      <div className="lg:hidden">
        <TyreAssistanceHeader showLogo onBack={onBack} />
      </div>

      {/* Hero Checkmark */}
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="relative group">
          <div
            className="absolute inset-0 rounded-full blur-3xl opacity-40 animate-pulse pointer-events-none"
            style={{
              background: "radial-gradient(circle, #FAD293 0%, rgba(206,164,107,0) 70%)",
            }}
          />

          <div
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center relative shadow-2xl transition-transform"
            style={{
              background: "linear-gradient(135deg, #FFF0D4 0%, #FAD293 45%, #C29352 100%)",
              boxShadow: "0 0 45px rgba(250, 210, 147, 0.3)",
            }}
          >
            <Check size={52} className="text-black stroke-[3.5]" />
          </div>
        </div>

        <h2
          className="text-3xl sm:text-4xl font-black tracking-tight lowercase"
          style={{
            background: "linear-gradient(135deg, #FFF0D4 0%, #FAD293 50%, #CEA46B 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          booking confirmed
        </h2>

        <p className="text-xs sm:text-sm text-white/60 max-w-md mx-auto">
          Your request has been dispatched. Reference number:{" "}
          <span className="text-[#FAD293] font-mono font-bold text-sm sm:text-base">
            {(typeof window !== "undefined" &&
              booking.referenceNumber.startsWith("MMC-TYR-") &&
              localStorage.getItem("last_tyre_booking_id"))
              ? `#${localStorage.getItem("last_tyre_booking_id")}`
              : booking.referenceNumber.startsWith("#")
              ? booking.referenceNumber
              : `#${booking.referenceNumber}`}
          </span>
        </p>
      </div>

      {/* Detailed Booking Summary Card */}
      <div className="p-5 sm:p-7 rounded-3xl bg-[#141210] border border-white/10 space-y-5 shadow-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          {/* Date and time */}
          <div className="flex items-start space-x-3.5 p-3 rounded-2xl bg-black/40 border border-white/5">
            <div className="w-9 h-9 rounded-xl bg-[#FAD293]/10 border border-[#FAD293]/20 flex items-center justify-center text-[#FAD293] flex-shrink-0 mt-0.5">
              <Calendar size={18} />
            </div>
            <div className="flex-1">
              <span className="text-[11px] text-white/45 block">Date and time</span>
              <span className="text-xs sm:text-sm font-semibold text-white">
                {booking.formattedDateTime || "Today, Immediate Dispatch"}
              </span>
            </div>
          </div>

          {/* Repair type */}
          <div className="flex items-start space-x-3.5 p-3 rounded-2xl bg-black/40 border border-white/5">
            <div className="w-9 h-9 rounded-xl bg-[#FAD293]/10 border border-[#FAD293]/20 flex items-center justify-center text-[#FAD293] flex-shrink-0 mt-0.5">
              <Wrench size={18} />
            </div>
            <div className="flex-1">
              <span className="text-[11px] text-white/45 block">Repair type</span>
              <span className="text-xs sm:text-sm font-semibold text-white">
                {booking.assistanceLabel} ({booking.categoryLabel})
              </span>
            </div>
          </div>

          {/* Vehicle */}
          <div className="flex items-start space-x-3.5 p-3 rounded-2xl bg-black/40 border border-white/5">
            <div className="w-9 h-9 rounded-xl bg-[#FAD293]/10 border border-[#FAD293]/20 flex items-center justify-center text-[#FAD293] flex-shrink-0 mt-0.5">
              <Car size={18} />
            </div>
            <div className="flex-1">
              <span className="text-[11px] text-white/45 block">Vehicle</span>
              <span className="text-xs sm:text-sm font-semibold text-white">
                {booking.vehicleMakeModel} ({booking.vehicleRegistration})
              </span>
            </div>
          </div>

          {/* Estimated quote */}
          <div className="flex items-start space-x-3.5 p-3 rounded-2xl bg-black/40 border border-white/5">
            <div className="w-9 h-9 rounded-xl bg-[#FAD293]/10 border border-[#FAD293]/20 flex items-center justify-center text-[#FAD293] flex-shrink-0 mt-0.5">
              <Receipt size={18} />
            </div>
            <div className="flex-1">
              <span className="text-[11px] text-white/45 block">Estimated quote</span>
              <span className="text-base sm:text-lg font-bold text-[#FAD293]">
                £{booking.quote.fareAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Location Row */}
        <div className="flex items-start space-x-3.5 p-3.5 rounded-2xl bg-black/40 border border-white/5 text-left">
          <div className="w-9 h-9 rounded-xl bg-[#FAD293]/10 border border-[#FAD293]/20 flex items-center justify-center text-[#FAD293] flex-shrink-0 mt-0.5">
            <MapPin size={18} />
          </div>
          <div className="flex-1">
            <span className="text-[11px] text-white/45 block">Service Location</span>
            <span className="text-xs sm:text-sm font-semibold text-white">
              {booking.locationAddress}
            </span>
          </div>
        </div>

        {/* Provider Branding */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex flex-col select-none">
              <span
                className="text-sm font-black tracking-widest leading-none"
                style={{
                  background: "linear-gradient(135deg, #FFF0D4 0%, #FAD293 45%, #C29352 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                MMC
              </span>
            </div>
            <span className="text-xs font-medium text-white/80">
              {booking.provider?.name || "Motor Market Connect"}
            </span>
          </div>

          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Technician Dispatched
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="py-4 px-6 rounded-2xl text-xs sm:text-sm font-semibold text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer text-center"
        >
          Book Another Tyre / Return to Start
        </button>

        <button
          type="button"
          onClick={onViewBooking}
          className="py-4 px-6 rounded-2xl text-xs sm:text-sm font-bold text-black flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all shadow-xl cursor-pointer text-center"
          style={{
            background: "linear-gradient(135deg, #FAD293 0%, #CEA46B 100%)",
          }}
        >
          <span>View Full Booking & Live Tracking</span>
          <ArrowRight size={16} className="stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
