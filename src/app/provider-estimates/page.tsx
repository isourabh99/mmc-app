"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Receipt,
  Sparkles,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { AccountMobileNav } from "@/components/account/AccountMobileNav";
import { EstimatesTab } from "@/components/account/EstimatesTab";
import { getCustomerProfile } from "@/app/services/api/profile.api";
import { fetchAllCustomerBookings, isFakeDummyId } from "@/lib/service/bookings.api";
import { useToast } from "@/components/ToastProvider";

function ProviderEstimatesContent() {
  const router = useRouter();
  const { showToast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [bookingsCount, setBookingsCount] = useState(0);

  // Load User Profile
  const fetchUserProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      const res = await getCustomerProfile();
      const data = res?.content || res?.data || res;
      if (data) {
        setUser(data);
      }
    } catch (err) {
      console.warn("Could not fetch user profile:", err);
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {}
      }
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Fetch Bookings Count
  const fetchBookings = useCallback(async () => {
    try {
      const data = await fetchAllCustomerBookings({ limit: 50, offset: 1 });
      const realOnly = (data || []).filter(
        (b) => !isFakeDummyId(b.id) && !isFakeDummyId(b.rawId)
      );
      setBookingsCount(realOnly.length);
    } catch (err) {
      console.warn("Failed to load bookings count:", err);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login?redirect=/provider-estimates");
      return;
    }

    fetchUserProfile();
    fetchBookings();
  }, [fetchUserProfile, fetchBookings, router]);

  const handleSelectTab = (tab: string) => {
    if (tab === "estimates") {
      router.push("/provider-estimates");
    } else {
      router.push(`/account?tab=${tab}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("is_active");
    localStorage.removeItem("mmc_confirmed_bookings");
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("auth-change"));
    showToast("Logged out successfully.", "info");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#090706] text-white py-4 sm:py-6 font-sans selection:bg-[#e7bd78] selection:text-black">
      <div className="mx-auto max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] px-4 sm:px-6 lg:px-8">
        {/* Sleek Page Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-[#33271d]/80 bg-[#120e0b]/90 backdrop-blur-md px-5 py-3.5 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d9a85f]/20 to-[#a37031]/10 border border-[#d9a85f]/30 flex items-center justify-center text-[#e7bd78] shrink-0">
              <Receipt size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Provider Estimates Hub
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#10b981]/10 border border-[#10b981]/30 px-2 py-0.5 text-[10px] font-semibold text-[#10b981]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                  Live Specialist Quotes
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                Review verified workshop repair estimates, parts warranties, and approve jobs with 1-click
              </p>
            </div>
          </div>

          <Link
            href="/account"
            className="flex items-center gap-1.5 text-xs font-bold text-white/60 hover:text-[#e7bd78] transition"
          >
            <ChevronLeft size={14} />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* MOBILE VIEW: Horizontal Tabs Nav */}
        <AccountMobileNav
          activeTab="estimates"
          onSelectTab={handleSelectTab}
          user={user}
          bookingsCount={bookingsCount}
          onLogout={handleLogout}
        />

        {/* DESKTOP VIEW: 2-Column Dashboard Layout with Sticky Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
          {/* Desktop Sticky Sidebar */}
          <AccountSidebar
            activeTab="estimates"
            onSelectTab={handleSelectTab}
            user={user}
            bookingsCount={bookingsCount}
            onLogout={handleLogout}
          />

          {/* Main Content Area */}
          <main className="min-w-0">
            <EstimatesTab />
          </main>
        </div>
      </div>
    </div>
  );
}

export default function ProviderEstimatesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090706] flex items-center justify-center text-white">
          <Loader2 size={32} className="animate-spin text-[#e7bd78]" />
        </div>
      }
    >
      <ProviderEstimatesContent />
    </Suspense>
  );
}
