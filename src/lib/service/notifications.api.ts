import apiClient from "@/lib/http/apiClient";
import { triggerDevicePushNotification } from "@/lib/firebase";
import { isFakeDummyId, getBookingMeta, formatToNumericBookingId } from "@/lib/service/bookings.api";

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
  image?: string | null;
  actionType?: "quote" | "question" | "close" | "booking";
  actionButtonText?: string;
  fareBreakdown?: { label: string; amount: string }[];
  totalFare?: string;
  raw?: any;
}

const READ_STORAGE_KEY = "mmc_read_notifications";
const DISMISSED_STORAGE_KEY = "mmc_dismissed_notifications";
const SEEN_PUSH_STORAGE_KEY = "mmc_seen_push_notifications";

export function getCurrentUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const u = JSON.parse(raw);
      return u?.id || u?.user_id || u?.uuid || null;
    }
  } catch {}
  return null;
}

function getUserStorageKey(base: string): string {
  const uid = getCurrentUserId();
  return uid ? `${base}_${uid}` : base;
}

function getSeenPushIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(getUserStorageKey(SEEN_PUSH_STORAGE_KEY));
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
    localStorage.setItem(getUserStorageKey(SEEN_PUSH_STORAGE_KEY), JSON.stringify(Array.from(ids)));
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
    const raw = localStorage.getItem(getUserStorageKey(READ_STORAGE_KEY));
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
    const raw = localStorage.getItem(getUserStorageKey(DISMISSED_STORAGE_KEY));
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
    item.service_name,
    item.service_title,
    item.category?.name,
    item.sub_category?.name,
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
  if (combined.includes("engine") || combined.includes("brake") || combined.includes("oil") || combined.includes("mechanic") || combined.includes("garage") || combined.includes("suspension") || combined.includes("mot")) {
    return "mechanical";
  }
  if (combined.includes("valet") || combined.includes("wash") || combined.includes("detailing") || combined.includes("clean")) {
    return "service";
  }
  return "service";
}

/**
 * Detect if a booking item is car hire / chauffeur / luxury rental
 */
export function isCarBookingItem(item: any): boolean {
  if (!item) return false;
  if (item.car || item.car_id) return true;
  const bType = String(item.booking_type || "").toLowerCase();
  if (bType === "car" || bType === "chauffeur") return true;
  const pType = String(item.pickup_type || "").toLowerCase();
  if (pType === "chauffeur" || pType === "delivery" || pType === "self") return true;
  if (item.drop_time || item.drop_location) return true;
  const sCategory = String(item.car?.service_category || item.category?.name || "").toLowerCase();
  if (sCategory.includes("hire") || sCategory.includes("chauffeur") || sCategory.includes("luxury rental")) return true;
  const notes = String(item.notes || "").toLowerCase();
  if (notes.includes("luxury rental") || notes.includes("car hire") || notes.includes("chauffeur")) return true;
  return false;
}

/**
 * Accurately resolves the human-readable service name for any booking
 */
