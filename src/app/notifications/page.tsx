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
  Tag,
} from "lucide-react";
import {
  BookingNotification,
  fetchBookingNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  dismissNotification,
} from "@/lib/service/notifications.api";
import { formatToNumericBookingId } from "@/lib/service/bookings.api";
import NotificationDetailModal from "@/components/NotificationDetailModal";

export default function NotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<BookingNotification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<BookingNotification | null>(null);
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

  // Sync selected notification from URL query on load or change
  useEffect(() => {
    if (typeof window !== "undefined" && notifications.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const queryId = urlParams.get("id") || urlParams.get("bookingId");
      if (queryId) {
        const found = notifications.find(
          (n) =>
            String(n.id) === queryId ||
            String(n.bookingId) === queryId ||
            String(n.readableId) === queryId
        );
        if (found) {
          setSelectedNotification(found);
        }
      }
    }
  }, [notifications]);

  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const queryId = urlParams.get("id") || urlParams.get("bookingId");
      if (!queryId) {
        setSelectedNotification(null);
      } else {
        const found = notifications.find(
          (n) =>
            String(n.id) === queryId ||
            String(n.bookingId) === queryId ||
            String(n.readableId) === queryId
        );
        if (found) setSelectedNotification(found);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [notifications]);

  const handleItemClick = (item: BookingNotification) => {
    markNotificationAsRead(item.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setSelectedNotification(item);
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
    <div className="min-h-screen bg-black text-white pt-3 sm:pt-4 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
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
                p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer
                ${
                  item.read
                    ? "bg-[#14110e]/80 border-[#2a221a] hover:border-[#d9a85f]/30 hover:bg-[#191410]"
                    : "bg-[#18130e] border-[#3d2e1d] hover:border-[#d9a85f]/60 hover:bg-[#1f1812] shadow-md"
                }
              `}
            >
              <div className="flex items-start gap-3.5">
                {/* Left: Circle / Rounded Avatar (Matching mobile app: Tag for quotes, Calendar for bookings, or Image) */}
                {item.image ? (
                  <div className="relative w-11 h-11 rounded-2xl overflow-hidden shrink-0 border border-[#d9a85f]/35 bg-black/40 shadow-sm mt-0.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                  </div>
                ) : item.actionType === "quote" || item.category === "quote" ? (
                  <div className="w-11 h-11 rounded-2xl bg-[#231b13] border border-[#d9a85f]/30 flex items-center justify-center text-[#d9a85f] shrink-0 shadow-sm mt-0.5">
                    <Tag size={19} />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-2xl bg-[#231b13] border border-[#d9a85f]/30 flex items-center justify-center text-[#d9a85f] shrink-0 shadow-sm mt-0.5">
                    <Calendar size={19} />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Title & Unread indicator */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white leading-tight line-clamp-1">
                      {item.title}
                    </h3>
                    {!item.read && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#d9a85f] shrink-0 mt-0.5 shadow-[0_0_8px_rgba(217,168,95,0.8)]" />
                    )}
                  </div>

                  {/* Description (Exact text e.g. "Your booking #100159 status has been updated to Completed." or quotation text) */}
                  <p className="text-xs sm:text-sm text-white/70 mt-1 leading-relaxed line-clamp-2">
                    {item.description || (item.bookingId ? `Your booking #${formatToNumericBookingId(item.readableId || item.bookingId)} status has been updated.` : "")}
                  </p>

                  {/* Footer: Time ago on left, View Bids / View Details on right */}
                  <div className="flex items-center justify-between text-xs text-white/40 mt-2.5 pt-0.5">
                    <span className="font-medium text-[11px] text-white/40">
                      {item.timeAgo}
                    </span>

                    <div className="flex items-center gap-2.5">
                      {item.actionType === "quote" ? (
                        <span className="text-[#d9a85f] text-xs font-bold hover:underline flex items-center gap-0.5">
                          View Bids &gt;
                        </span>
                      ) : item.actionType === "booking" || (item.bookingId && item.bookingId !== "N/A") || item.targetUrl ? (
                        <span className="text-[#d9a85f] text-xs font-bold hover:underline flex items-center gap-0.5">
                          View Details &gt;
                        </span>
                      ) : null}

                      <button
                        type="button"
                        onClick={(e) => handleDismiss(e, item.id)}
                        title="Dismiss"
                        className="text-white/25 hover:text-red-400 p-0.5 rounded transition"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comprehensive Notification Detail Modal */}
      <NotificationDetailModal
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onDismiss={(id) => {
          dismissNotification(id);
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        }}
        urlParamKey="id"
      />
    </div>
  );
}
