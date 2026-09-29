"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  RefreshCw,
  Search,
  Filter,
  Car,
  Wrench,
  Siren,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  Disc,
  CreditCard,
  MapPin,
  X,
} from "lucide-react";
import {
  BookingNotification,
  fetchBookingNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  dismissNotification,
} from "@/lib/service/notifications.api";

export default function NotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<BookingNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  const loadNotifications = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const data = await fetchBookingNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setIsLive(data.isLive);
    } catch (err) {
      console.warn("Could not load notifications:", err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/login");
      return;
    }

    loadNotifications(true);

    const handleUpdate = () => {
      loadNotifications(false);
    };

    window.addEventListener("mmc-notifications-updated", handleUpdate);
    return () => window.removeEventListener("mmc-notifications-updated", handleUpdate);
  }, [loadNotifications, router]);

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead(notifications);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleItemClick = (item: BookingNotification) => {
    markNotificationAsRead(item.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    // 1. Quotation notifications -> navigate to appropriate Quotes Hub
    if (item.category === "alloy" || item.targetUrl?.includes("alloy-wheel")) {
      router.push(item.targetUrl || "/services/alloy-wheel?view=quotes");
      return;
    }
    if (item.targetUrl) {
      router.push(item.targetUrl);
      return;
    }
    if (item.category === "quote" || item.bookingType === "quote") {
      const text = `${item.title} ${item.subtitle || ""} ${item.description}`.toLowerCase();
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
      item.status === "completed"
        ? "completed"
        : item.status === "ongoing" || item.status === "accepted"
        ? "ongoing"
        : item.status === "canceled"
        ? "canceled"
        : "pending";

    const targetBookingId = item.bookingId || item.readableId;

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("mmc-open-booking-modal", {
          detail: {
            bookingId: targetBookingId,
            readableId: item.readableId,
            status: targetStatus,
          },
        })
      );
    }

    router.push(`/account?tab=bookings&status=${targetStatus}&bookingId=${encodeURIComponent(String(targetBookingId))}`);
  };

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dismissNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => {
      const target = notifications.find((n) => n.id === id);
      return target && !target.read ? Math.max(0, prev - 1) : prev;
    });
  };

  const filteredItems = notifications.filter((item) => {
    if (activeTab === "unread" && item.read) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSubtitle = (item.subtitle || "").toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchId = String(item.readableId || "").toLowerCase().includes(q);
      return matchTitle || matchSubtitle || matchDesc || matchId;
    }

    return true;
  });

  const getCategoryIcon = (category: BookingNotification["category"]) => {
    switch (category) {
      case "car_hire":
      case "chauffeur":
        return <Car className="w-5 h-5 text-[#FAD293]" />;
      case "tyre":
        return <Disc className="w-5 h-5 text-amber-400" />;
      case "emergency":
        return <Siren className="w-5 h-5 text-red-400" />;
      case "mechanical":
        return <Wrench className="w-5 h-5 text-blue-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-[#e0b777]" />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>

        <Link
          href="/account?tab=bookings"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#FAD293] hover:underline"
        >
          <Calendar size={15} />
          <span>Manage Bookings</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 mb-8 border border-[#FAD293]/20 bg-gradient-to-br from-[#1A1510] via-[#0E0C0A] to-black overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#FAD293]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FAD293]/25 to-[#CEA46B]/10 border border-[#FAD293]/30 flex items-center justify-center text-[#FAD293] shadow-lg">
              <Bell size={26} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Booking Notifications
              </h1>
              <p className="text-xs sm:text-sm text-white/60 mt-1">
                Real-time booking statuses, dispatch alerts, and service updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => loadNotifications(true)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/10 text-xs font-semibold text-white/80 transition"
            >
              <RefreshCw
                size={14}
                className={loading ? "animate-spin text-[#FAD293]" : ""}
              />
              <span>Refresh</span>
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#FAD293] text-black text-xs font-bold shadow-[0_0_20px_rgba(250,210,147,0.3)] hover:scale-105 transition"
              >
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Booking ID, vehicle or issue..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#FAD293]/50 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === "all"
                ? "bg-[#FAD293] text-black"
                : "bg-white/[0.04] border border-white/10 text-white/70 hover:text-white"
            }`}
          >
            All ({notifications.length})
          </button>

          <button
            onClick={() => setActiveTab("unread")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === "unread"
                ? "bg-[#FAD293] text-black"
                : "bg-white/[0.04] border border-white/10 text-white/70 hover:text-white"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-white/10 bg-white/[0.02]">
            <div className="w-14 h-14 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/30 mx-auto mb-3">
              <Bell size={24} />
            </div>
            <h2 className="text-base font-semibold text-white">No notifications found</h2>
            <p className="text-xs text-white/50 max-w-sm mx-auto mt-1">
              {searchQuery
                ? `No notifications matched "${searchQuery}".`
                : "All your active bookings and updates will appear here."}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`
                p-4 sm:p-5 rounded-3xl border transition-all duration-200 cursor-pointer
                ${
                  item.read
                    ? "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] opacity-85 hover:opacity-100"
                    : "border-[#FAD293]/30 bg-gradient-to-r from-[#FAD293]/[0.08] to-transparent hover:border-[#FAD293]/60 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                }
              `}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-11 h-11 rounded-2xl bg-[#171410] border border-white/10 flex items-center justify-center shrink-0 shadow-md">
                  {getCategoryIcon(item.category)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-white tracking-wide">
                        {item.title}
                      </h2>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-[#FAD293] animate-pulse" />
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-white/50">{item.timeAgo}</span>
                      <button
                        type="button"
                        onClick={(e) => handleDismiss(e, item.id)}
                        className="text-white/30 hover:text-red-400 p-1 rounded transition"
                        title="Dismiss notification"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {item.subtitle && (
                    <p className="text-xs text-[#FAD293] font-medium mb-2">
                      {item.subtitle}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/60">
                    <div className="flex items-center gap-1.5 text-white/70">
                      <Calendar size={13} className="text-[#FAD293]" />
                      <span>{item.scheduleTime}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <CreditCard size={13} className="text-emerald-400" />
                      <span className="font-semibold text-white/80">
                        £{item.totalAmount}
                      </span>
                      <span>({item.isPaid ? "Paid" : item.paymentMethod})</span>
                    </div>

                    <span className="ml-auto text-xs font-semibold text-[#FAD293] flex items-center gap-1 hover:underline">
                      View details <ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
