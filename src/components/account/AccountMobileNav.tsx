"use client";

import React from "react";
import {
  Calendar,
  UserRound,
  MapPin,
  Shield,
  LogOut,
} from "lucide-react";

interface AccountMobileNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  user: any;
  bookingsCount: number;
  onLogout: () => void;
}

export const AccountMobileNav: React.FC<AccountMobileNavProps> = ({
  activeTab,
  onSelectTab,
  user,
  bookingsCount,
  onLogout,
}) => {
  const userName =
    user?.first_name || user?.last_name
      ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
      : "VIP Member";

  const userInitials =
    (user?.first_name?.[0] || "") + (user?.last_name?.[0] || "") || "V";

  const navItems = [
    {
      id: "bookings",
      label: "My Bookings",
      icon: Calendar,
      badge: bookingsCount > 0 ? String(bookingsCount) : undefined,
    },
    {
      id: "profile",
      label: "Profile",
      icon: UserRound,
    },
    {
      id: "addresses",
      label: "Addresses",
      icon: MapPin,
    },
    {
      id: "security",
      label: "Security",
      icon: Shield,
    },
  ];

  return (
    <div className="lg:hidden flex flex-col space-y-3 mb-5">
      {/* Compact Mobile User Header */}
      <div className="flex items-center justify-between rounded-2xl border border-[#33271d] bg-[#14100c] p-3.5 shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d9a85f]/40 bg-gradient-to-br from-[#2a1e14] to-[#16100b] text-[#e7bd78] font-bold text-sm">
            {user?.profile_image_full_path ? (
              <img
                src={user.profile_image_full_path}
                alt={userName}
                className="h-full w-full rounded-xl object-cover"
              />
            ) : (
              <span>{userInitials}</span>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[#14100c] bg-[#10b981]" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-xs text-white truncate">
              {userName}
            </h3>
            <p className="text-[10px] text-white/50 truncate">
              {user?.phone || user?.email || "+91 8555825586"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          title="Logout"
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/30 bg-red-950/20 text-red-400 hover:bg-red-950/40 shrink-0 transition"
        >
          <LogOut size={14} />
        </button>
      </div>

      {/* Horizontal Scrollable Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {navItems.map((item) => {
          const isSelected = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition shrink-0 ${
                isSelected
                  ? "bg-gradient-to-r from-[#f2cb87] to-[#d09a50] text-[#140e0a] font-bold shadow-md shadow-[#d09a50]/20"
                  : "border border-[#33271d] bg-[#14100c] text-white/70 hover:bg-[#1f1711] hover:text-white"
              }`}
            >
              <Icon
                size={14}
                className={isSelected ? "text-[#140e0a]" : "text-[#e7bd78]"}
              />
              <span>{item.label}</span>

              {item.badge && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                    isSelected
                      ? "bg-[#140e0a] text-[#e7bd78]"
                      : "bg-[#251b13] text-[#e7bd78] border border-[#d9a85f]/30"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
