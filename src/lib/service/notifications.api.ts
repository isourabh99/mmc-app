import apiClient from "@/lib/http/apiClient";
import { triggerDevicePushNotification } from "@/lib/firebase";

export interface BookingNotification {
  id: string;
  bookingId: string | number;
  readableId?: number | string;
  bookingType: "car" | "regular" | "quote";
  category: "car_hire" | "chauffeur" | "tyre" | "emergency" | "mechanical" | "bodywork" | "alloy" | "service" | "quote";
  title: string;
  subtitle?: string;
  description: string;
  status: "pending" | "accepted" | "ongoing" | "completed" | "canceled";
  statusLabel: string;
  totalAmount: number;
  isPaid: boolean;
  paymentMethod: string;
  scheduleTime: string;
  serviceLocation?: string;
  vehicleInfo?: string;
  createdAt: string;
  timeAgo: string;
  read: boolean;
  targetUrl?: string;
  raw?: any;
}

const READ_STORAGE_KEY = "mmc_read_notifications";
const DISMISSED_STORAGE_KEY = "mmc_dismissed_notifications";
const SEEN_PUSH_STORAGE_KEY = "mmc_seen_push_notifications";

function getSeenPushIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SEEN_PUSH_STORAGE_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return new Set(list);
    }
  } catch (err) {}
  return new Set();
}

function saveSeenPushIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SEEN_PUSH_STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch (err) {}
}

/**
 * Format relative time (e.g., "5 mins ago", "Yesterday", "25 Sep")
 */
function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Recently";

    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return "Yesterday";
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "Recently";
  }
}

/**
 * Helper to get read IDs from localStorage
 */
function getReadNotificationIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return new Set(list);
    }
  } catch (err) {
    console.warn("Error reading read notification storage:", err);
  }
  return new Set();
}

/**
 * Helper to get dismissed IDs from localStorage
 */
function getDismissedNotificationIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DISMISSED_STORAGE_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return new Set(list);
    }
  } catch (err) {
    console.warn("Error reading dismissed notification storage:", err);
  }
  return new Set();
}

/**
 * Categorize regular booking based on notes, damage, vehicle, etc.
 */
