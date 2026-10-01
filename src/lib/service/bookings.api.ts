import apiClient from "@/lib/http/apiClient";

export type BookingServiceType =
  | "all"
  | "chauffeur"
  | "car"
  | "tyre"
  | "emergency"
  | "valet"
  | "bodywork"
  | "alloy"
  | "modification"
  | "mechanical"
  | "service";

export type BookingStatusType =
  | "all"
  | "pending"
  | "accepted"
  | "ongoing"
  | "completed"
  | "canceled";

export interface UnifiedBookingItem {
  id: string;
  rawId: string | number;
  readableId?: string | number;
  serviceType: BookingServiceType;
  serviceCategoryName: string;
  serviceTitle: string;
  serviceSubtitle?: string;
  image?: string;
  status: "pending" | "accepted" | "ongoing" | "completed" | "canceled";
  statusDisplay: string;
  isPaid: boolean;
  isPartiallyPaid: boolean;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  currency: string;
  scheduleDate: string;
  scheduleTime?: string;
  scheduleEndDate?: string;
  scheduleEndTime?: string;
  fullScheduleDisplay: string;
  pickupLocation?: string;
  destinationLocation?: string;
  serviceAddress?: string;
  postcode?: string;
  coordinates?: {
    latitude?: number | string;
    longitude?: number | string;
  };
  destinationCoordinates?: {
    latitude?: number | string;
    longitude?: number | string;
  };
  vehicleReg?: string;
  vehicleModel?: string;
  providerName?: string;
  providerPhone?: string;
  servicemanName?: string;
  servicemanPhone?: string;
  notes?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  createdAt: string;
  raw: any;
}

export interface FetchBookingsParams {
  limit?: number;
  offset?: number;
  booking_status?: string;
  service_type?: string;
  booking_type?: string;
  forceRefresh?: boolean;
}

// Known Category IDs in MMC platform
export const MMC_CATEGORY_IDS = {
  VALET: "812a149b-2ccd-43ef-901a-a665f2ff78ea",
  TYRE: "5d98d5c9-509e-4ab7-859d-806174384e27",
  EMERGENCY: "860791e7-ed6d-46ca-992c-1348dd4c42ad",
};

/**
 * Save booking metadata to browser localStorage for instant 100% accurate synchronization
 */
export function saveBookingMeta(
  bookingId: string | number,
  meta: {
    serviceTitle?: string;
    serviceCategoryName?: string;
    serviceType?: BookingServiceType;
    variant?: string;
    vehicleModel?: string;
    vehicleReg?: string;
    providerName?: string;
    price?: number;
    totalAmount?: number;
    isPaid?: boolean;
    paymentStatus?: string;
    scheduleDate?: string;
    scheduleTime?: string;
  }
) {
  if (typeof window === "undefined" || !bookingId) return;
  try {
    const existing = JSON.parse(localStorage.getItem("mmc_bookings_metadata") || "{}");
    const key = String(bookingId).toLowerCase().trim();
    const prev = existing[key] || {};
    const priceVal =
      meta.price !== undefined
        ? Number(meta.price)
        : meta.totalAmount !== undefined
        ? Number(meta.totalAmount)
        : prev.price;

    existing[key] = {
      ...prev,
      ...meta,
      price: priceVal,
    };
    localStorage.setItem("mmc_bookings_metadata", JSON.stringify(existing));
  } catch (e) {
    console.warn("Could not save booking metadata:", e);
  }
}

/**
 * Retrieve saved booking metadata by ID
 */
