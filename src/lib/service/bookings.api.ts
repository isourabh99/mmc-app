import apiClient from "@/lib/http/apiClient";

export type BookingServiceType =
  | "all"
  | "chauffeur"
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
    isPaid?: boolean;
    paymentStatus?: string;
  }
) {
  if (typeof window === "undefined" || !bookingId) return;
  try {
    const existing = JSON.parse(localStorage.getItem("mmc_bookings_metadata") || "{}");
    existing[String(bookingId).toLowerCase().trim()] = meta;
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
    return existing[key] || null;
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

  // Status mapping
  const rawStatus = (raw.booking_status || raw.status || "pending").toLowerCase();
  let status: "pending" | "accepted" | "ongoing" | "completed" | "canceled" = "pending";
  if (["completed", "delivered", "done"].includes(rawStatus)) status = "completed";
  else if (["accepted", "confirmed", "assigned"].includes(rawStatus)) status = "accepted";
  else if (["ongoing", "in_progress", "in-service", "dispatched", "en_route"].includes(rawStatus)) status = "ongoing";
  else if (["canceled", "cancelled", "rejected", "declined"].includes(rawStatus)) status = "canceled";
  else status = "pending";

  const statusDisplay = status.charAt(0).toUpperCase() + status.slice(1);

  // Payment info
  const isPaid = raw.is_paid === 1 || raw.payment_status === "paid" || raw.is_paid === true;
  const paymentStatus = isPaid ? "Paid" : "Pending Payment";
  const paymentMethod = raw.payment_method ? raw.payment_method.replace(/_/g, " ") : "Cash After Service";

  // Total Amount
  const totalAmount = Number(
    raw.total_booking_amount ?? raw.total_amount ?? raw.price ?? raw.service_cost ?? raw.selectedTyrePrice ?? 0
  );

  // Parse Raw Address Object for contact & coordinates
  const rawAddressObj = parseJsonIfString(raw.service_address || raw.service_address_location || raw.delivery_address);

  // Clean Locations
  const serviceAddress =
    extractReadableAddress(raw.service_address) ||
    extractReadableAddress(raw.service_address_location) ||
    extractReadableAddress(raw.delivery_address) ||
    extractReadableAddress(raw.locationAddress) ||
    "";

  const pickupLocation =
    extractReadableAddress(raw.pickup_location) ||
    extractReadableAddress(raw.delivery_address) ||
    serviceAddress ||
    "";

  const destinationLocation = extractReadableAddress(raw.drop_location) || "";
  const postcode =
    raw.postcode ||
    raw.locationPostcode ||
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
    const meta = getBookingMeta(idStr) || getBookingMeta(String(rawId));
    if (meta?.serviceTitle) {
      serviceTitle = meta.serviceTitle;
    }

    // 2. Check detail items array from backend
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

    // 3. Check direct API fields
    if (!serviceTitle) {
      serviceTitle =
        raw.service_name ||
        raw.service?.name ||
        raw.serviceTitle ||
        raw.serviceName ||
        raw.sub_category?.name ||
        raw.category?.name;
    }

    // 4. Extract from special_conditions, notes, damage_description tags
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

    // 5. Provider-based intelligence (e.g. TATA ROHIT is a Valet provider)
    if (!serviceTitle && raw.provider?.company_name) {
      const pName = raw.provider.company_name.toLowerCase();
      if (pName.includes("rohit") || pName.includes("valet") || pName.includes("wash") || pName.includes("detail")) {
        serviceTitle = "Full Exterior Valet";
      }
    }

    // 6. Category-based fallback (Never use generic car model string as service title)
    if (!serviceTitle) {
      serviceTitle = getServiceCategoryLabel(serviceType);
    }

    // Clean Subtitle
    let rawNotesStr = cleanReadableText(raw.notes || raw.instructions || raw.special_conditions);
    if (rawNotesStr.startsWith("[")) {
      rawNotesStr = rawNotesStr.replace(/^\[[^\]]+\]\s*/, "");
    }
    serviceSubtitle = rawNotesStr || (raw.car_registration_number ? `Vehicle: ${raw.car_registration_number}` : "");
    if (!image) {
      image = raw.category?.image_full_path || raw.image || "";
    }
  }

  // Schedule dates
  let scheduleDate = "";
  let scheduleTime = "";
  let scheduleEndDate = "";
  let scheduleEndTime = "";

  if (raw.service_schedule) {
    const parts = String(raw.service_schedule).split(" ");
    scheduleDate = parts[0] || "";
    scheduleTime = parts[1] ? parts[1].slice(0, 5) : "";
  } else if (raw.start_date) {
    scheduleDate = raw.start_date;
    scheduleTime = raw.pickup_time || "";
    scheduleEndDate = raw.end_date || "";
    scheduleEndTime = raw.drop_time || "";
  } else if (raw.scheduledDate) {
    scheduleDate = raw.scheduledDate;
    scheduleTime = raw.scheduledTimeSlot || "";
  } else if (raw.created_at) {
    scheduleDate = String(raw.created_at).split("T")[0] || String(raw.created_at).split(" ")[0];
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
      (typeof rawAddressObj === "object" ? rawAddressObj?.lat || rawAddressObj?.latitude : undefined),
    longitude:
      raw.pickup_coordinates?.longitude ||
      raw.longitude ||
      raw.delivery_longitude ||
      (typeof rawAddressObj === "object" ? rawAddressObj?.lon || rawAddressObj?.longitude : undefined),
  };

  const destinationCoordinates = {
    latitude: raw.drop_coordinates?.latitude,
    longitude: raw.drop_coordinates?.longitude,
  };

  // Vehicle info
  const vehicleReg = raw.car_registration_number || raw.vehicleRegistration || raw.car?.registration_number || raw.vehicleReg;
  const vehicleModel = raw.car_model || raw.vehicleMakeModel || (raw.car ? `${raw.car.brand} ${raw.car.model}` : "");

  // Provider info
  const providerName = raw.provider?.company_name || raw.car?.provider?.company_name;
  const providerPhone = raw.provider?.company_phone || raw.car?.provider?.company_phone;

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

  return {
    id: idStr,
    rawId,
    serviceType,
    serviceCategoryName: getServiceCategoryLabel(serviceType),
    serviceTitle,
    serviceSubtitle,
    image,
    status,
    statusDisplay,
    isPaid,
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

  const queryParams = {
    limit: params.limit || 50,
    offset: params.offset || 1,
    booking_status: params.booking_status || "all",
    service_type: params.service_type || "all",
  };

  // 1. Fetch all general and service bookings
  try {
    const resAll = await apiClient.get("/customer/booking", {
      params: {
        ...queryParams,
        ...(params.booking_type ? { booking_type: params.booking_type } : { booking_type: "all" }),
      },
    });

    const content = resAll.data?.content;

    // A. Extract car_bookings if present in content
    if (content?.car_bookings?.data && Array.isArray(content.car_bookings.data)) {
      content.car_bookings.data.forEach((item: any) => {
        const norm = normalizeBooking(item, "chauffeur");
        unifiedMap.set(norm.id, norm);
      });
    } else if (content?.car_bookings && Array.isArray(content.car_bookings)) {
      content.car_bookings.forEach((item: any) => {
        const norm = normalizeBooking(item, "chauffeur");
        unifiedMap.set(norm.id, norm);
      });
    }

    // B. Extract regular_bookings if present in content
    if (content?.regular_bookings?.data && Array.isArray(content.regular_bookings.data)) {
      content.regular_bookings.data.forEach((item: any) => {
        const norm = normalizeBooking(item);
        unifiedMap.set(norm.id, norm);
      });
    } else if (content?.regular_bookings && Array.isArray(content.regular_bookings)) {
      content.regular_bookings.forEach((item: any) => {
        const norm = normalizeBooking(item);
        unifiedMap.set(norm.id, norm);
      });
    }

    // C. Extract bookings / service bookings if present in content
    if (content?.bookings?.data && Array.isArray(content.bookings.data)) {
      content.bookings.data.forEach((item: any) => {
        const norm = normalizeBooking(item);
        unifiedMap.set(norm.id, norm);
      });
    } else if (content?.bookings && Array.isArray(content.bookings)) {
      content.bookings.forEach((item: any) => {
        const norm = normalizeBooking(item);
        unifiedMap.set(norm.id, norm);
      });
    }

    // D. Extract repeat_bookings if present in content
    if (content?.repeat_bookings?.data && Array.isArray(content.repeat_bookings.data)) {
      content.repeat_bookings.data.forEach((item: any) => {
        const norm = normalizeBooking(item);
        unifiedMap.set(norm.id, norm);
      });
    } else if (content?.repeat_bookings && Array.isArray(content.repeat_bookings)) {
      content.repeat_bookings.forEach((item: any) => {
        const norm = normalizeBooking(item);
        unifiedMap.set(norm.id, norm);
      });
    }

    // E. Extract root data array if present
    if (content?.data && Array.isArray(content.data)) {
      content.data.forEach((item: any) => {
        const norm = normalizeBooking(item);
        unifiedMap.set(norm.id, norm);
      });
    } else if (Array.isArray(content)) {
      content.forEach((item: any) => {
        const norm = normalizeBooking(item);
        unifiedMap.set(norm.id, norm);
      });
    }
  } catch (error) {
    console.warn("Could not fetch /customer/booking (all):", error);
  }

  // 2. Fetch specific car bookings explicitly to ensure 100% complete chauffeur sync
  try {
    const resCar = await apiClient.get("/customer/booking", {
      params: {
        ...queryParams,
        booking_type: "car",
      },
    });

    const contentCar = resCar.data?.content;
    const carList =
      contentCar?.car_bookings?.data ||
      contentCar?.car_bookings ||
      contentCar?.data ||
      (Array.isArray(contentCar) ? contentCar : []);

    if (Array.isArray(carList)) {
      carList.forEach((item: any) => {
        const norm = normalizeBooking(item, "chauffeur");
        unifiedMap.set(norm.id, norm);
      });
    }
  } catch (error) {
    console.warn("Could not fetch /customer/booking (car):", error);
  }

  // 3. Purge all dummy client-side localStorage booking entries so ONLY real backend API bookings are displayed
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("mmc_confirmed_bookings");
      localStorage.removeItem("mmc_tyre_assistance_bookings");
      localStorage.removeItem("mmc_emergency_assistance_bookings");
    } catch (e) {
      console.warn("Error cleaning local dummy bookings:", e);
    }
  }

  // Convert map to array and sort newest first
  const allList = Array.from(unifiedMap.values());
  allList.sort((a, b) => {
    const dateA = new Date(a.createdAt || a.scheduleDate).getTime();
    const dateB = new Date(b.createdAt || b.scheduleDate).getTime();
    return dateB - dateA;
  });

  return allList;
}
