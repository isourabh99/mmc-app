"use client";

import React from "react";
import {
  Calendar,
  UserRound,
  MapPin,
  Shield,
  LogOut,
  Sparkles,
} from "lucide-react";

interface AccountSidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  user: any;
  bookingsCount: number;
  onLogout: () => void;
}

export const AccountSidebar: React.FC<AccountSidebarProps> = ({
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
      label: "Personal Profile",
      icon: UserRound,
    },
    {
      id: "addresses",
      label: "Saved Addresses",
      icon: MapPin,
    },
    {
      id: "security",
      label: "Security & Privacy",
      icon: Shield,
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col lg:sticky lg:top-24 z-10 w-full rounded-3xl border border-[#33271d] bg-[#14100c] p-5 shadow-2xl shadow-black/80 space-y-5">
      {/* User Profile Card */}
      <div className="flex items-center gap-3.5 border-b border-white/10 pb-4">
        <div className="relative flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border border-[#d9a85f]/50 bg-gradient-to-br from-[#2a1e14] to-[#16100b] text-[#e7bd78] shadow-inner font-bold text-lg">
          {user?.profile_image_full_path ? (
            <img
              src={user.profile_image_full_path}
              alt={userName}
              className="h-full w-full rounded-2xl object-cover"
            />
          ) : (
            <span>{userInitials}</span>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#14100c] bg-[#10b981]" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="rounded-md border border-[#d9a85f]/40 bg-[#d9a85f]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#e7bd78]">
              VIP Client
            </span>
          </div>
          <h3 className="font-bold text-sm text-white truncate mt-1">
            {userName}
          </h3>
          <p className="text-[11px] text-white/50 truncate">
            {user?.phone || user?.email || "+91 8555825586"}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="space-y-1.5">
        {navItems.map((item) => {
          const isSelected = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                isSelected
                  ? "bg-gradient-to-r from-[#f2cb87] to-[#d09a50] text-[#140e0a] shadow-md shadow-[#d09a50]/20 font-bold"
                  : "text-white/70 hover:bg-[#1f1711] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  size={15}
                  className={isSelected ? "text-[#140e0a]" : "text-[#e7bd78]"}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
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

        <div className="pt-3 border-t border-white/10 mt-2">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-950/30 hover:text-red-300"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </aside>
  );
};