function detectBookingCategory(
  item: any
): "tyre" | "emergency" | "mechanical" | "bodywork" | "alloy" | "service" {
  const combined = [
    item.notes,
    item.damage_description,
    item.car_model,
    item.special_conditions,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (combined.includes("tyre") || combined.includes("tire") || combined.includes("puncture") || combined.includes("wheel")) {
    return "tyre";
  }
  if (combined.includes("locking") || combined.includes("breakdown") || combined.includes("emergency") || combined.includes("towing")) {
    return "emergency";
  }
  if (combined.includes("dent") || combined.includes("paint") || combined.includes("bodywork") || combined.includes("scratch")) {
    return "bodywork";
  }
  if (combined.includes("alloy") || combined.includes("rim") || combined.includes("diamond")) {
    return "alloy";
  }
  if (combined.includes("engine") || combined.includes("brake") || combined.includes("oil") || combined.includes("service")) {
    return "mechanical";
  }
  return "service";
}

/**
 * Normalizes a regular booking into a clean NotificationItem dynamically
 */
function normalizeRegularBookingNotification(item: any, readIds: Set<string>): BookingNotification {
  const id = `notif-reg-${item.id || item.readable_id}`;
  const readableId = item.readable_id || item.id;
  const category = detectBookingCategory(item);
  const statusRaw = (item.booking_status || "pending").toLowerCase();

  let status: BookingNotification["status"] = "pending";
  if (["completed", "done", "finished"].includes(statusRaw)) status = "completed";
  else if (["accepted", "confirmed"].includes(statusRaw)) status = "accepted";
  else if (["ongoing", "in_progress"].includes(statusRaw)) status = "ongoing";
  else if (["canceled", "cancelled", "rejected"].includes(statusRaw)) status = "canceled";

  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
  const isPaid = item.is_paid === 1 || item.is_paid === true;
  const amount = Number(item.total_booking_amount || 0);

  // Title & Subtitle based on provider updates and status
  const provName = item.provider?.company_name || item.provider_name || "";
  let title = `Booking #${readableId} (${statusLabel})`;
  if (status === "accepted") {
    title = `Booking Accepted by Provider! 🛠️`;
  } else if (status === "ongoing") {
    title = `Service In Progress! 🚗`;
  } else if (status === "completed") {
    title = `Service Completed! ✅`;
  } else if (status === "canceled") {
    title = `Booking Cancelled ⚠️`;
  } else if (item.car_model) {
    title = `${item.car_model} — #${readableId}`;
  }

  let subtitle = "";
  if (provName) {
    subtitle = `${provName} • Ref #${readableId}`;
  } else if (item.notes) {
    subtitle = item.notes;
  } else if (item.damage_description) {
    subtitle = `Issue: ${item.damage_description}`;
  } else if (category === "tyre") {
    subtitle = `Tyre Fitting & Repair • #${readableId}`;
  } else if (category === "emergency") {
    subtitle = `Emergency Assistance • #${readableId}`;
  } else {
    subtitle = `Service Ref #${readableId}`;
  }

  // Description / Summary
  const sched = item.service_schedule ? item.service_schedule.replace(".000000Z", "").replace("T", " ") : "Scheduled Service";
  const paymentText = isPaid ? "Paid" : "Payment Pending";
  const desc = `${sched} • £${amount} (${paymentText})`;

  return {
    id,
    bookingId: item.id,
    readableId,
    bookingType: "regular",
    category,
    title,
    subtitle,
    description: desc,
    status,
    statusLabel,
    totalAmount: amount,
    isPaid,
    paymentMethod: item.payment_method ? item.payment_method.replace(/_/g, " ") : "Cash After Service",
    scheduleTime: sched,
    vehicleInfo: item.car_model ? `${item.car_model} ${item.car_registration_number ? `(${item.car_registration_number})` : ""}` : (item.car_registration_number || undefined),
    createdAt: item.created_at || new Date().toISOString(),
    timeAgo: formatTimeAgo(item.created_at || item.service_schedule),
    read: readIds.has(id),
    raw: item,
  };
}

/**
 * Normalizes a car booking (car hire or chauffeur) into a clean NotificationItem dynamically
 */
function normalizeCarBookingNotification(item: any, readIds: Set<string>): BookingNotification {
  const id = `notif-car-${item.id || item.booking_id}`;
  const car = item.car || {};
  const isChauffeur = item.pickup_type === "chauffeur" || car.service_category === "chauffeur";
  const category: BookingNotification["category"] = isChauffeur ? "chauffeur" : "car_hire";

  const statusRaw = (item.booking_status || "pending").toLowerCase();
  let status: BookingNotification["status"] = "pending";
  if (["completed", "done", "finished"].includes(statusRaw)) status = "completed";
  else if (["accepted", "confirmed"].includes(statusRaw)) status = "accepted";
  else if (["ongoing", "in_progress"].includes(statusRaw)) status = "ongoing";
  else if (["canceled", "cancelled", "rejected"].includes(statusRaw)) status = "canceled";

  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
  const isPaid = item.is_paid === 1 || item.payment_status === "paid";
  const amount = Number(item.total_amount || 0);

  const brand = car.brand || "Vehicle";
  const model = car.model ? ` ${car.model}` : "";
  const title = isChauffeur
    ? `Chauffeur: ${brand}${model}`
    : `Car Hire: ${brand}${model}`;

  const readableId = item.id;
  const location = item.pickup_location || item.delivery_address || "London";
  const dates = item.start_date ? `${item.start_date}${item.end_date && item.end_date !== item.start_date ? ` to ${item.end_date}` : ""}` : "Upcoming";
  const desc = `${dates} • ${location} • £${amount.toFixed(2)}`;

  return {
    id,
    bookingId: item.booking_id || item.id,
    readableId,
    bookingType: "car",
    category,
    title,
    subtitle: `${statusLabel} • ${isChauffeur ? "Chauffeur Service" : "Luxury Rental"}`,
    description: desc,
    status,
    statusLabel,
    totalAmount: amount,
    isPaid,
    paymentMethod: item.payment_method ? item.payment_method.replace(/_/g, " ") : "Cash After Service",
    scheduleTime: `${dates} ${item.pickup_time || ""}`.trim(),
    vehicleInfo: `${brand}${model} ${car.registration_number ? `(${car.registration_number})` : ""}`.trim(),
    createdAt: item.created_at || new Date().toISOString(),
    timeAgo: formatTimeAgo(item.created_at || item.start_date),
    read: readIds.has(id),
    raw: item,
  };
}

/**
 * Normalizes a quotation request / bids post into a clean NotificationItem
 */
function normalizeQuotePostNotification(item: any, readIds: Set<string>): BookingNotification {
  const id = `notif-quote-${item.id}`;
  const bidsCount = Number(item.bids_count || 0);
  const title = bidsCount > 0 
    ? `New Quotation Offer Received! (${bidsCount} Offer${bidsCount > 1 ? "s" : ""})`
    : `Quotation Request Active`;
  const vehicle = item.car_model || item.car_registration_number || "Vehicle Request";
  const desc = item.damage_description || item.service_description || "Specialist quotation request";
  const isAlloy = (
    (item.service_description || "").toLowerCase().includes("alloy") ||
    (item.damage_description || "").toLowerCase().includes("alloy") ||
    (item.category?.name || "").toLowerCase().includes("alloy")
  );
  const targetUrl = isAlloy ? "/services/alloy-wheel?view=quotes" : "/services/bodywork?view=quotes";

  return {
    id,
    bookingId: item.id,
    readableId: item.id ? String(item.id).slice(0, 8) : "QUOTE",
    bookingType: "quote",
    category: isAlloy ? "alloy" : "bodywork",
    title,
    subtitle: `${vehicle} • ${desc}`,
    description: bidsCount > 0
      ? `${bidsCount} specialist offer(s) ready for your review`
      : `Specialists are evaluating your repair request`,
    status: "pending",
    statusLabel: bidsCount > 0 ? `${bidsCount} Offers` : "Awaiting Bids",
    totalAmount: 0,
    isPaid: false,
    paymentMethod: "Deposit / Online",
    scheduleTime: item.booking_schedule || "Flexible",
    vehicleInfo: vehicle,
    createdAt: item.created_at || new Date().toISOString(),
    timeAgo: formatTimeAgo(item.created_at || new Date().toISOString()),
    read: readIds.has(id),
    targetUrl,
    raw: item,
  };
}

/**
 * Normalizes a specific specialist bid/offer into a high-priority NotificationItem
 */
function normalizeBidNotification(
  bid: any,
  post: any,
  readIds: Set<string>
): BookingNotification {
  const id = `notif-bid-${bid.id}`;
  const providerName = bid.provider?.company_name || "Specialist";
  const price = bid.offered_price ? `£${bid.offered_price}` : "Custom Offer";
  const isAlloy = (
    (post?.service_description || "").toLowerCase().includes("alloy") ||
    (post?.damage_description || "").toLowerCase().includes("alloy") ||
    (post?.category?.name || "").toLowerCase().includes("alloy") ||
    (bid?.provider_note || "").toLowerCase().includes("alloy")
  );
  const targetUrl = isAlloy
    ? `/services/alloy-wheel?view=quotes`
    : `/services/bodywork?view=quotes`;

  return {
    id,
    bookingId: post?.id || bid.post_id || bid.id,
    readableId: `BID-${bid.id ? String(bid.id).slice(0, 6) : "OFFER"}`,
    bookingType: "quote",
    category: isAlloy ? "alloy" : "bodywork",
    title: `New Offer: ${price} from ${providerName}`,
    subtitle: `${post?.car_registration_number || post?.car_model || "Vehicle"} • ${providerName}`,
    description:
      bid.provider_note ||
      bid.notes ||
      `${providerName} submitted a fixed quote of ${price}. Tap to view & book.`,
    status: "pending",
    statusLabel: `${price} OFFER`,
    totalAmount: Number(bid.offered_price || 0),
    isPaid: false,
    paymentMethod: "Deposit / Online",
    scheduleTime: post?.booking_schedule || "Flexible",
    vehicleInfo: post?.car_registration_number || post?.car_model || "Vehicle",
    createdAt: bid.created_at || post?.created_at || new Date().toISOString(),
    timeAgo: formatTimeAgo(bid.created_at || post?.created_at || new Date().toISOString()),
    read: readIds.has(id),
    targetUrl,
    raw: { bid, post },
  };
}

/**
 * 100% Dynamic Fetch of Customer Booking Notifications from Live API
 * Strictly calls:
 * GET /customer/booking?limit=10&offset=1&booking_status=all&service_type=all&booking_type=car
 * GET /customer/post?limit=10&offset=1
 */
export async function fetchBookingNotifications(): Promise<{
  notifications: BookingNotification[];
  unreadCount: number;
  isLive: boolean;
  isAuthenticated: boolean;
}> {
  if (typeof window === "undefined") {
    return { notifications: [], unreadCount: 0, isLive: false, isAuthenticated: false };
  }

  // Strictly require user login token
  const token = localStorage.getItem("token");
  if (!token) {
    return {
      notifications: [],
      unreadCount: 0,
      isLive: false,
      isAuthenticated: false,
    };
  }

  const readIds = getReadNotificationIds();
  const dismissedIds = getDismissedNotificationIds();

  let rawRegularBookings: any[] = [];
  let rawCarBookings: any[] = [];
  let rawQuotePosts: any[] = [];
  let isLive = false;

  // 1. Fetch general customer bookings (tyre, emergency, bodywork, valet, etc.)
  try {
    const res = await apiClient.get("/customer/booking", {
      params: {
        limit: 20,
        offset: 1,
        booking_status: "all",
        service_type: "all",
        booking_type: "all",
      },
      timeout: 10000,
    });

    if (res.data?.content) {
      const content = res.data.content;

      if (Array.isArray(content.regular_bookings?.data)) {
        rawRegularBookings.push(...content.regular_bookings.data);
      } else if (Array.isArray(content.regular_bookings)) {
        rawRegularBookings.push(...content.regular_bookings);
      }

      if (Array.isArray(content.bookings?.data)) {
        rawRegularBookings.push(...content.bookings.data);
      } else if (Array.isArray(content.bookings)) {
        rawRegularBookings.push(...content.bookings);
      }

      if (Array.isArray(content.data)) {
        rawRegularBookings.push(...content.data);
      }

      if (Array.isArray(content.car_bookings?.data)) {
        rawCarBookings.push(...content.car_bookings.data);
      } else if (Array.isArray(content.car_bookings)) {
        rawCarBookings.push(...content.car_bookings);
      }

      isLive = true;
    }
  } catch (err: any) {
    console.warn("Live customer bookings fetch failed:", err?.message || err);
  }

  // 2. Also fetch car bookings explicitly to ensure all chauffeur rides are present
  try {
    const resCar = await apiClient.get("/customer/booking", {
      params: {
        limit: 10,
        offset: 1,
        booking_status: "all",
        service_type: "all",
        booking_type: "car",
      },
      timeout: 8000,
    });

    if (resCar.data?.content) {
      const contentCar = resCar.data.content;
      const carList =
        contentCar?.car_bookings?.data ||
        contentCar?.car_bookings ||
        contentCar?.data ||
        (Array.isArray(contentCar) ? contentCar : []);

      if (Array.isArray(carList)) {
        carList.forEach((c: any) => {
          if (!rawCarBookings.some((existing) => existing.id === c.id)) {
            rawCarBookings.push(c);
          }
        });
      }
    }
  } catch {}

  // Only use live confirmed bookings from the API

  // Fetch quotes and check for received specialist bids/offers
  const rawReceivedBids: { bid: any; post: any }[] = [];
  try {
    const [quoteRes1, quoteRes2] = await Promise.all([
      apiClient.get("/customer/post", {
        params: { limit: 10, offset: 1 },
        headers: { zoneid: "a1614dbe-4732-11ee-9702-dee6e8d77be4" },
        timeout: 8000,
      }).catch(() => null),
      apiClient.get("/customer/post", {
        params: { limit: 10, offset: 1 },
        timeout: 8000,
      }).catch(() => null),
    ]);

    const postMap = new Map<string, any>();
    const processQuoteRes = (res: any) => {
      const quoteData = res?.data?.content?.data || res?.data?.data || res?.data?.content;
      if (Array.isArray(quoteData)) {
        quoteData.forEach((p: any) => {
          if (p && p.id && !postMap.has(p.id)) {
            postMap.set(p.id, p);
          }
        });
      }
    };
    processQuoteRes(quoteRes1);
    processQuoteRes(quoteRes2);

    // Also include saved quote post IDs from localStorage if available
    if (typeof window !== "undefined") {
      try {
        const savedIds = JSON.parse(localStorage.getItem("saved_quote_post_ids") || "[]");
        if (Array.isArray(savedIds)) {
          savedIds.forEach((id: string) => {
            if (id && !postMap.has(id)) {
              postMap.set(id, { id, service_description: "Alloy wheel refurbishment and repair" });
            }
          });
        }
      } catch {}
    }

    rawQuotePosts = Array.from(postMap.values());
    if (rawQuotePosts.length > 0) {
      isLive = true;
    }

    // For recent active quote posts (top 6), fetch actual provider bids
    const postsToCheck = rawQuotePosts.slice(0, 6);
    const bidsResponses = await Promise.all(
      postsToCheck.map((p) =>
        apiClient
          .get("/customer/post/bid", {
            params: { post_id: p.id, limit: 10, offset: 1 },
            headers: { zoneid: "a1614dbe-4732-11ee-9702-dee6e8d77be4" },
            timeout: 6000,
          })
          .then((res) => {
            const bids = res.data?.content?.data || res.data?.data || res.data?.content;
            return { post: p, bids: Array.isArray(bids) ? bids : [] };
          })
          .catch(() => ({ post: p, bids: [] }))
      )
    );

    bidsResponses.forEach(({ post, bids }) => {
      if (bids.length > 0) {
        // Update post bids count dynamically
        post.bids_count = Math.max(Number(post.bids_count || 0), bids.length);
        bids.forEach((bid: any) => {
          rawReceivedBids.push({ bid, post });
        });
      }
    });
  } catch (err: any) {
    console.warn("Live customer quotes/bids fetch failed:", err?.message || err);
  }

  const list: BookingNotification[] = [];

  // Convert received specialist bid offers (Highest priority for customer)
  rawReceivedBids.forEach(({ bid, post }) => {
    const notif = normalizeBidNotification(bid, post, readIds);
    if (!dismissedIds.has(notif.id)) {
      list.push(notif);
    }
  });

  // Convert live regular bookings
  rawRegularBookings.forEach((item) => {
    const notif = normalizeRegularBookingNotification(item, readIds);
    if (!dismissedIds.has(notif.id)) {
      list.push(notif);
    }
  });

  // Convert live car bookings
  rawCarBookings.forEach((item) => {
    const notif = normalizeCarBookingNotification(item, readIds);
    if (!dismissedIds.has(notif.id)) {
      list.push(notif);
    }
  });

  // Convert live quote posts (if bids received or active request)
  rawQuotePosts.forEach((item) => {
    if (Number(item.bids_count || 0) > 0) {
      const notif = normalizeQuotePostNotification(item, readIds);
      if (!dismissedIds.has(notif.id)) {
        list.push(notif);
      }
    }
  });

  // Provider Status Transition Detection & Notification
  if (typeof window !== "undefined") {
    try {
      const knownStatusesRaw = localStorage.getItem("mmc_known_booking_statuses");
      const knownStatuses: Record<string, string> = knownStatusesRaw ? JSON.parse(knownStatusesRaw) : {};
      let statusesUpdated = false;

      [...rawRegularBookings, ...rawCarBookings].forEach((item) => {
        const bId = String(item.id || item.booking_id || item.readable_id || "");
        if (!bId) return;
        const currentStatus = (item.booking_status || item.status || "pending").toLowerCase();
        const prevStatus = knownStatuses[bId];

        if (prevStatus && prevStatus !== currentStatus) {
          // Status updated by provider!
          statusesUpdated = true;
          knownStatuses[bId] = currentStatus;

          let statusTitle = "Booking Status Updated";
          let statusDesc = `Booking #${item.readable_id || bId} status changed to ${currentStatus}.`;

          if (["accepted", "confirmed"].includes(currentStatus)) {
            statusTitle = "Booking Accepted by Provider! 🛠️";
            statusDesc = `${item.provider?.company_name || "Specialist"} has confirmed and accepted your booking #${item.readable_id || bId}.`;
          } else if (["ongoing", "in_progress"].includes(currentStatus)) {
            statusTitle = "Service In Progress! 🚗";
            statusDesc = `Work has begun on your reservation #${item.readable_id || bId}.`;
          } else if (["completed", "done"].includes(currentStatus)) {
            statusTitle = "Service Completed! ✅";
            statusDesc = `Your booking #${item.readable_id || bId} has been successfully completed.`;
          } else if (["canceled", "cancelled"].includes(currentStatus)) {
            statusTitle = "Booking Cancelled ⚠️";
            statusDesc = `Booking #${item.readable_id || bId} has been cancelled.`;
          }

          // Trigger native device push notification immediately
          triggerDevicePushNotification(
            statusTitle,
            statusDesc,
            `/account?tab=bookings&bookingId=${bId}`
          );

          // Add status update notification card
          list.unshift({
            id: `status_change_${bId}_${currentStatus}`,
            bookingId: bId,
            readableId: item.readable_id || bId,
            bookingType: item.car ? "car" : "regular",
            category: detectBookingCategory(item),
            title: statusTitle,
            subtitle: `${item.provider?.company_name || "Provider"} • Status: ${currentStatus.toUpperCase()}`,
            description: statusDesc,
            status: currentStatus as any,
            statusLabel: currentStatus.toUpperCase(),
            totalAmount: Number(item.total_booking_amount || item.total_amount || 0),
            isPaid: item.is_paid === 1 || item.payment_status === "paid",
            paymentMethod: item.payment_method || "Online",
            scheduleTime: item.service_schedule || item.start_date || "Confirmed",
            createdAt: new Date().toISOString(),
            timeAgo: "Just now",
            read: false,
            targetUrl: `/account?tab=bookings&bookingId=${bId}`,
          });
        } else if (!prevStatus) {
          knownStatuses[bId] = currentStatus;
          statusesUpdated = true;
        }
      });

      if (statusesUpdated) {
        localStorage.setItem("mmc_known_booking_statuses", JSON.stringify(knownStatuses));
      }
    } catch (e) {
      console.warn("Status change detection error:", e);
    }
  }

  // Convert custom notifications (deduplicate and keep clean)
  if (typeof window !== "undefined") {
    try {
      const rawCustom = localStorage.getItem("mmc_custom_notifications");
      if (rawCustom) {
        let customItems: BookingNotification[] = JSON.parse(rawCustom);
        if (Array.isArray(customItems)) {
          // Deduplicate custom items by bookingId
          const seenBookingIds = new Set<string>();
          const deduped: BookingNotification[] = [];
          customItems.forEach((c) => {
            const bKey = String(c.bookingId || c.id);
            if (!seenBookingIds.has(bKey)) {
              seenBookingIds.add(bKey);
              deduped.push(c);
            }
          });

          // Save deduped list back to localStorage to clean up old random spam
          if (deduped.length !== customItems.length) {
            localStorage.setItem("mmc_custom_notifications", JSON.stringify(deduped));
          }

          deduped.forEach((c) => {
            if (!dismissedIds.has(c.id)) {
              // Don't add if already in list from live bookings
              if (!list.some((existing) => String(existing.bookingId) === String(c.bookingId))) {
                list.push({
                  ...c,
                  read: readIds.has(c.id) || !!c.read,
                  timeAgo: formatTimeAgo(c.createdAt),
                });
              }
            }
          });
        }
      }
    } catch {}
  }

  // Fire push notification for newly arrived notifications
  try {
    const seenPushIds = getSeenPushIds();
    let updatedSeen = false;
    list.slice(0, 3).forEach((n) => {
      if (!seenPushIds.has(n.id)) {
        seenPushIds.add(n.id);
        updatedSeen = true;
        // Native device push notification
        triggerDevicePushNotification(n.title, n.subtitle || n.description, n.targetUrl);
      }
    });
    if (updatedSeen) {
      saveSeenPushIds(seenPushIds);
    }
  } catch {}

  // Sort by date newest first
  list.sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime() || 0;
    const timeB = new Date(b.createdAt).getTime() || 0;
    return timeB - timeA;
  });

  const unreadCount = list.filter((n) => !n.read).length;

  return {
    notifications: list,
    unreadCount,
    isLive,
    isAuthenticated: true,
  };
}