export function resolveBookingServiceName(item: any): string {
  if (!item) return "Vehicle Service";

  const localIdCandidates = [
    String(item.id || ""),
    String(item.booking_id || ""),
    String(item.readable_id || ""),
    String(item.rawId || ""),
  ].filter(Boolean).map((s) => s.toLowerCase().trim());

  // 1. Check local metadata store (saved during booking in all flows)
  for (const key of localIdCandidates) {
    const meta = getBookingMeta(key);
    if (meta?.serviceTitle && typeof meta.serviceTitle === "string" && meta.serviceTitle.trim().length > 2) {
      return meta.serviceTitle.trim();
    }
  }

  // 2. Check local confirmed bookings
  if (typeof window !== "undefined") {
    try {
      const rawConfirmed = localStorage.getItem("mmc_confirmed_bookings");
      if (rawConfirmed) {
        const list: any[] = JSON.parse(rawConfirmed);
        const match = list.find((b: any) => {
          if (!b) return false;
          const bCandidates = [
            b.id,
            b.rawId,
            b.readableId,
            b.booking_id,
          ].filter(Boolean).map((s) => String(s).toLowerCase().trim());
          return localIdCandidates.some((c) => bCandidates.includes(c));
        });
        if (match?.serviceTitle && typeof match.serviceTitle === "string" && match.serviceTitle.trim().length > 2) {
          return match.serviceTitle.trim();
        }
      }
    } catch {}

    // 3. Check pending session in sessionStorage
    try {
      const rawPending = sessionStorage.getItem("mmc_pending_booking");
      if (rawPending) {
        const p = JSON.parse(rawPending);
        if (p?.service_name || p?.serviceTitle) {
          const pCandidates = [
            p.booking_id,
            p.readable_id,
            p.id,
          ].filter(Boolean).map((s) => String(s).toLowerCase().trim());
          if (localIdCandidates.some((c) => pCandidates.includes(c))) {
            return (p.service_name || p.serviceTitle).trim();
          }
        }
      }
    } catch {}
  }

  // 4. Check backend detail items array (Demandium booking details)
  if (Array.isArray(item.detail) && item.detail.length > 0) {
    const first = item.detail[0];
    const name = first.service_name || first.service?.name;
    if (name && typeof name === "string" && name.trim()) {
      if (first.variant_key && !name.toLowerCase().includes(first.variant_key.toLowerCase())) {
        return `${name.trim()} (${first.variant_key.trim()})`;
      }
      return name.trim();
    }
  }

  // 5. Direct API fields
  const directCandidates = [
    item.service_name,
    item.service?.name,
    item.serviceTitle,
    item.serviceName,
    item.service_title,
    item.sub_category?.name,
    item.sub_category_name,
    item.category?.name,
    item.category_name,
    item.service_description,
    item.damage_description,
  ];
  for (const f of directCandidates) {
    if (f && typeof f === "string" && f.trim().length > 2 && !f.trim().startsWith("{")) {
      const trimmed = f.trim();
      // Skip if it's pure number or registration pattern
      if (!/^\d+$/.test(trimmed) && !/^[A-Z0-9]{5,8}$/i.test(trimmed)) {
        return trimmed;
      }
    }
  }

  // 6. Check tags in special_conditions, notes, damage_description
  const combined = [
    item.special_conditions,
    item.notes,
    item.damage_description,
    item.instructions,
  ].filter(Boolean).join(" ");

  const tagMatch = combined.match(/\[(?:Valet|Service|Package|Mode):\s*([^\]]+)\]/i);
  if (tagMatch && tagMatch[1]) {
    return tagMatch[1].trim();
  }
  if (/full exterior valet/i.test(combined)) return "Full Exterior Valet";
  if (/interior valet/i.test(combined)) return "Full Interior Valet";
  if (/full valet/i.test(combined)) return "Full Valet & Detailing";
  if (/express wash|mini valet/i.test(combined)) return "Express Valet Wash";
  if (/tyre fitting|tire fitting/i.test(combined)) return "Mobile Tyre Fitting";
  if (/puncture repair/i.test(combined)) return "Tyre Puncture Repair";
  if (/roadside|recovery|towing|breakdown/i.test(combined)) return "Emergency Roadside Assistance";
  if (/alloy|wheel refurb|diamond cut/i.test(combined)) return "Alloy Wheel Refurbishment";
  if (/bodywork|scratch|dent|paint/i.test(combined)) return "Bodywork & Paint Repair";
  if (/mechanic|engine|brake|suspension|diagnostic|mot/i.test(combined)) return "Mechanical Repair & Service";
  if (/car hire|rental/i.test(combined)) return "Car Hire & Rental";
  if (/chauffeur/i.test(combined)) return "Chauffeur Service";

  // 7. Category fallback
  const category = detectBookingCategory(item);
  switch (category) {
    case "tyre":
      return "Tyre Fitting & Repair";
    case "emergency":
      return "Emergency Assistance";
    case "mechanical":
      return "Mechanical Repair & Service";
    case "bodywork":
      return "Bodywork & Paint Repair";
    case "alloy":
      return "Alloy Wheel Refurbishment";
    default:
      return "Vehicle Service";
  }
}

/**
 * Normalizes a regular booking into a clean NotificationItem dynamically
 */
function normalizeRegularBookingNotification(item: any, readIds: Set<string>): BookingNotification {
  const readableId = formatToNumericBookingId(item.readable_id || item.id);
  const id = `notif-reg-${readableId}`;
  const category = detectBookingCategory(item);
  const statusRaw = (item.booking_status || "pending").toLowerCase();

  let status: BookingNotification["status"] = "pending";
  if (["completed", "done", "finished"].includes(statusRaw)) status = "completed";
  else if (["accepted", "confirmed"].includes(statusRaw)) status = "accepted";
  else if (["ongoing", "in_progress"].includes(statusRaw)) status = "ongoing";
  else if (["canceled", "cancelled", "rejected"].includes(statusRaw)) status = "canceled";

  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
  const isPaid = item.is_paid === 1 || item.is_paid === true;
  const amount = Number(item.total_booking_amount || item.total_amount || 0);

  const serviceName = resolveBookingServiceName(item);
  const provName = item.provider?.company_name || item.provider_name || "";
  const carModel = item.car_model || "";
  const carReg = item.car_registration_number || "";
  const vehicleText = carModel ? `${carModel}${carReg ? ` (${carReg})` : ""}` : carReg;

  // Title: Always lead with the ACTUAL SERVICE NAME!
  let title = `${serviceName} — #${readableId}`;
  if (status === "accepted") {
    title = `${serviceName} Confirmed! 🛠️`;
  } else if (status === "ongoing") {
    title = `${serviceName} In Progress! 🚗`;
  } else if (status === "completed") {
    title = `${serviceName} Completed! ✅`;
  } else if (status === "canceled") {
    title = `${serviceName} Cancelled ⚠️`;
  } else {
    // Pending
    if (carModel) {
      title = `${serviceName}: ${carModel}`;
    } else {
      title = `${serviceName} — #${readableId}`;
    }
  }

  // Subtitle: Provider, Vehicle details, and reference
  let subtitle = "";
  if (provName && vehicleText) {
    subtitle = `${provName} • ${vehicleText} • Ref #${readableId}`;
  } else if (provName) {
    subtitle = `${provName} • Ref #${readableId}`;
  } else if (vehicleText) {
    subtitle = `${vehicleText} • Ref #${readableId}`;
  } else if (item.notes) {
    subtitle = item.notes;
  } else if (item.damage_description) {
    subtitle = `Issue: ${item.damage_description}`;
  } else {
    subtitle = `Service Ref #${readableId}`;
  }

  // Description / Summary
  const sched = item.service_schedule
    ? item.service_schedule.replace(".000000Z", "").replace("T", " ")
    : "Scheduled Service";
  const paymentText = isPaid ? "Paid" : "Pay later";
  const desc = `${sched} • £${amount} (${paymentText})`;

  return {
    id,
    bookingId: formatToNumericBookingId(item.id || readableId),
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
    vehicleInfo: vehicleText || undefined,
    createdAt: item.created_at || new Date().toISOString(),
    timeAgo: formatTimeAgo(item.created_at || item.service_schedule),
    read: readIds.has(id),
    targetUrl: `/account?tab=bookings&bookingId=${encodeURIComponent(String(readableId))}`,
    raw: item,
  };
}

