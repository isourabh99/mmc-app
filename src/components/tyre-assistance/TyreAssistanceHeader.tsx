"use client";

import React from "react";
import { ChevronLeft, Bell } from "lucide-react";

interface TyreAssistanceHeaderProps {
  title?: string;
  showLogo?: boolean;
  onBack?: () => void;
  onNotificationClick?: () => void;
  hasUnreadNotifications?: boolean;
}

export const TyreAssistanceHeader: React.FC<TyreAssistanceHeaderProps> = ({
  title,
  showLogo = false,
  onBack,
  onNotificationClick,
  hasUnreadNotifications = false,
}) => {
  return (
    <header className="w-full flex items-center justify-between py-3 px-1 sm:px-2 relative z-20">
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="w-10 h-10 rounded-xl bg-[#141414] border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:border-[#FAD293]/40 hover:bg-white/5 active:scale-95 transition-all shadow-md cursor-pointer"
        aria-label="Go back"
      >
        <ChevronLeft size={20} className="stroke-[2.5]" />
      </button>

      {/* Center: Title or MMC Logo */}
      <div className="flex-1 flex items-center justify-center text-center px-2">
        {showLogo ? (
          <div className="flex flex-col items-center select-none">
            <span
              className="text-lg font-black tracking-widest leading-none"
              style={{
                background: "linear-gradient(135deg, #FFF0D4 0%, #FAD293 45%, #C29352 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              MMC
            </span>
            <span className="text-[7px] tracking-[0.25em] text-[#C29352]/80 uppercase font-semibold mt-0.5">
              MOTOR MARKET CONNECT
            </span>
          </div>
        ) : (
          <h1 className="text-base sm:text-lg font-semibold text-white tracking-tight truncate">
            {title || "Tyre"}
          </h1>
        )}
      </div>

      {/* Notification Bell Button */}
      <button
        type="button"
        onClick={onNotificationClick}
        className="w-10 h-10 rounded-xl bg-[#141414] border border-white/10 flex items-center justify-center text-white/80 hover:text-[#FAD293] hover:border-[#FAD293]/40 hover:bg-white/5 active:scale-95 transition-all shadow-md relative cursor-pointer"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {hasUnreadNotifications && (
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#FAD293] ring-2 ring-black animate-pulse" />
        )}
      </button>
    </header>
  );
};