export function getBookingMeta(bookingId: string | number) {
  if (typeof window === "undefined" || !bookingId) return null;
  try {
    const existing = JSON.parse(localStorage.getItem("mmc_bookings_metadata") || "{}");
    const key = String(bookingId).toLowerCase().trim();
    if (existing[key]) return existing[key];
    for (const [k, v] of Object.entries(existing)) {
      if (k === key || (key.length >= 6 && (k.includes(key) || key.includes(k)))) {
        return v as any;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if an ID is a fake client-generated dummy timestamp ID (e.g. AW-1790680687259, BW-..., MOD-...)
 */
export function isFakeDummyId(id: any): boolean {
  if (!id) return true;
  const str = String(id).trim();
  if (/^(AW|BW|MOD|MMC|tmp|temp)[-_]\d{8,}/i.test(str)) return true;
  return false;
}

/**
 * Persist a confirmed service booking into local storage so that page refreshes never lose it
 */
export function saveConfirmedBooking(booking: any) {
  if (typeof window === "undefined" || !booking) return;
  const bId = String(booking.id || booking.rawId || booking.booking_id || "").toLowerCase().trim();
  if (!bId || isFakeDummyId(bId)) {
    return; // Never persist fake client-generated dummy IDs
  }
  try {
    const raw = localStorage.getItem("mmc_confirmed_bookings");
    const list: any[] = raw ? JSON.parse(raw) : [];
    const index = list.findIndex(
      (b) => String(b.id || b.rawId || b.booking_id || "").toLowerCase().trim() === bId
    );
    if (index >= 0) {
      list[index] = { ...list[index], ...booking };
    } else {
      list.unshift(booking);
    }
    const cleaned = list.filter((b) => b && !isFakeDummyId(b.id || b.rawId || b.booking_id));
    localStorage.setItem("mmc_confirmed_bookings", JSON.stringify(cleaned.slice(0, 50)));

    // Also auto-sync to mmc_bookings_metadata
    saveBookingMeta(bId, {
      serviceTitle: booking.serviceTitle,
      serviceCategoryName: booking.serviceCategoryName,
      serviceType: booking.serviceType,
      vehicleModel: booking.vehicleModel,
      vehicleReg: booking.vehicleReg,
      providerName: booking.providerName,
      price: Number(booking.totalAmount || booking.price || 0),
      isPaid: booking.isPaid,
      paymentStatus: booking.paymentStatus,
      scheduleDate: booking.scheduleDate,
      scheduleTime: booking.scheduleTime,
    });

    window.dispatchEvent(new CustomEvent("mmc-bookings-updated"));
  } catch (err) {
    console.warn("Could not save confirmed booking locally:", err);
  }
}

/**
 * Helper to detect service type from category, subcategory, detail, provider, or notes
 */
function detectServiceType(item: any): BookingServiceType {
  // Check local metadata store first
  const localId = String(item.id || item.booking_id || item.readable_id || "").toLowerCase().trim();
  if (localId) {
    const meta = getBookingMeta(localId);
    if (meta?.serviceType) return meta.serviceType;
  }

  // 1. Chauffeur detection
  if (item.car || item.car_id || item.car_bookings || item.pickup_type || item.drop_location) {
    return "chauffeur";
  }

  // 2. Category ID matching
  const catId = String(item.category_id || item.sub_category_id || item.category?.id || "");
  if (catId === MMC_CATEGORY_IDS.VALET) return "valet";
  if (catId === MMC_CATEGORY_IDS.TYRE) return "tyre";
  if (catId === MMC_CATEGORY_IDS.EMERGENCY) return "emergency";

  // 3. Provider company name matching (e.g. TATA ROHIT is a Valet provider)
  const provName = String(item.provider?.company_name || item.provider_name || "").toLowerCase();
  if (provName.includes("rohit") || provName.includes("valet") || provName.includes("wash") || provName.includes("detailing")) {
    return "valet";
  }

  // 4. Text scanning across ALL available text fields
  const textToScan = [
    item.category?.name,
    item.sub_category?.name,
    item.special_conditions,
    item.damage_description,
    item.notes,
    item.instructions,
    item.service_location,
    item.booking_type,
    item.service_name,
    item.service_title,
    item.detail?.[0]?.service_name,
    item.detail?.[0]?.service?.name,
    item.detail?.[0]?.variant_key,
    provName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (textToScan.includes("tyre") || textToScan.includes("tire") || textToScan.includes("wheel fitting")) {
    return "tyre";
  }
  if (
    textToScan.includes("emergency") ||
    textToScan.includes("recovery") ||
    textToScan.includes("breakdown") ||
    textToScan.includes("towing") ||
    textToScan.includes("jump start") ||
    textToScan.includes("lockout")
  ) {
    return "emergency";
  }
  if (
    textToScan.includes("valet") ||
    textToScan.includes("wash") ||
    textToScan.includes("detailing") ||
    textToScan.includes("clean") ||
    textToScan.includes("prime") ||
    textToScan.includes("basic")
  ) {
    return "valet";
  }
  if (textToScan.includes("bodywork") || textToScan.includes("dent") || textToScan.includes("paint") || textToScan.includes("scratch")) {
    return "bodywork";
  }
  if (textToScan.includes("alloy") || textToScan.includes("rim") || textToScan.includes("diamond cut") || textToScan.includes("refurb")) {
    return "alloy";
  }
  if (textToScan.includes("mod") || textToScan.includes("remap") || textToScan.includes("tuning") || textToScan.includes("exhaust") || textToScan.includes("wrap")) {
    return "modification";
  }
  if (textToScan.includes("mechanic") || textToScan.includes("engine") || textToScan.includes("brake") || textToScan.includes("suspension") || textToScan.includes("diagnostic")) {
    return "mechanical";
  }

  return "service";
}

/**
 * Get readable category label
 */
export function getServiceCategoryLabel(type: BookingServiceType): string {
  switch (type) {
    case "chauffeur":
      return "Chauffeur Fleet";
    case "tyre":
      return "Tyre Fitting & Repair";
    case "emergency":
      return "Emergency Roadside";
    case "valet":
      return "Valet & Detailing";
    case "bodywork":
      return "Bodywork & Paint";
    case "alloy":
      return "Alloy Wheel Services";
    case "modification":
      return "Modifications & Tuning";
    default:
      return "Vehicle Maintenance";
  }
}

function parseJsonIfString(val: any): any {
  if (!val) return val;
  if (typeof val === "object") return val;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return val;
      }
    }
  }
  return val;
}

export function extractReadableAddress(addr: any): string {
  if (!addr) return "";
  const parsed = parseJsonIfString(addr);

  if (typeof parsed === "string") {
    const trimmed = parsed.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const nested = JSON.parse(trimmed);
        return extractReadableAddress(nested);
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }

  if (typeof parsed === "object" && parsed !== null) {
    const addrStr = parsed.address || parsed.service_address || parsed.street || "";
    const cityStr = parsed.city || "";
    const zipStr = parsed.zip_code || parsed.postcode || parsed.zip || "";
    const countryStr = parsed.country || "";

    const parts = [addrStr, cityStr, zipStr, countryStr].filter(
      (p) => Boolean(p && typeof p === "string" && p.trim().length > 0)
    );

    if (parts.length > 0) {
      return parts.join(", ");
    }

    if (parsed.address_label && typeof parsed.address_label === "string") {
      return parsed.address_label;
    }
    if (parsed.location && typeof parsed.location === "string") {
      return parsed.location;
    }
  }

  return "";
}

export function cleanReadableText(text: any): string {
  if (!text) return "";
  const parsed = parseJsonIfString(text);
  if (typeof parsed === "string") {
    let s = parsed.trim();
    if (s.toLowerCase().startsWith("customer service location:")) {
      s = s.slice("customer service location:".length).trim();
    }
    return s;
  }
  if (typeof parsed === "object" && parsed !== null) {
    if (parsed.address) return extractReadableAddress(parsed);
    if (parsed.notes) return cleanReadableText(parsed.notes);
    if (parsed.description) return cleanReadableText(parsed.description);
    return "";
  }
  return String(text);
}

/**
 * Normalize any API raw booking item into a unified format
 */
export function normalizeBooking(raw: any, fallbackType?: BookingServiceType): UnifiedBookingItem {
  const isChauffeur = Boolean(raw.car || raw.car_id || raw.drop_location || raw.pickup_type);
  const serviceType: BookingServiceType = fallbackType && fallbackType !== "all" ? fallbackType : detectServiceType(raw);

  // ID extraction
  const rawId = raw.booking_id || raw.id || raw.readable_id || `MMC-${Date.now()}`;
  const idStr = String(raw.booking_id || raw.id || raw.readable_id || rawId);

  // Retrieve cached local metadata or confirmed booking records for this item
  const localIdCandidates = [
    idStr,
    String(rawId),
    raw.readable_id ? String(raw.readable_id) : "",
    raw.booking_id ? String(raw.booking_id) : "",
    raw.id ? String(raw.id) : "",
    raw.post_id ? String(raw.post_id) : "",
  ]
    .filter(Boolean)
    .map((s) => s.toLowerCase().trim());

  let meta: any = null;
  let localConfirmed: any = null;
  let pendingSession: any = null;

  if (typeof window !== "undefined") {
    // 1. Check mmc_bookings_metadata
    for (const key of localIdCandidates) {
      const m = getBookingMeta(key);
      if (m) {
        meta = m;
        break;
      }
    }

    // 2. Check mmc_confirmed_bookings
    try {
      const rawConfirmed = localStorage.getItem("mmc_confirmed_bookings");
      if (rawConfirmed) {
        const list: any[] = JSON.parse(rawConfirmed);
        localConfirmed = list.find((b: any) => {
          if (!b) return false;
          const bCandidates = [
            b.id,
            b.rawId,
            b.readableId,
            b.booking_id,
            b.post_id,
          ]
            .filter(Boolean)
            .map((s: any) => String(s).toLowerCase().trim());
          return localIdCandidates.some((c) => bCandidates.includes(c));
        });
      }
    } catch {}

    // 3. Check mmc_pending_booking in sessionStorage
    try {
      const rawPending = sessionStorage.getItem("mmc_pending_booking");
      if (rawPending) {
        const p = JSON.parse(rawPending);
        if (p) {
          const pCandidates = [
            p.booking_id,
            p.readable_id,
            p.id,
            p.post_id,
          ]
            .filter(Boolean)
            .map((s: any) => String(s).toLowerCase().trim());
          if (localIdCandidates.some((c) => pCandidates.includes(c))) {
            pendingSession = p;
          }
        }
      }
    } catch {}
  }

  // Status mapping
  const rawStatus = (raw.booking_status || raw.status || localConfirmed?.status || "pending").toLowerCase();
  let status: "pending" | "accepted" | "ongoing" | "completed" | "canceled" = "pending";
  if (["completed", "delivered", "done"].includes(rawStatus)) status = "completed";
  else if (["accepted", "confirmed", "assigned"].includes(rawStatus)) status = "accepted";
  else if (["ongoing", "in_progress", "in-service", "dispatched", "en_route"].includes(rawStatus)) status = "ongoing";
  else if (["canceled", "cancelled", "rejected", "declined"].includes(rawStatus)) status = "canceled";
  else status = "pending";

  const statusDisplay = status.charAt(0).toUpperCase() + status.slice(1);

  // Payment info — correctly handle partial payments & local confirmed payment flags
  const rawDueAmount = raw.due_amount !== undefined ? Number(raw.due_amount) : undefined;
  const rawPaidAmount = raw.paid_amount !== undefined ? Number(raw.paid_amount) : undefined;

  const hasDueRemaining = rawDueAmount !== undefined && rawDueAmount > 0;

  const isPaid = !hasDueRemaining && Boolean(
    raw.is_paid === 1 ||
    raw.is_paid === "1" ||
    raw.is_paid === true ||
    raw.payment_status === "paid" ||
    meta?.isPaid === true ||
    localConfirmed?.isPaid === true ||
    (rawDueAmount !== undefined && rawDueAmount <= 0 && (rawPaidAmount !== undefined && rawPaidAmount > 0))
  );

  // Detect partial payment
  const isPartiallyPaid = !isPaid && Boolean(
    hasDueRemaining && (
      (rawPaidAmount !== undefined && rawPaidAmount > 0) ||
      raw.is_paid === 1 || raw.is_paid === "1" || raw.is_paid === true ||
      raw.is_partial === 1 || raw.is_partial === "1" ||
      localConfirmed?.isPartiallyPaid
    )
  );

  const paymentStatus = isPaid ? "Paid" : isPartiallyPaid ? "Partially Paid" : "Pending Payment";
  let paymentMethod = "Online (Stripe)";
  if (raw.payment_method || localConfirmed?.paymentMethod) {
    const cleanMethod = String(raw.payment_method || localConfirmed?.paymentMethod).replace(/_/g, " ");
    paymentMethod = /cash/i.test(cleanMethod) ? "Online Payment" : cleanMethod;
  }

  // Calculate detail items sum if detail array exists
  const rawDueSum = Number(raw.paid_amount || 0) + Number(raw.due_amount || 0);
  const detailSum = Array.isArray(raw.detail)
    ? raw.detail.reduce((sum: number, d: any) => {
        const cost = Number(d.total_cost || d.service_cost || 0);
        const qty = Number(d.quantity || 1);
        return sum + (d.total_cost ? cost : cost * qty);
      }, 0)
    : 0;

  // Resolve total amount from all possible candidates with priority
  const rawCandidatePrices = [
    raw.total_booking_amount,
    raw.total_amount,
    raw.booking_amount,
    raw.offered_price,
    raw.bid?.offered_price,
    raw.bids?.[0]?.offered_price,
    raw.post?.bids?.[0]?.offered_price,
    raw.post_bid?.offered_price,
    raw.price,
    raw.service_cost,
    raw.amount,
    raw.selectedTyrePrice,
    rawDueSum > 0 ? rawDueSum : null,
    detailSum > 0 ? detailSum : null,
    meta?.price,
    meta?.totalAmount,
    localConfirmed?.totalAmount,
    localConfirmed?.price,
    pendingSession?.price,
    pendingSession?.deposit_amount,
  ];

  let resolvedPrice = 0;
  for (const p of rawCandidatePrices) {
    if (p !== undefined && p !== null && p !== "") {
      const num = typeof p === "number" ? p : parseFloat(String(p));
      if (!isNaN(num) && num > 0) {
        resolvedPrice = num;
        break;
      }
    }
  }
  const totalAmount = resolvedPrice;

  // Parse Raw Address Object for contact & coordinates
  const rawAddressObj = parseJsonIfString(
    raw.service_address || raw.service_address_location || raw.delivery_address || localConfirmed?.serviceAddress
  );

  // Clean Locations
  const serviceAddress =
    extractReadableAddress(raw.service_address) ||
    extractReadableAddress(raw.service_address_location) ||
    extractReadableAddress(raw.delivery_address) ||
    extractReadableAddress(raw.locationAddress) ||
    localConfirmed?.serviceAddress ||
    "";

  const pickupLocation =
    extractReadableAddress(raw.pickup_location) ||
    extractReadableAddress(raw.delivery_address) ||
    serviceAddress ||
    localConfirmed?.pickupLocation ||
    "";

  const destinationLocation = extractReadableAddress(raw.drop_location) || localConfirmed?.destinationLocation || "";
  const postcode =
    raw.postcode ||
    raw.locationPostcode ||
    localConfirmed?.postcode ||
    (typeof rawAddressObj === "object" ? rawAddressObj?.zip_code || rawAddressObj?.postcode : "") ||
    "";

  // Title and Image
  let serviceTitle = "";
  let serviceSubtitle = "";
  let image = "";

  if (isChauffeur && raw.car) {
    serviceTitle = `${raw.car.brand || "Luxury Chauffeur"} ${raw.car.model || ""}`.trim();
    serviceSubtitle = raw.car.registration_number ? `Reg: ${raw.car.registration_number}` : (raw.car.car_type?.name || " Car");
    image =
      raw.car.image_full_paths?.[0] ||
      (Array.isArray(raw.car.images) && raw.car.images[0]
        ? `https://mmcclub.co.uk/storage/app/public/car/${raw.car.images[0]}`
        : "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80");
  } else {
    // 1. Check local metadata store
    if (meta?.serviceTitle) {
      serviceTitle = meta.serviceTitle;
    }

    // 2. Check local confirmed booking
    if (!serviceTitle && localConfirmed?.serviceTitle) {
      serviceTitle = localConfirmed.serviceTitle;
    }

    // 3. Check pending session
    if (!serviceTitle && (pendingSession?.service_name || pendingSession?.serviceTitle)) {
      serviceTitle = pendingSession.service_name || pendingSession.serviceTitle;
    }

    // 4. Check detail items array from backend
    if (!serviceTitle && raw.detail && Array.isArray(raw.detail) && raw.detail.length > 0) {
      const firstDetail = raw.detail[0];
      const name = firstDetail.service_name || firstDetail.service?.name;
      if (name) {
        serviceTitle = firstDetail.variant_key && !name.toLowerCase().includes(firstDetail.variant_key.toLowerCase())
          ? `${name} (${firstDetail.variant_key})`
          : name;
      }
      image = firstDetail.service?.thumbnail_full_path || firstDetail.service?.cover_image_full_path || "";
    }

    // 5. Check direct API fields
    if (!serviceTitle) {
      serviceTitle =
        raw.service_name ||
        raw.service?.name ||
        raw.serviceTitle ||
        raw.serviceName ||
        raw.post?.service_description ||
        raw.post?.damage_description ||
        raw.service_description ||
        raw.damage_description ||
        raw.sub_category?.name ||
        raw.category?.name;
    }

    // 6. Extract from special_conditions, notes, damage_description tags
    if (!serviceTitle) {
      const combinedText = [
        raw.special_conditions,
        raw.notes,
        raw.damage_description,
        raw.instructions,
      ]
        .filter(Boolean)
        .join(" ");

      const tagMatch = combinedText.match(/\[(?:Valet|Service|Package):\s*([^\]]+)\]/i);
      if (tagMatch && tagMatch[1]) {
        serviceTitle = tagMatch[1].trim();
      } else if (/full exterior valet/i.test(combinedText)) {
        serviceTitle = "Full Exterior Valet";
      } else if (/interior valet/i.test(combinedText)) {
        serviceTitle = "Full Interior Valet";
      } else if (/full valet/i.test(combinedText)) {
        serviceTitle = "Full Valet & Detailing";
      } else if (/express wash|mini valet/i.test(combinedText)) {
        serviceTitle = "Express Valet Wash";
      } else if (/tyre fitting|tire fitting/i.test(combinedText)) {
        serviceTitle = "Mobile Tyre Fitting";
      } else if (/puncture repair/i.test(combinedText)) {
        serviceTitle = "Tyre Puncture Repair";
      } else if (/roadside|recovery|towing/i.test(combinedText)) {
        serviceTitle = "Emergency Roadside Assistance";
      } else if (/alloy/i.test(combinedText)) {
        serviceTitle = "Alloy Wheel Refurbishment";
      } else if (/bodywork|scratch|dent|paint/i.test(combinedText)) {
        serviceTitle = "Bodywork & Paint Repair";
      }
    }

    // 7. Provider-based intelligence
    if (!serviceTitle && raw.provider?.company_name) {
      const pName = raw.provider.company_name.toLowerCase();
      if (pName.includes("rohit") || pName.includes("valet") || pName.includes("wash") || pName.includes("detail")) {
        serviceTitle = "Full Exterior Valet";
      }
    }

    // 8. Category-based fallback
    if (!serviceTitle) {
      serviceTitle = getServiceCategoryLabel(serviceType);
    }

    // Clean Subtitle
    let rawNotesStr = cleanReadableText(raw.notes || raw.instructions || raw.special_conditions || localConfirmed?.notes);
    if (rawNotesStr.startsWith("[")) {
      rawNotesStr = rawNotesStr.replace(/^\[[^\]]+\]\s*/, "");
    }
    serviceSubtitle = rawNotesStr || (raw.car_registration_number ? `Vehicle: ${raw.car_registration_number}` : "");
    if (!image) {
      image = raw.category?.image_full_path || raw.image || localConfirmed?.image || "";
    }
  }

  // Schedule dates
  let scheduleDate = "";
  let scheduleTime = "";
  let scheduleEndDate = "";
  let scheduleEndTime = "";

  if (raw.service_schedule && String(raw.service_schedule).toLowerCase() !== "null") {
    const parts = String(raw.service_schedule).split(" ");
    scheduleDate = parts[0] || "";
    scheduleTime = parts[1] ? parts[1].slice(0, 5) : "";
  } else if (raw.start_date && String(raw.start_date).toLowerCase() !== "null") {
    scheduleDate = raw.start_date;
    scheduleTime = raw.pickup_time || "";
    scheduleEndDate = raw.end_date || "";
    scheduleEndTime = raw.drop_time || "";
  } else if (raw.scheduledDate) {
    scheduleDate = raw.scheduledDate;
    scheduleTime = raw.scheduledTimeSlot || "";
  } else if (meta?.scheduleDate || localConfirmed?.scheduleDate) {
    scheduleDate = meta?.scheduleDate || localConfirmed?.scheduleDate;
    scheduleTime = meta?.scheduleTime || localConfirmed?.scheduleTime || "";
  } else if (pendingSession?.schedule) {
    const parts = String(pendingSession.schedule).split(" ");
    scheduleDate = parts[0] || "";
    scheduleTime = parts[1] ? parts[1].slice(0, 5) : "";
  } else if (raw.created_at || raw.createdAt) {
    scheduleDate = String(raw.created_at || raw.createdAt).split("T")[0] || String(raw.created_at || raw.createdAt).split(" ")[0];
  }

  const fullScheduleDisplay = scheduleEndDate && scheduleEndDate !== scheduleDate
    ? `${scheduleDate} (${scheduleTime}) to ${scheduleEndDate} (${scheduleEndTime})`
    : `${scheduleDate}${scheduleTime ? ` at ${scheduleTime}` : ""}`;

  // Coordinates
  const coordinates = {
    latitude:
      raw.pickup_coordinates?.latitude ||
      raw.latitude ||
      raw.delivery_latitude ||
      localConfirmed?.coordinates?.latitude ||
      (typeof rawAddressObj === "object" ? rawAddressObj?.lat || rawAddressObj?.latitude : undefined),
    longitude:
      raw.pickup_coordinates?.longitude ||
      raw.longitude ||
      raw.delivery_longitude ||
      localConfirmed?.coordinates?.longitude ||
      (typeof rawAddressObj === "object" ? rawAddressObj?.lon || rawAddressObj?.longitude : undefined),
  };

  const destinationCoordinates = {
    latitude: raw.drop_coordinates?.latitude || localConfirmed?.destinationCoordinates?.latitude,
    longitude: raw.drop_coordinates?.longitude || localConfirmed?.destinationCoordinates?.longitude,
  };

  // Vehicle info
  const vehicleReg = raw.car_registration_number || raw.vehicleRegistration || raw.car?.registration_number || raw.vehicleReg || meta?.vehicleReg || localConfirmed?.vehicleReg;
  const vehicleModel = raw.car_model || raw.vehicleMakeModel || (raw.car ? `${raw.car.brand} ${raw.car.model}` : "") || meta?.vehicleModel || localConfirmed?.vehicleModel;

  // Provider info
  const providerName = raw.provider?.company_name || raw.car?.provider?.company_name || meta?.providerName || localConfirmed?.providerName || pendingSession?.provider?.company_name;
  const providerPhone = raw.provider?.company_phone || raw.car?.provider?.company_phone || localConfirmed?.providerPhone || pendingSession?.provider?.company_phone;

  // Serviceman
  const servicemanName = raw.serviceman?.user
    ? `${raw.serviceman.user.first_name || ""} ${raw.serviceman.user.last_name || ""}`.trim()
    : undefined;
  const servicemanPhone = raw.serviceman?.user?.phone;

  // Items detail
  const items: Array<{ name: string; quantity: number; price: number }> = [];
  if (Array.isArray(raw.detail)) {
    raw.detail.forEach((d: any) => {
      items.push({
        name: d.service_name || d.service?.name || "Item",
        quantity: Number(d.quantity || 1),
        price: Number(d.service_cost || d.total_cost || 0),
      });
    });
  }

  // Compute canonical paid / due amounts to expose on the item
  let computedPaidAmount = 0;
  let computedDueAmount = 0;
  if (isPaid) {
    computedPaidAmount = totalAmount;
    computedDueAmount = 0;
  } else if (rawDueAmount !== undefined && rawDueAmount >= 0) {
    computedDueAmount = rawDueAmount;
    computedPaidAmount = Math.max(0, totalAmount - rawDueAmount);
  } else if (rawPaidAmount !== undefined && rawPaidAmount > 0) {
    computedPaidAmount = rawPaidAmount;
    computedDueAmount = Math.max(0, totalAmount - rawPaidAmount);
  } else if (raw.is_partial === 1 || raw.is_partial === "1") {
    computedPaidAmount = totalAmount * 0.25;
    computedDueAmount = totalAmount * 0.75;
  } else if (!isPaid) {
    computedDueAmount = totalAmount;
    computedPaidAmount = 0;
  }

  return {
    id: idStr,
    rawId,
    readableId: raw.readable_id || raw.booking_id || rawId,
    serviceType,
    serviceCategoryName: getServiceCategoryLabel(serviceType),
    serviceTitle,
    serviceSubtitle,
    image,
    status,
    statusDisplay,
    isPaid,
    isPartiallyPaid,
    paidAmount: computedPaidAmount,
    dueAmount: computedDueAmount,
    paymentStatus,
    paymentMethod,
    totalAmount,
    currency: "£",
    scheduleDate,
    scheduleTime,
    scheduleEndDate,
    scheduleEndTime,
    fullScheduleDisplay,
    pickupLocation,
    destinationLocation,
    serviceAddress,
    postcode,
    coordinates,
    destinationCoordinates,
    vehicleReg,
    vehicleModel,
    providerName,
    providerPhone,
    servicemanName,
    servicemanPhone,
    notes: cleanReadableText(raw.notes || raw.instructions),
    items,
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    raw,
  };
}