/**
 * Normalizes a car booking (car hire or chauffeur) into a clean NotificationItem dynamically
 */
function normalizeCarBookingNotification(item: any, readIds: Set<string>): BookingNotification {
  const readableId = formatToNumericBookingId(item.readable_id || item.id || item.booking_id);
  const id = `notif-car-${readableId}`;
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

  const brand = car.brand || item.car_model || "Vehicle";
  const model = car.model ? ` ${car.model}` : "";
  const servicePrefix = isChauffeur ? "Chauffeur" : "Car Hire";

  let title = `${servicePrefix}: ${brand}${model}`.trim();
  if (status === "accepted") {
    title = `${servicePrefix} Confirmed! 🚗`;
  } else if (status === "ongoing") {
    title = `${servicePrefix} Active! 🚗`;
  } else if (status === "completed") {
    title = `${servicePrefix} Completed! ✅`;
  } else if (status === "canceled") {
    title = `${servicePrefix} Cancelled ⚠️`;
  }

  const location = item.pickup_location || item.delivery_address || "";
  const dates = item.start_date
    ? `${item.start_date}${item.end_date && item.end_date !== item.start_date ? ` to ${item.end_date}` : ""}`
    : "Upcoming";
  const schedTime = item.pickup_time ? ` ${item.pickup_time}` : "";
  const paymentText = isPaid ? "Paid" : "Pay later";
  const desc = `${dates}${schedTime}${location ? ` • ${location}` : ""} • £${amount} (${paymentText})`;

  const statusNote = `${statusLabel} • ${isChauffeur ? "Chauffeur Service" : "Luxury Rental"}`;
  const subtitle = readableId ? `${statusNote} • Ref #${readableId}` : statusNote;

  return {
    id,
    bookingId: formatToNumericBookingId(item.booking_id || item.id || readableId),
    readableId,
    bookingType: "car",
    category,
    title,
    subtitle,
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
    targetUrl: `/account?tab=bookings&bookingId=${encodeURIComponent(String(readableId))}`,
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
 * Direct call to GET /customer/notification?limit=10&offset=1
 * curl --location 'https://mmcclub.co.uk/backend/api/v1/customer/notification?limit=10&offset=1' \
 * --header 'Accept: application/json' \
 * --header 'Authorization: Bearer YOUR_CUSTOMER_BEARER_TOKEN'
 */
export async function fetchCustomerBackendNotifications(
  limit: number = 10,
  offset: number = 1
): Promise<{
  data: any[];
  total?: number;
  raw?: any;
}> {
  if (typeof window === "undefined") return { data: [] };
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("mmc_token") ||
    localStorage.getItem("user_token");
  if (!token) return { data: [] };

  try {
    const res = await apiClient.get("/customer/notification", {
      params: { limit, offset },
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000,
    });

    const content = res.data?.content;
    const list =
      content?.data ||
      content?.notifications?.data ||
      content?.notifications ||
      (Array.isArray(content) ? content : []) ||
      res.data?.data ||
      [];

    return {
      data: Array.isArray(list) ? list : [],
      total: Number(content?.total || (Array.isArray(list) ? list.length : 0)),
      raw: res.data,
    };
  } catch (err: any) {
    console.warn("fetchCustomerBackendNotifications warning:", err?.message || err);
    return { data: [] };
  }
}

/**
 * Resolves full notification image URL from various backend attributes
 */
export function resolveNotificationImageUrl(item: any): string | null {
  if (!item) return null;

  let dataObj = item.data;
  if (typeof dataObj === "string") {
    try {
      dataObj = JSON.parse(dataObj);
    } catch {}
  }

  const pickCandidate = (val: any): string | null => {
    if (!val) return null;
    if (typeof val === "string" && val.trim().length > 0) return val.trim();
    if (typeof val === "object") {
      if (Array.isArray(val) && val.length > 0) {
        return pickCandidate(val[0]);
      }
      return val.url || val.path || val.file_url || val.full_url || val.file_path || null;
    }
    return null;
  };

  const rawUrl =
    pickCandidate(item.image_full_path) ||
    pickCandidate(item.cover_image_full_path) ||
    pickCandidate(item.image) ||
    pickCandidate(item.cover_image) ||
    pickCandidate(item.attachment_full_path) ||
    pickCandidate(item.attachment) ||
    pickCandidate(item.attachments) ||
    pickCandidate(item.banner_full_path) ||
    pickCandidate(item.banner) ||
    pickCandidate(item.thumbnail_full_path) ||
    pickCandidate(item.thumbnail) ||
    pickCandidate(item.icon_url) ||
    pickCandidate(item.avatar) ||
    pickCandidate(dataObj?.image_full_path) ||
    pickCandidate(dataObj?.cover_image_full_path) ||
    pickCandidate(dataObj?.image) ||
    pickCandidate(dataObj?.cover_image) ||
    pickCandidate(dataObj?.attachment_full_path) ||
    pickCandidate(dataObj?.attachment) ||
    pickCandidate(dataObj?.attachments) ||
    pickCandidate(dataObj?.file_url) ||
    pickCandidate(dataObj?.file) ||
    pickCandidate(dataObj?.banner) ||
    pickCandidate(dataObj?.photo) ||
    pickCandidate(dataObj?.picture) ||
    pickCandidate(item.raw?.image_full_path) ||
    pickCandidate(item.raw?.image) ||
    null;

  if (!rawUrl || typeof rawUrl !== "string" || rawUrl.trim().length === 0) {
    return null;
  }

  const trimmed = rawUrl.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
    return trimmed;
  }

  const root = "https://mmcclub.co.uk/backend";

  if (trimmed.startsWith("storage/app/public/")) {
    return `${root}/${trimmed}`;
  }
  if (trimmed.startsWith("/storage/app/public/")) {
    return `${root}${trimmed}`;
  }
  if (trimmed.startsWith("storage/")) {
    return `${root}/${trimmed}`;
  }
  if (trimmed.startsWith("/storage/")) {
    return `${root}${trimmed}`;
  }
  if (trimmed.startsWith("notification/")) {
    return `${root}/storage/app/public/${trimmed}`;
  }
  if (trimmed.startsWith("/notification/")) {
    return `${root}/storage/app/public${trimmed}`;
  }
  if (trimmed.startsWith("/")) {
    return `${root}${trimmed}`;
  }

  // If simple filename like "2024-10-16-670fa9b951717.png" or "my-image.jpg"
  if (!trimmed.includes("/")) {
    return `${root}/storage/app/public/notification/${trimmed}`;
  }

  return `${root}/${trimmed}`;
}

/**
 * Parses any fare / pricing breakdown from notification object or payload
 */
export function extractFareBreakdown(item: any): {
  breakdown: { label: string; amount: string }[];
  totalFare?: string;
} {
  const breakdown: { label: string; amount: string }[] = [];
  let totalFare: string | undefined = undefined;

  if (!item) return { breakdown };

  let dataObj = item.data;
  if (typeof dataObj === "string") {
    try {
      dataObj = JSON.parse(dataObj);
    } catch {}
  }

  const source = dataObj && typeof dataObj === "object" ? { ...item, ...dataObj } : item;

  // 1. Array breakdown
  const list = source.breakdown || source.fare_details || source.costs || source.price_breakdown || source.items;
  if (Array.isArray(list)) {
    list.forEach((entry: any) => {
      if (!entry) return;
      const label = entry.label || entry.name || entry.title || entry.service_name || "Service Item";
      const amt = entry.amount || entry.price || entry.fee || entry.cost;
      if (amt !== undefined) {
        breakdown.push({
          label: String(label),
          amount: typeof amt === "number" ? `£${amt.toFixed(2)}` : (String(amt).startsWith("£") ? String(amt) : `£${amt}`),
        });
      }
    });
  }

  // 2. Direct fee fields
  if (source.labour_fee || source.labour_amount || source.labour) {
    const val = source.labour_fee || source.labour_amount || source.labour;
    breakdown.push({ label: "Labour (Tyre Removal, Fitting)", amount: `£${val}` });
  }
  if (source.call_out_fee || source.callout_fee || source.call_out) {
    const val = source.call_out_fee || source.callout_fee || source.call_out;
    breakdown.push({ label: "Call-Out Fee", amount: `£${val}` });
  }

  // Total Fare
  const totalVal = source.fare_amount || source.total_fare || source.total_amount || source.fare || source.amount;
  if (totalVal !== undefined && totalVal !== null && totalVal !== "" && Number(totalVal) > 0) {
    totalFare = typeof totalVal === "number" ? `£${totalVal.toFixed(2)}` : (String(totalVal).startsWith("£") ? String(totalVal) : `£${totalVal}`);
  }

  return { breakdown, totalFare };
}

/**
 * Resolves notification action type, button text, and redirection target
 */
export function resolveNotificationActionType(item: any): {
  actionType: "quote" | "question" | "close" | "booking";
  actionButtonText: string;
  targetUrl: string;
} {
  const title = String(item.title || "").toLowerCase();
  const desc = String(item.description || "").toLowerCase();
  const combined = `${title} ${desc}`;

  // 1. Provider quote / bid offer
  if (
    combined.includes("provider bid") ||
    combined.includes("bid offer") ||
    combined.includes("quotation") ||
    combined.includes("submitted a price") ||
    combined.includes("quote") ||
    combined.includes("bids")
  ) {
    return {
      actionType: "quote",
      actionButtonText: "View Quote Bids",
      targetUrl: "/account?tab=quotes",
    };
  }

  // 2. Question / Customer inquiry
  if (
    combined.includes("question") ||
    combined.includes("inquiry") ||
    combined.includes("enquiry") ||
    combined.includes("message") ||
    combined.includes("ask")
  ) {
    return {
      actionType: "question",
      actionButtonText: "View Question",
      targetUrl: "/account?tab=quotes",
    };
  }

  // 3. Specific Booking reference
  const refMatch = combined.match(/(?:#|ref[:\s]*#?|bookingId=|booking_id=)([a-zA-Z0-9_-]{4,})/i);
  if (refMatch || item.booking_id || item.data?.booking_id) {
    const bookingId = item.booking_id || item.data?.booking_id || (refMatch ? refMatch[1] : null);
    return {
      actionType: "booking",
      actionButtonText: "View Booking",
      targetUrl: `/account?tab=bookings&bookingId=${encodeURIComponent(String(bookingId))}`,
    };
  }

  // 4. Normal push notification / general notice ("YE TO DEKH KR CLOSE KRA DENA")
  return {
    actionType: "close",
    actionButtonText: "Close",
    targetUrl: "",
  };
}

/**
 * Normalizes an official backend customer notification (/customer/notification)
 */
function normalizeBackendCustomerNotification(
  item: any,
  readIds: Set<string>
): BookingNotification {
  const notifId = String(item.id || `api-notif-${Date.now()}`);
  const id = `notif-api-${notifId}`;

  const titleRaw = item.title || "Motor Market Club Update";
  const descRaw = item.description || "";
  const combinedText = `${titleRaw} ${descRaw}`;

  // Extract booking reference if embedded
  const refMatch = combinedText.match(/(?:#|ref[:\s]*#?|bookingId=|booking_id=)([a-zA-Z0-9_-]{4,})/i);
  const detectedRef = refMatch ? refMatch[1] : undefined;

  const rawCandidate = item.readable_id || item.booking_id || item.data?.booking_id || detectedRef;
  const readableId = rawCandidate ? formatToNumericBookingId(rawCandidate) : formatToNumericBookingId(notifId);
  const bookingId = rawCandidate ? formatToNumericBookingId(rawCandidate) : notifId;

  const { actionType, actionButtonText, targetUrl } = resolveNotificationActionType(item);
  const imageUrl = resolveNotificationImageUrl(item);
  const { breakdown, totalFare } = extractFareBreakdown(item);

  // Detect category from text
  const textLower = combinedText.toLowerCase();
  let category: BookingNotification["category"] = "service";
  if (actionType === "quote") {
    category = "quote";
  } else if (textLower.includes("hire") || textLower.includes("rental") || textLower.includes("rent")) {
    category = "car_hire";
  } else if (textLower.includes("chauffeur")) {
    category = "chauffeur";
  } else if (textLower.includes("tyre") || textLower.includes("tire") || textLower.includes("puncture")) {
    category = "tyre";
  } else if (textLower.includes("emergency") || textLower.includes("breakdown") || textLower.includes("recovery")) {
    category = "emergency";
  } else if (textLower.includes("alloy") || textLower.includes("rim")) {
    category = "alloy";
  } else if (textLower.includes("dent") || textLower.includes("bodywork") || textLower.includes("paint") || textLower.includes("scratch")) {
    category = "bodywork";
  } else if (textLower.includes("mechanic") || textLower.includes("brake") || textLower.includes("engine") || textLower.includes("mot") || textLower.includes("oil")) {
    category = "mechanical";
  }

  // Detect status
  let status: BookingNotification["status"] = "pending";
  if (textLower.includes("completed") || textLower.includes("done") || textLower.includes("finished")) {
    status = "completed";
  } else if (textLower.includes("accepted") || textLower.includes("confirmed")) {
    status = "accepted";
  } else if (textLower.includes("ongoing") || textLower.includes("in progress") || textLower.includes("en route") || textLower.includes("dispatched")) {
    status = "ongoing";
  } else if (textLower.includes("canceled") || textLower.includes("cancelled") || textLower.includes("rejected")) {
    status = "canceled";
  }

  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
  const createdAt = item.created_at || new Date().toISOString();

  return {
    id,
    bookingId,
    readableId,
    bookingType: category === "car_hire" || category === "chauffeur" ? "car" : (category === "quote" ? "quote" : "regular"),
    category,
    title: titleRaw,
    subtitle: detectedRef ? `Booking ID: #${readableId} • ${statusLabel}` : (actionType === "quote" ? "Specialist Quote Offer" : undefined),
    description: descRaw,
    status,
    statusLabel,
    totalAmount: Number(item.amount || item.total_amount || 0),
    isPaid: textLower.includes("paid") || Boolean(item.is_paid),
    paymentMethod: item.payment_method || "Online",
    scheduleTime: item.schedule || "Notice",
    createdAt,
    timeAgo: formatTimeAgo(createdAt),
    read: readIds.has(id) || readIds.has(notifId),
    targetUrl: targetUrl || (detectedRef || item.booking_id ? `/account?tab=bookings&bookingId=${encodeURIComponent(String(readableId))}` : ""),
    image: imageUrl,
    actionType,
    actionButtonText,
    fareBreakdown: breakdown,
    totalFare,
    raw: item,
  };
}

let cachedNotifsResult: {
  notifications: BookingNotification[];
  unreadCount: number;
  isLive: boolean;
  isAuthenticated: boolean;
} | null = null;
let lastNotifsFetchTime = 0;
let inFlightNotifsPromise: Promise<{
  notifications: BookingNotification[];
  unreadCount: number;
  isLive: boolean;
  isAuthenticated: boolean;
}> | null = null;

export async function fetchBookingNotifications(forceRefresh = false): Promise<{
  notifications: BookingNotification[];
  unreadCount: number;
  isLive: boolean;
  isAuthenticated: boolean;
}> {
  if (typeof window === "undefined") {
    return { notifications: [], unreadCount: 0, isLive: false, isAuthenticated: false };
  }

  const now = Date.now();
  if (!forceRefresh && cachedNotifsResult && now - lastNotifsFetchTime < 20000) {
    return cachedNotifsResult;
  }

  if (inFlightNotifsPromise) {
    return inFlightNotifsPromise;
  }

  inFlightNotifsPromise = (async () => {
    try {
      const res = await doFetchBookingNotifications();
      cachedNotifsResult = res;
      lastNotifsFetchTime = Date.now();
      return res;
    } catch (globalErr) {
      console.error("fetchBookingNotifications error:", globalErr);
      const isAuth =
        typeof window !== "undefined" &&
        Boolean(
          localStorage.getItem("token") ||
            localStorage.getItem("auth_token") ||
            localStorage.getItem("mmc_token") ||
            localStorage.getItem("user")
        );
      return {
        notifications: [],
        unreadCount: 0,
        isLive: false,
        isAuthenticated: isAuth,
      };
    } finally {
      inFlightNotifsPromise = null;
    }
  })();

  return inFlightNotifsPromise;
}

async function doFetchBookingNotifications(): Promise<{
  notifications: BookingNotification[];
  unreadCount: number;
  isLive: boolean;
  isAuthenticated: boolean;
}> {
  const token =
    (typeof window !== "undefined" &&
      (localStorage.getItem("token") ||
        localStorage.getItem("auth_token") ||
        localStorage.getItem("mmc_token") ||
        localStorage.getItem("user_token") ||
        (localStorage.getItem("user") ? "active_user" : null))) ||
    null;

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

  // Extract current authenticated user identifiers
  const currentUid = getCurrentUserId();
  const userIds = new Set<string>();
  if (currentUid) userIds.add(String(currentUid).toLowerCase().trim());
  try {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u.id) userIds.add(String(u.id).toLowerCase().trim());
      if (u.user_id) userIds.add(String(u.user_id).toLowerCase().trim());
      if (u.customer_id) userIds.add(String(u.customer_id).toLowerCase().trim());
      if (u.uuid) userIds.add(String(u.uuid).toLowerCase().trim());
      if (u.phone) userIds.add(String(u.phone).toLowerCase().trim());
    }
  } catch {}

  const isBookingOwnedByCurrentUser = (item: any): boolean => {
    if (!item) return false;
    if (isFakeDummyId(item.id || item.booking_id || item.readable_id)) return false;
    if (userIds.size === 0) return true;
    const bCustomerIds = [
      item.customer_id,
      item.user_id,
      item.customer?.id,
      item.customer?.user_id,
    ]
      .filter(Boolean)
      .map((x) => String(x).toLowerCase().trim());
    if (bCustomerIds.length > 0) {
      return bCustomerIds.some((cid) => userIds.has(cid));
    }
    return true;
  };

  let rawBackendNotifications: any[] = [];
  let isLive = false;

  // 1. Fetch official backend customer notifications: GET /customer/notification?limit=10&offset=1
  try {
    const backendRes = await fetchCustomerBackendNotifications(10, 1);
    if (backendRes.data && backendRes.data.length > 0) {
      rawBackendNotifications = backendRes.data;
      isLive = true;
    }
  } catch (err: any) {
    console.warn("Backend /customer/notification fetch warning:", err?.message || err);
  }

  // Only use live confirmed bookings from the API

  // Fetch quotes and check for received specialist bids/offers for THIS logged-in user only
  const rawReceivedBids: { bid: any; post: any }[] = [];
  try {
    // Current user's saved quote IDs
    const userSavedQuoteIds = new Set<string>();
    if (typeof window !== "undefined") {
      try {
        const savedIds = JSON.parse(
          localStorage.getItem(getUserStorageKey("saved_quote_post_ids")) ||
          localStorage.getItem("saved_quote_post_ids") ||
          "[]"
        );
        if (Array.isArray(savedIds)) {
          savedIds.forEach((id: string) => {
            if (id) userSavedQuoteIds.add(String(id).trim());
          });
        }
      } catch {}
    }

    const currentUid = getCurrentUserId();
    const userIds = new Set<string>();
    if (currentUid) userIds.add(String(currentUid).toLowerCase().trim());
    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u.id) userIds.add(String(u.id).toLowerCase().trim());
        if (u.user_id) userIds.add(String(u.user_id).toLowerCase().trim());
        if (u.customer_id) userIds.add(String(u.customer_id).toLowerCase().trim());
        if (u.uuid) userIds.add(String(u.uuid).toLowerCase().trim());
        if (u.phone) userIds.add(String(u.phone).toLowerCase().trim());
      }
    } catch {}

    const isPostOwnedByCurrentUser = (p: any): boolean => {
      if (!p) return false;
      const pid = String(p.id || "").trim();
      if (userSavedQuoteIds.has(pid)) return true;
      if (userIds.size === 0) return false;
      const candidates = [
        p.customer_user_id,
        p.customer_id,
        p.user_id,
        p.customer?.id,
        p.customer?.user_id,
        p.customer?.phone,
      ]
        .filter(Boolean)
        .map((x) => String(x).toLowerCase().trim());
      return candidates.some((c) => userIds.has(c));
    };

    const [quoteRes1, quoteRes2] = await Promise.all([
      apiClient.get("/customer/post", {
        params: { limit: 20, offset: 1 },
        headers: { zoneid: "a1614dbe-4732-11ee-9702-dee6e8d77be4" },
        timeout: 8000,
      }).catch(() => null),
      apiClient.get("/customer/post", {
        params: { limit: 20, offset: 1 },
        timeout: 8000,
      }).catch(() => null),
    ]);

    const postMap = new Map<string, any>();
    const processQuoteRes = (res: any) => {
      const quoteData = res?.data?.content?.data || res?.data?.data || res?.data?.content;
      if (Array.isArray(quoteData)) {
        quoteData.forEach((p: any) => {
          if (p && p.id && !postMap.has(p.id) && isPostOwnedByCurrentUser(p)) {
            postMap.set(p.id, p);
          }
        });
      }
    };
    processQuoteRes(quoteRes1);
    processQuoteRes(quoteRes2);

    // Also include saved quote post IDs for this user if not already fetched
    userSavedQuoteIds.forEach((id: string) => {
      if (!postMap.has(id)) {
        postMap.set(id, { id, service_description: "Vehicle Service Request" });
      }
    });

    const rawQuotePosts = Array.from(postMap.values());
    if (rawQuotePosts.length > 0) {
      isLive = true;
    }

    // For active quote posts belonging strictly to this user, fetch actual provider bids
    const postsToCheck = rawQuotePosts.slice(0, 6);
    const bidsResponses = await Promise.all(
      postsToCheck.map((p: any) =>
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

    bidsResponses.forEach(({ post, bids }: { post: any; bids: any[] }) => {
      if (bids.length > 0) {
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

  // 1. Convert official backend notifications from GET /customer/notification?limit=10&offset=1
  rawBackendNotifications.forEach((item) => {
    const notif = normalizeBackendCustomerNotification(item, readIds);
    if (!dismissedIds.has(notif.id) && !dismissedIds.has(String(item.id))) {
      list.push(notif);
    }
  });

  // 2. Convert received specialist bid offers (belonging strictly to this user's requests)
  rawReceivedBids.forEach(({ bid, post }) => {
    const notif = normalizeBidNotification(bid, post, readIds);
    if (!dismissedIds.has(notif.id)) {
      list.push(notif);
    }
  });

  // 2. If backend notifications list is empty, fall back to received bid offers
  if (list.length === 0 && rawReceivedBids.length > 0) {
    rawReceivedBids.forEach(({ bid, post }) => {
      const notif = normalizeBidNotification(bid, post, readIds);
      if (!dismissedIds.has(notif.id)) {
        list.push(notif);
      }
    });
  }

  // Convert custom notifications (deduplicate and keep user-scoped)
  if (typeof window !== "undefined") {
    try {
      const customKey = getUserStorageKey("mmc_custom_notifications");
      const rawCustom = localStorage.getItem(customKey);
      if (rawCustom) {
        let customItems: BookingNotification[] = JSON.parse(rawCustom);
        if (Array.isArray(customItems)) {
          const seenBookingIds = new Set<string>();
          const deduped: BookingNotification[] = [];
          customItems.forEach((c) => {
            const bKey = String(c.bookingId || c.id || "");
            if (isFakeDummyId(bKey)) return;
            // Filter out synthetic local payment notifications as requested by user
            if (
              (c.title && c.title.toLowerCase().includes("payment success")) ||
              (c.title && c.title.toLowerCase().includes("payment received")) ||
              (c.description && c.description.toLowerCase().includes("payment was processed"))
            ) {
              return;
            }
            if (!seenBookingIds.has(bKey)) {
              seenBookingIds.add(bKey);
              deduped.push(c);
            }
          });

          localStorage.setItem(customKey, JSON.stringify(deduped));

          deduped.forEach((c) => {
            if (!dismissedIds.has(c.id)) {
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

  // Strict Global Deduplication: Each booking/quote appears AT MOST ONCE in the list!
  const finalNotifications: BookingNotification[] = [];
  const globalSeenBookingKeys = new Set<string>();

  for (const item of list) {
    const candidateKeys = [
      item.bookingId ? String(item.bookingId).toLowerCase().trim() : "",
      item.readableId ? String(item.readableId).toLowerCase().trim() : "",
    ].filter(Boolean);

    // If any candidate key has already been added, skip duplicate notification for the same booking
    const isDuplicate = candidateKeys.some((k) => globalSeenBookingKeys.has(k));
    if (isDuplicate) {
      continue;
    }

    candidateKeys.forEach((k) => globalSeenBookingKeys.add(k));
    globalSeenBookingKeys.add(String(item.id).toLowerCase().trim());
    finalNotifications.push(item);
  }

  // Fire push notification for newly arrived notifications (strictly at most 1 per booking)
  try {
    const seenPushIds = getSeenPushIds();
    let updatedSeen = false;
    finalNotifications.slice(0, 1).forEach((n) => {
      const canonicalBookingKey = String(n.readableId || n.bookingId || n.id).toLowerCase().trim();
      const pushStorageKey = `booking_push_${canonicalBookingKey}`;
      if (!seenPushIds.has(pushStorageKey) && !seenPushIds.has(n.id)) {
        seenPushIds.add(pushStorageKey);
        seenPushIds.add(n.id);
        updatedSeen = true;
        triggerDevicePushNotification(
          n.title,
          n.subtitle ? `${n.subtitle} • ${n.description}` : n.description,
          n.targetUrl,
          pushStorageKey
        );
      }
    });
    if (updatedSeen) {
      saveSeenPushIds(seenPushIds);
    }
  } catch {}

  // Sort by date newest first
  finalNotifications.sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime() || 0;
    const timeB = new Date(b.createdAt).getTime() || 0;
    return timeB - timeA;
  });

  const unreadCount = finalNotifications.filter((n) => !n.read).length;

  return {
    notifications: finalNotifications,
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
  localStorage.setItem(getUserStorageKey(READ_STORAGE_KEY), JSON.stringify(Array.from(readIds)));
  window.dispatchEvent(new CustomEvent("mmc-notifications-updated"));
}

/**
 * Mark all notifications as read
 */
export function markAllNotificationsAsRead(notifications: BookingNotification[]): void {
  if (typeof window === "undefined") return;
  const readIds = getReadNotificationIds();
  notifications.forEach((n) => readIds.add(n.id));
  localStorage.setItem(getUserStorageKey(READ_STORAGE_KEY), JSON.stringify(Array.from(readIds)));
  window.dispatchEvent(new CustomEvent("mmc-notifications-updated"));
}

/**
 * Dismiss / delete a notification from view
 */
export function dismissNotification(id: string): void {
  if (typeof window === "undefined") return;
  const dismissedIds = getDismissedNotificationIds();
  dismissedIds.add(id);
  localStorage.setItem(getUserStorageKey(DISMISSED_STORAGE_KEY), JSON.stringify(Array.from(dismissedIds)));
  window.dispatchEvent(new CustomEvent("mmc-notifications-updated"));
}

/**
 * Clear all notifications
 */
export function clearAllNotifications(notifications: BookingNotification[]): void {
  if (typeof window === "undefined") return;
  const dismissedIds = getDismissedNotificationIds();
  notifications.forEach((n) => dismissedIds.add(n.id));
  localStorage.setItem(getUserStorageKey(DISMISSED_STORAGE_KEY), JSON.stringify(Array.from(dismissedIds)));
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
    const customKey = getUserStorageKey("mmc_custom_notifications");
    const raw = localStorage.getItem(customKey);
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
    localStorage.setItem(customKey, JSON.stringify(updated));
  } catch (e) {
    console.warn("Could not save custom notification:", e);
  }
}

