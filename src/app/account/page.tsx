"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Car, Loader2, Sparkles } from "lucide-react";
import {
  fetchAllCustomerBookings,
  UnifiedBookingItem,
} from "@/lib/service/bookings.api";
import {
  getCustomerProfile,
  updateCustomerProfile,
} from "@/app/services/api/profile.api";
import { useToast } from "@/components/ToastProvider";

// Modular Account Components
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { AccountMobileNav } from "@/components/account/AccountMobileNav";
import { BookingsTab } from "@/components/account/BookingsTab";
import { ProfileTab } from "@/components/account/ProfileTab";
import { AddressesTab } from "@/components/account/AddressesTab";
import { SecurityTab } from "@/components/account/SecurityTab";

function AccountContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();

  const tabParam = searchParams.get("tab") || "bookings";
  const [activeTab, setActiveTab] = useState<string>(tabParam);

  // User Profile State
  const [user, setUser] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Unified Bookings State (All Services Across App)
  const [bookings, setBookings] = useState<UnifiedBookingItem[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState("");

  // Sync tab with URL search parameter
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
    router.push(`/account?tab=${tab}`);
  };

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
      console.warn("Could not fetch full user profile:", err);
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser(parsed);
        } catch {}
      }
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Load All Universal Bookings
  const fetchBookings = useCallback(async () => {
    try {
      setBookingsLoading(true);
      setBookingsError("");
      const data = await fetchAllCustomerBookings({
        limit: 50,
        offset: 1,
        booking_status: "all",
        service_type: "all",
      });
      setBookings(data);
    } catch (err: any) {
      console.error("Failed to load customer bookings:", err);
      setBookingsError(
        err?.response?.data?.message ||
          "Unable to load reservations. Please make sure you are logged in."
      );
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchUserProfile();
    fetchBookings();
  }, [fetchUserProfile, fetchBookings, router]);

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("is_active");
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("auth-change"));
    showToast("Logged out successfully.", "info");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#090706] text-white py-4 sm:py-6 font-sans selection:bg-[#e7bd78] selection:text-black">
      <div className="mx-auto max-w-7xl 2xl:max-w-[1440px] 3xl:max-w-[1600px] px-4 sm:px-6 lg:px-8">
        {/* Compact, Sleek Page Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-[#33271d]/80 bg-[#120e0b]/90 backdrop-blur-md px-5 py-3.5 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d9a85f]/20 to-[#a37031]/10 border border-[#d9a85f]/30 flex items-center justify-center text-[#e7bd78] shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  VIP Account Dashboard
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#10b981]/10 border border-[#10b981]/30 px-2 py-0.5 text-[10px] font-semibold text-[#10b981]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                  Connected
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                Manage your reservations, chauffeur itineraries, and vehicle information
              </p>
            </div>
          </div>
        </div>

        {/* MOBILE VIEW: Horizontal Tabs Nav (No heavy vertical sidebar) */}
        <AccountMobileNav
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          user={user}
          bookingsCount={bookings.length}
          onLogout={handleLogout}
        />

        {/* DESKTOP VIEW: 2-Column Dashboard Layout with Sticky Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
          {/* Desktop Sticky Sidebar */}
          <AccountSidebar
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            user={user}
            bookingsCount={bookings.length}
            onLogout={handleLogout}
          />

          {/* Dynamic Content Area based on Selected Tab */}
          <main className="min-w-0">
            {activeTab === "bookings" && (
              <BookingsTab
                bookings={bookings}
                loading={bookingsLoading}
                error={bookingsError}
                onRefresh={fetchBookings}
              />
            )}

            {activeTab === "profile" && (
              <ProfileTab
                initialUser={user}
                onProfileUpdated={fetchUserProfile}
              />
            )}

            {activeTab === "addresses" && (
              <AddressesTab user={user} onAddressUpdated={fetchUserProfile} />
            )}

            {activeTab === "security" && <SecurityTab />}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090706] flex items-center justify-center text-white">
          <Loader2 size={32} className="animate-spin text-[#e7bd78]" />
        </div>
      }
    >
      <AccountContent />
    </Suspense>
  );
}