/**
 * Mark a single notification as read
 */
export function markNotificationAsRead(id: string): void {
  if (typeof window === "undefined") return;
  const readIds = getReadNotificationIds();
  readIds.add(id);
  localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(readIds)));
  window.dispatchEvent(new CustomEvent("mmc-notifications-updated"));
}

/**
 * Mark all notifications as read
 */
export function markAllNotificationsAsRead(notifications: BookingNotification[]): void {
  if (typeof window === "undefined") return;
  const readIds = getReadNotificationIds();
  notifications.forEach((n) => readIds.add(n.id));
  localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(readIds)));
  window.dispatchEvent(new CustomEvent("mmc-notifications-updated"));
}

/**
 * Dismiss / delete a notification from view
 */
export function dismissNotification(id: string): void {
  if (typeof window === "undefined") return;
  const dismissedIds = getDismissedNotificationIds();
  dismissedIds.add(id);
  localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(dismissedIds)));
  window.dispatchEvent(new CustomEvent("mmc-notifications-updated"));
}

/**
 * Clear all notifications
 */
export function clearAllNotifications(notifications: BookingNotification[]): void {
  if (typeof window === "undefined") return;
  const dismissedIds = getDismissedNotificationIds();
  notifications.forEach((n) => dismissedIds.add(n.id));
  localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(dismissedIds)));
  window.dispatchEvent(new CustomEvent("mmc-notifications-updated"));
}

