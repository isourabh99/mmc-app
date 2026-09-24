"use client";

import React, { useEffect, useState } from "react";
import { Hourglass, Loader2, Sparkles, MapPin, CheckCircle2, ShieldCheck, Phone } from "lucide-react";
import { TyreAssistanceBooking } from "@/lib/data/tyre-assistance.data";
import { TyreAssistanceHeader } from "./TyreAssistanceHeader";

interface TechnicianAssigningStepProps {
  booking: TyreAssistanceBooking;
  onAssigned: () => void;
  onBackToHome: () => void;
  onViewBooking: () => void;
}

export const TechnicianAssigningStep: React.FC<TechnicianAssigningStepProps> = ({
  booking,
  onAssigned,
  onBackToHome,
  onViewBooking,
}) => {
  const [dispatchStatusText, setDispatchStatusText] = useState<string>(
    "Connecting with nearest mobile units..."
  );
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setDispatchStatusText("Locating certified technician in your zone...");
      setActiveStepIndex(1);
    }, 1200);

    const t2 = setTimeout(() => {
      setDispatchStatusText("Assigning technician & preparing mobile gear...");
      setActiveStepIndex(2);
    }, 2400);

    const t3 = setTimeout(() => {
      onAssigned();
    }, 3800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onAssigned]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 py-4">
      {/* Mobile Header */}
      <div className="lg:hidden">
        <TyreAssistanceHeader showLogo onBack={onBackToHome} />
      </div>

      {/* Middle Hero: Glowing Gold Hourglass */}
      <div className="flex flex-col items-center justify-center text-center px-4 py-6 space-y-6">
        <div className="relative group">
          <div
            className="absolute inset-0 rounded-full blur-3xl opacity-40 animate-pulse pointer-events-none"
            style={{
              background: "radial-gradient(circle, #FAD293 0%, rgba(206,164,107,0) 70%)",
            }}
          />

          <div
            className="w-40 h-40 sm:w-48 sm:h-48 rounded-full flex items-center justify-center relative shadow-2xl transition-transform"
            style={{
              background: "linear-gradient(135deg, #FFF0D4 0%, #FAD293 45%, #C29352 100%)",
              boxShadow: "0 0 50px rgba(250, 210, 147, 0.3)",
            }}
          >
            <svg
              className="w-16 h-16 sm:w-20 sm:h-20 text-black animate-spin-slow"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 22h14" />
              <path d="M5 2h14" />
              <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
              <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-3 pt-2">
          <h2
            className="text-3xl sm:text-4xl font-black tracking-tight"
            style={{
              background: "linear-gradient(135deg, #FFF0D4 0%, #FAD293 50%, #CEA46B 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Technician assign soon...
          </h2>

          <p className="text-sm sm:text-base text-white/60 max-w-md mx-auto leading-relaxed">
            You&apos;ll be notified as soon as your roadside technician is confirmed and dispatched to your vehicle.
          </p>
        </div>

        {/* Live Dispatch Steps */}
        <div className="w-full max-w-md p-4 rounded-2xl bg-[#141210] border border-white/10 space-y-3 text-left">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span className="flex items-center gap-1.5 font-semibold text-white">
              <Loader2 size={13} className="animate-spin text-[#FAD293]" />
              Dispatch Status
            </span>
            <span className="text-[#FAD293] font-medium">{dispatchStatusText}</span>
          </div>

          <div className="w-full bg-black/60 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#FAD293] to-[#CEA46B] h-full transition-all duration-700 rounded-full"
              style={{
                width: activeStepIndex === 0 ? "35%" : activeStepIndex === 1 ? "70%" : "95%",
              }}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="max-w-md mx-auto grid grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={onBackToHome}
          className="py-4 px-4 rounded-2xl text-xs sm:text-sm font-semibold text-white/90 bg-[#12100e] border border-white/20 hover:border-white/40 hover:bg-white/5 active:scale-[0.99] transition-all cursor-pointer text-center"
        >
          Back to Home
        </button>

        <button
          type="button"
          onClick={onViewBooking}
          className="py-4 px-4 rounded-2xl text-xs sm:text-sm font-bold text-black flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-[0.99] transition-all shadow-xl cursor-pointer text-center"
          style={{
            background: "linear-gradient(135deg, #FAD293 0%, #CEA46B 100%)",
          }}
        >
          View Booking
        </button>
      </div>
    </div>
  );
};