/**
 * Fetch All Customer Bookings Across the Entire Platform
 * 1. Queries GET /customer/booking with booking_type=all
 * 2. Queries GET /customer/booking with booking_type=car
 * 3. Reads local assistance records if stored in browser
 * 4. Merges, normalizes, deduplicates and sorts
 */
export async function fetchAllCustomerBookings(
  params: FetchBookingsParams = {}
): Promise<UnifiedBookingItem[]> {
  const unifiedMap = new Map<string, UnifiedBookingItem>();

  const baseParams = {
    limit: params.limit || 50,
    offset: params.offset || 1,
    service_type: params.service_type || "all",
  };

  /**
   * Extracts a flat array of booking objects from any API response content shape
   */
  function extractBookingsFromContent(content: any): any[] {
    if (!content) return [];

    const results: any[] = [];

    // Shape 1: content.data = [...]
    if (content.data && Array.isArray(content.data)) {
      results.push(...content.data);
    }

    // Shape 2: content.regular_bookings.data = [...]
    if (content.regular_bookings?.data && Array.isArray(content.regular_bookings.data)) {
      results.push(...content.regular_bookings.data);
    } else if (content.regular_bookings && Array.isArray(content.regular_bookings)) {
      results.push(...content.regular_bookings);
    }

    // Shape 3: content.bookings.data = [...]
    if (content.bookings?.data && Array.isArray(content.bookings.data)) {
      results.push(...content.bookings.data);
    } else if (content.bookings && Array.isArray(content.bookings)) {
      results.push(...content.bookings);
    }

    // Shape 4: content.car_bookings.data = [...]
    if (content.car_bookings?.data && Array.isArray(content.car_bookings.data)) {
      results.push(...content.car_bookings.data);
    } else if (content.car_bookings && Array.isArray(content.car_bookings)) {
      results.push(...content.car_bookings);
    }

    // Shape 5: content itself is an array
    if (Array.isArray(content) && results.length === 0) {
      results.push(...content);
    }

    return results;
  }

  /**
   * Add a raw booking item to the unified map (avoids duplicates    */
  function addToMap(item: any, hintType?: BookingServiceType) {
    if (!item) return;
    const norm = normalizeBooking(item, hintType);
    const key = norm.id.toLowerCase().trim();

    if (unifiedMap.has(key)) {
      const existing = unifiedMap.get(key)!;
      // Merge best fields: never lose price or title if current is better
      const bestAmount = norm.totalAmount > 0 ? norm.totalAmount : existing.totalAmount;
      const bestTitle =
        norm.serviceTitle && norm.serviceTitle !== "Specialist Vehicle Service"
          ? norm.serviceTitle
          : existing.serviceTitle;
      const bestPaid = norm.isPaid || existing.isPaid;
      const bestProvider = norm.providerName || existing.providerName;
      const bestSchedule = norm.scheduleDate || existing.scheduleDate;

      unifiedMap.set(key, {
        ...existing,
        ...norm,
        totalAmount: bestAmount,
        serviceTitle: bestTitle,
        isPaid: bestPaid,
        providerName: bestProvider,
        scheduleDate: bestSchedule,
        paidAmount: bestPaid ? bestAmount : norm.paidAmount > 0 ? norm.paidAmount : existing.paidAmount,
      });
    } else {
      unifiedMap.set(key, norm);
    }
  }

  // Strategy 1: Single call with booking_status=all (most efficient, avoids 429)
  let gotResults = false;
  try {
    const res = await apiClient.get("/customer/booking", {
      params: { ...baseParams, booking_status: "all" },
    });
    const content = res.data?.content;
    const items = extractBookingsFromContent(content);
    console.log(`[Bookings] booking_status=all: found ${items.length} items`);
    items.forEach((item) => addToMap(item));
    if (items.length > 0) gotResults = true;
  } catch (err: any) {
    console.warn("[Bookings] booking_status=all failed:", err?.response?.status || err?.message);
  }

  // Strategy 2: If "all" returned nothing, try individual statuses as fallback
  if (!gotResults) {
    const statuses = ["accepted", "pending", "ongoing", "completed", "canceled"];
    for (const status of statuses) {
      try {
        const res = await apiClient.get("/customer/booking", {
          params: { ...baseParams, booking_status: status },
        });
        const content = res.data?.content;
        const items = extractBookingsFromContent(content);
        console.log(`[Bookings] status=${status}: found ${items.length} items`);
        items.forEach((item) => addToMap(item));
      } catch (err: any) {
        console.warn(`[Bookings] status=${status} fetch failed:`, err?.response?.status || err?.message);
        if (err?.response?.status === 429) {
          console.warn("[Bookings] Rate limited, stopping individual status fetches");
          break;
        }
      }
    }
  }

  // Also try car bookings (chauffeur)
  try {
    const resCar = await apiClient.get("/customer/booking", {
      params: { ...baseParams, booking_type: "car" },
    });
    const carItems = extractBookingsFromContent(resCar.data?.content);
    console.log(`[Bookings] car bookings: found ${carItems.length} items`);
    carItems.forEach((item) => addToMap(item, "chauffeur"));
  } catch (err: any) {
    console.warn("[Bookings] car fetch failed:", err?.response?.status || err?.message);
  }

  // Read locally saved bookings to merge or backfill any missing items
  if (typeof window !== "undefined") {
    try {
      const localRaw = localStorage.getItem("mmc_confirmed_bookings");
      if (localRaw) {
        const localList: any[] = JSON.parse(localRaw);
        localList.forEach((b: any) => {
          const bId = String(b.id || b.rawId || "").trim();
          if (bId && !isFakeDummyId(bId)) {
            addToMap({ ...b, ...(b.raw || {}) });
          }
        });
      }
    } catch (e) {
      console.warn("[Bookings] Could not read local bookings:", e);
    }

    try {
      const pendingRaw = sessionStorage.getItem("mmc_pending_booking");
      if (pendingRaw) {
        const pending = JSON.parse(pendingRaw);
        const pId = String(pending.booking_id || pending.readable_id || "").trim();
        if (pId && !isFakeDummyId(pId)) {
          addToMap(pending);
        }
      }
    } catch {}
  }

  // Sort: newest first
  const allList = Array.from(unifiedMap.values());
  allList.sort((a, b) => {
    const dateA = new Date(a.createdAt || a.scheduleDate || 0).getTime();
    const dateB = new Date(b.createdAt || b.scheduleDate || 0).getTime();
    return dateB - dateA;
  });

  console.log("[Bookings] Total unique bookings:", allList.length, allList.map(b => `${b.id}(${b.status}, £${b.totalAmount})`));
  return allList;
}