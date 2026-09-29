"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  RefreshCw,
  X,
  Car,
  Wrench,
  Siren,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Disc,
  CircleDot,
  Radio,
  UserRound,
} from "lucide-react";
import {
  BookingNotification,
  fetchBookingNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  dismissNotification,
  clearAllNotifications,
} from "@/lib/service/notifications.api";

interface NotificationCenterProps {
  variant?: "desktop" | "mobile";
  onCloseMobileMenu?: () => void;
}

export default function NotificationCenter({
  variant = "desktop",
  onCloseMobileMenu,
}: NotificationCenterProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<BookingNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Load notifications from API / local storage
  const loadNotifications = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const data = await fetchBookingNotifications();
      setIsAuthenticated(data.isAuthenticated);
      if (data.isAuthenticated) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
        setIsLive(data.isLive);
      } else {
        setNotifications([]);
        setUnreadCount(0);
        setIsLive(false);
      }
    } catch (err) {
      console.warn("Could not load notifications:", err);
      setIsAuthenticated(false);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  // Initial fetch and event listener for notifications updates
  useEffect(() => {
    loadNotifications(false);

    const handleUpdate = () => {
      loadNotifications(false);
    };

    window.addEventListener("mmc-notifications-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("auth-change", handleUpdate);

    // Auto refresh every 60 seconds
    const interval = setInterval(() => {
      loadNotifications(false);
    }, 60000);

    return () => {
      window.removeEventListener("mmc-notifications-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("auth-change", handleUpdate);
      clearInterval(interval);
    };
  }, [loadNotifications]);

  // Click outside to close dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Handlers
  const handleMarkAllRead = () => {
    markAllNotificationsAsRead(notifications);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = (item: BookingNotification) => {
    markNotificationAsRead(item.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setIsOpen(false);
    if (onCloseMobileMenu) onCloseMobileMenu();

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

  // Filter items
  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === "unread") return !item.read;
    return true;
  });

  // Icon selector
  const getCategoryIcon = (category: BookingNotification["category"]) => {
    switch (category) {
      case "quote":
        return <Sparkles className="w-4 h-4 text-[#e0b777] animate-pulse" />;
      case "car_hire":
      case "chauffeur":
        return <Car className="w-4 h-4 text-[#FAD293]" />;
      case "tyre":
        return <Disc className="w-4 h-4 text-amber-400" />;
      case "emergency":
        return <Siren className="w-4 h-4 text-red-400 animate-pulse" />;
      case "mechanical":
        return <Wrench className="w-4 h-4 text-blue-400" />;
      case "bodywork":
      case "alloy":
        return <Sparkles className="w-4 h-4 text-[#e0b777]" />;
      default:
        return <CircleDot className="w-4 h-4 text-[#FAD293]" />;
    }
  };

  // Status badge styling
  const getStatusBadge = (status: BookingNotification["status"]) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={10} /> Completed
          </span>
        );
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={10} /> Accepted
          </span>
        );
      case "ongoing":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <Clock size={10} /> In Progress
          </span>
        );
      case "canceled":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
            <X size={10} /> Canceled
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock size={10} /> Pending
          </span>
        );
    }
  };

  return (
    <div className="relative inline-block">
      {/* =========================================================
          TRIGGER BUTTON
      ========================================================= */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadNotifications(false);
        }}
        aria-label="Notifications"
        aria-expanded={isOpen}
        className={`
          relative flex items-center justify-center
          transition-all duration-300 active:scale-95 cursor-pointer
          ${variant === "desktop"
            ? `w-10 h-10 rounded-full border ${isOpen
              ? "border-[#FAD293] bg-[#FAD293]/15 text-[#FAD293] ring-2 ring-[#FAD293]/20 shadow-[0_0_15px_rgba(250,210,147,0.3)]"
              : "border-white/10 bg-white/[0.04] text-white/80 hover:text-[#FAD293] hover:border-[#FAD293]/40 hover:bg-white/10"
            }`
            : `w-9 h-9 rounded-xl border border-white/15 bg-white/[0.06] text-white/90 hover:text-[#FAD293] hover:border-[#FAD293]/40`
          }
        `}
      >
        <Bell size={variant === "desktop" ? 18 : 17} />

        {/* Unread Badge Counter */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-red-600 to-amber-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-lg border border-black animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* =========================================================
          NOTIFICATION DROPDOWN / DRAWER
      ========================================================= */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div
            ref={panelRef}
            className={`
              z-50
              bg-[#120F0D]/98
              border border-[#FAD293]/25
              shadow-[0_25px_60px_rgba(0,0,0,0.9)]
              backdrop-blur-2xl
              flex flex-col
              animate-in fade-in zoom-in-95 duration-200
              ${variant === "mobile"
                ? "fixed top-16 left-3 right-3 max-h-[82vh] rounded-3xl"
                : "fixed sm:absolute top-16 sm:top-full right-2 sm:right-0 mt-2 sm:mt-3 w-[calc(100vw-1rem)] sm:w-[410px] max-h-[85vh] sm:max-h-[580px] rounded-3xl"
              }
            `}
            style={{
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(250, 210, 147, 0.08)",
            }}
          >
            {/* 1. HEADER */}
            <div className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.02] rounded-t-3xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FAD293]/20 to-[#CEA46B]/10 border border-[#FAD293]/30 flex items-center justify-center text-[#FAD293]">
                  <Bell size={15} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-white tracking-wide">
                      Notifications
                    </h2>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAD293]/20 text-[#FAD293] border border-[#FAD293]/30">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-white/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
                    <span>Live Booking Updates</span>
                  </div>
                </div>
              </div>

              {/* Actions: Refresh & Close */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => loadNotifications(true)}
                  disabled={loading}
                  title="Refresh bookings"
                  className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    size={14}
                    className={loading ? "animate-spin text-[#FAD293]" : ""}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close"
                  className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {!isAuthenticated ? (
              <div className="py-12 px-6 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FAD293]/20 to-[#CEA46B]/10 border border-[#FAD293]/30 flex items-center justify-center text-[#FAD293] mb-3.5 shadow-lg">
                  <UserRound size={26} />
                </div>
                <h3 className="text-base font-bold text-white mb-1.5">
                  Sign In Required
                </h3>
                <p className="text-xs text-white/60 max-w-[260px] mb-5 leading-relaxed">
                  Please sign in to your account to view your bookings and receive real-time notifications.
                </p>
                <Link
                  href="/login"
                  onClick={() => {
                    setIsOpen(false);
                    if (onCloseMobileMenu) onCloseMobileMenu();
                  }}
                  className="px-6 py-2.5 rounded-full font-bold text-xs text-black shadow-[0_0_20px_rgba(250,210,147,0.35)] hover:scale-105 active:scale-95 transition"
                  style={{
                    background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                  }}
                >
                  Sign In to Account
                </Link>
              </div>
            ) : (
              <>
                {/* 2. FILTER TABS */}
                <div className="px-3 pt-2.5 pb-2 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setActiveTab("all")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${activeTab === "all"
                        ? "bg-[#FAD293] text-black font-semibold shadow-sm"
                        : "bg-white/[0.05] text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                  >
                    All ({notifications.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("unread")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${activeTab === "unread"
                        ? "bg-[#FAD293] text-black font-semibold shadow-sm"
                        : "bg-white/[0.05] text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                  >
                    Unread ({unreadCount})
                  </button>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="ml-auto text-[11px] font-semibold text-[#FAD293] hover:underline flex items-center gap-1 whitespace-nowrap pl-2"
                    >
                      <CheckCheck size={13} />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                {/* 3. NOTIFICATION LIST */}
                <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2 max-h-[380px] divide-y divide-white/[0.04]">
                  {filteredNotifications.length === 0 ? (
                    <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/30 mb-3">
                        <Bell size={20} />
                      </div>
                      <p className="text-sm font-semibold text-white/90">
                        No notifications
                      </p>
                      <p className="text-xs text-white/50 max-w-[220px] mt-1">
                        {activeTab === "unread"
                          ? "You've read all your booking notifications."
                          : "Booking updates and reservation details will show up here."}
                      </p>
                    </div>
                  ) : (
                    filteredNotifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        className={`
                          group relative p-3 rounded-2xl cursor-pointer transition-all duration-200
                          ${item.read
                            ? "bg-transparent hover:bg-white/[0.04] opacity-80 hover:opacity-100"
                            : "bg-gradient-to-r from-[#FAD293]/[0.08] to-transparent border-l-2 border-[#FAD293] hover:bg-[#FAD293]/10"
                          }
                        `}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className="w-8 h-8 rounded-xl bg-[#1A1612] border border-white/10 group-hover:border-[#FAD293]/40 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                            {getCategoryIcon(item.category)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Title & Status */}
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <h3
                                className={`text-xs truncate font-bold ${item.read ? "text-white/90" : "text-white"
                                  }`}
                              >
                                {item.title}
                              </h3>
                              {getStatusBadge(item.status)}
                            </div>

                            {/* Subtitle / Note */}
                            {item.subtitle && (
                              <p className="text-[11px] text-[#FAD293]/90 font-medium truncate mb-1">
                                {item.subtitle}
                              </p>
                            )}

                            {/* Schedule & Price details */}
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/60 mb-1.5">
                              <span className="flex items-center gap-1 text-white/70">
                                <Calendar size={11} className="text-[#FAD293]" />
                                {item.scheduleTime || "Scheduled"}
                              </span>
                              <span>•</span>
                              <span className="font-semibold text-white/80">
                                £{item.totalAmount}
                              </span>
                              {item.isPaid ? (
                                <span className="text-[10px] text-emerald-400 font-medium">
                                  (Paid)
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-400/80 font-medium">
                                  (Pay later)
                                </span>
                              )}
                            </div>

                            {/* Time ago & actions */}
                            <div className="flex items-center justify-between text-[10px] text-white/40 pt-0.5">
                              <span>{item.timeAgo}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[#FAD293] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 text-[11px] font-semibold">
                                  Details <ChevronRight size={12} />
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleDismiss(e, item.id)}
                                  title="Dismiss"
                                  className="text-white/30 hover:text-red-400 p-1 rounded transition-colors"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* 4. FOOTER */}
                <div className="px-4 py-3 border-t border-white/10 bg-white/[0.02] rounded-b-3xl flex items-center justify-between">
                  <Link
                    href="/account?tab=bookings"
                    onClick={() => {
                      setIsOpen(false);
                      if (onCloseMobileMenu) onCloseMobileMenu();
                    }}
                    className="text-xs font-semibold text-[#FAD293] hover:text-[#FFF] transition-colors flex items-center gap-1.5"
                  >
                    <span>View all my bookings</span>
                    <ExternalLink size={12} />
                  </Link>

                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={() => clearAllNotifications(notifications)}
                      className="text-[11px] text-white/40 hover:text-red-400 transition-colors"
                    >
                      Clear history
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