/**
 * Add a custom notification (e.g. payment confirmations, booking success)
 */
export function addCustomBookingNotification(notif: {
  bookingId: string | number;
  readableId?: string | number;
  title: string;
  description: string;
  subtitle?: string;
  category?: BookingNotification["category"];
  status?: BookingNotification["status"];
  statusLabel?: string;
  totalAmount?: number;
  paymentMethod?: string;
  scheduleTime?: string;
  targetUrl?: string;
}): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("mmc_custom_notifications");
    const list: BookingNotification[] = raw ? JSON.parse(raw) : [];
    const newId = `notif_pay_${notif.bookingId}_${Date.now()}`;
    const newNotif: BookingNotification = {
      id: newId,
      bookingId: notif.bookingId,
      readableId: notif.readableId || notif.bookingId,
      bookingType: "regular",
      category: notif.category || "service",
      title: notif.title,
      subtitle: notif.subtitle,
      description: notif.description,
      status: notif.status || "ongoing",
      statusLabel: notif.statusLabel || "Payment Confirmed",
      totalAmount: notif.totalAmount || 0,
      isPaid: true,
      paymentMethod: notif.paymentMethod || "Stripe (Online)",
      scheduleTime: notif.scheduleTime || "Scheduled",
      createdAt: new Date().toISOString(),
      timeAgo: "Just now",
      read: false,
      targetUrl:
        notif.targetUrl ||
        `/account?tab=bookings&status=ongoing&bookingId=${encodeURIComponent(String(notif.bookingId))}`,
    };
    const updated = [newNotif, ...list.filter((n) => String(n.bookingId) !== String(notif.bookingId))].slice(0, 30);
    localStorage.setItem("mmc_custom_notifications", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("mmc-notifications-updated"));
  } catch (e) {
    console.warn("Could not save custom notification:", e);
  }
}

