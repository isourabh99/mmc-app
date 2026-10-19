import apiClient, { getBackendRootUrl } from "@/lib/http/apiClient";
import { ensureServiceAddressJson, extractPostcode } from "@/lib/service/address.helper";
import { saveConfirmedBooking, saveBookingMeta } from "@/lib/service/bookings.api";
import {
  TyreAssistanceBooking,
  TyreCategory,
  AssistanceType,
  ServiceLocationType,
  TyreProvider,
  QuoteSummary,
  calculateQuote,
} from "@/lib/data/tyre-assistance.data";

const STORAGE_KEY = "mmc_tyre_assistance_bookings";
const ACTIVE_BOOKING_KEY = "mmc_active_tyre_booking_id";
const ZONE_KEY = "zoneId";

// Default IDs
export const TYRE_CATEGORY_ID = "5d98d5c9-509e-4ab7-859d-806174384e27";
export const TYRE_EMERGENCY_SERVICE_ID = "1e5455a9-62f8-4489-bfa8-4eb52d033a7d";
export const TYRE_REPLACEMENT_SERVICE_ID = "9913c6e3-1f99-4929-989c-25484da50e00";
export const DEFAULT_SERVICE_ID = TYRE_REPLACEMENT_SERVICE_ID;
export const DEFAULT_PROVIDER_ID = "cffcce91-5498-4b73-b571-8e6e69bbd89d";
export const DEFAULT_ZONE_ID = "a1614dbe-4732-11ee-9702-dee6e8d77be4";

export const isUuid = (str: any): boolean =>
  typeof str === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());

export interface TyreEmergencyVariation {
  id: number;
  variant: string;
  variant_key: "puncture" | "burst-tyre" | string;
  price: number;
  description?: string;
}

export const TYRE_EMERGENCY_VARIATIONS: TyreEmergencyVariation[] = [];

/**
 * Fetch Tyre Emergency Variations dynamically from Category API
 */
export async function fetchTyreEmergencyVariations(): Promise<TyreEmergencyVariation[]> {
  try {
    const services = await fetchTyreCategoryServices(TYRE_CATEGORY_ID);
    const emergencyService =
      services.find(
        (s) =>
          s.id === TYRE_EMERGENCY_SERVICE_ID ||
          s.name?.toLowerCase().includes("emergency")
      ) || services[0];

    if (!emergencyService) return [];

    const variations: TyreEmergencyVariation[] = [];

    if (Array.isArray(emergencyService.variations) && emergencyService.variations.length > 0) {
      emergencyService.variations.forEach((v: any, idx: number) => {
        variations.push({
          id: v.id ?? idx + 1,
          variant: v.variant || v.variant_name || v.variant_key || "Standard",
          variant_key: v.variant_key || v.variant || `variant-${idx}`,
          price: Number(v.price) || Number(v.admin_price) || 0,
          description: v.short_description || v.description || "",
        });
      });
    } else if (
      Array.isArray(emergencyService.variations_app_format?.zone_wise_variations) &&
      emergencyService.variations_app_format.zone_wise_variations.length > 0
    ) {
      emergencyService.variations_app_format.zone_wise_variations.forEach((v: any, idx: number) => {
        variations.push({
          id: idx + 1,
          variant: v.variant_name || v.variant_key || "Standard",
          variant_key: v.variant_key || `variant-${idx}`,
          price: Number(v.price) || Number(v.admin_price) || 0,
          description: "",
        });
      });
    }

    return variations;
  } catch (err) {
    console.warn("fetchTyreEmergencyVariations error:", err);
    return [];
  }
}

export const getOrCreateGuestId = (): string => {
  if (typeof window === "undefined") return "a6013221-b529-4113-b60b-bac64dd6b7d7";
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u?.id) return String(u.id);
    }
  } catch { }

  const storedUserId = localStorage.getItem("user_id") || localStorage.getItem("userId");
  if (storedUserId) return storedUserId;

  let gid = localStorage.getItem("guest_id");
  if (!gid) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      gid = crypto.randomUUID();
    } else {
      gid = "a6013221-b529-4113-b60b-bac64dd6b7d7";
    }
    localStorage.setItem("guest_id", gid);
  }
  return gid;
};

/**
 * Backend Dynamic Tyre Item Interface
 */
export interface BackendTyreItem {
  id: string;
  provider_id: string;
  category_id: string;
  service_id: string;
  brand: string;
  model: string;
  size: string;
  price: number;
  stock: number;
  width?: string;
  profile?: string;
  rim_size?: string;
  tyre_type?: string;
  season?: string;
  vehicle_type?: string;
  images: string[];
  image_full_paths: string[];
  provider?: {
    id: string;
    company_name: string;
    company_phone: string;
    company_address: string;
    company_email: string;
    logo_full_path?: string;
    avg_rating?: number;
    rating_count?: number;
    coordinates?: { latitude: string; longitude: string };
  };
  [key: string]: any;
}

let cachedCategoryServices: Record<string, { data: any[]; timestamp: number }> = {};

export async function fetchTyreCategoryServices(
  categoryId: string = TYRE_CATEGORY_ID
): Promise<any[]> {
  const zoneId =
    (typeof window !== "undefined" && localStorage.getItem(ZONE_KEY)) ||
    DEFAULT_ZONE_ID;

  const cacheKey = `${categoryId}_${zoneId}`;
  if (
    cachedCategoryServices[cacheKey] &&
    Date.now() - cachedCategoryServices[cacheKey].timestamp < 300000
  ) {
    return cachedCategoryServices[cacheKey].data;
  }

  // 1. Direct Category Services Request with current zone
  try {
    const response = await apiClient.get(
      `/customer/service/category/${categoryId}`,
      {
        params: { limit: 50, offset: 1 },
        headers: { zoneid: zoneId, zoneId },
      }
    );

    const data = response.data?.content?.data || (Array.isArray(response.data?.content) ? response.data.content : null);
    if (Array.isArray(data) && data.length > 0) {
      cachedCategoryServices[cacheKey] = { data, timestamp: Date.now() };
      return data;
    }
  } catch (error) {
    console.warn("fetchTyreCategoryServices direct error:", error);
  }

  // 2. Direct Category Request with DEFAULT_ZONE_ID
  if (zoneId !== DEFAULT_ZONE_ID) {
    try {
      const response = await apiClient.get(
        `/customer/service/category/${categoryId}`,
        {
          params: { limit: 50, offset: 1 },
          headers: { zoneid: DEFAULT_ZONE_ID, zoneId: DEFAULT_ZONE_ID },
        }
      );

      const data = response.data?.content?.data || (Array.isArray(response.data?.content) ? response.data.content : null);
      if (Array.isArray(data) && data.length > 0) {
        cachedCategoryServices[cacheKey] = { data, timestamp: Date.now() };
        return data;
      }
    } catch (e) {
      console.warn("fetchTyreCategoryServices default zone error:", e);
    }
  }

  // 3. Dynamic Category Discovery across /customer/category
  try {
    const catRes = await apiClient.get<{ content?: { data?: { id: string; name: string }[] } }>(
      "/customer/category",
      {
        params: { limit: 50, offset: 1 },
        headers: { zoneid: zoneId },
      }
    );

    const categories = catRes.data?.content?.data || [];
    const matchedCategory = categories.find((c) => {
      const n = (c.name || "").toLowerCase();
      return n.includes("tyre") || n.includes("tire") || n.includes("wheel") || n.includes("emergency");
    });

    if (matchedCategory?.id) {
      const fallbackRes = await apiClient.get(
        `/customer/service/category/${matchedCategory.id}`,
        {
          params: { limit: 50, offset: 1 },
          headers: { zoneid: zoneId },
        }
      );
      const data = fallbackRes.data?.content?.data || (Array.isArray(fallbackRes.data?.content) ? fallbackRes.data.content : null);
      if (Array.isArray(data) && data.length > 0) {
        cachedCategoryServices[cacheKey] = { data, timestamp: Date.now() };
        return data;
      }
    }
  } catch (discoveryErr) {
    console.warn("Dynamic tyre category discovery error:", discoveryErr);
  }

  return [];
}

/**
 * Dynamic Provider Search for Tyre Emergency & Replacement Services:
 * POST /customer/provider/search-by-service
 */
export async function searchTyreProviders(
  params:
    | {
      service_id?: string;
      serviceIds?: string[];
      answers?: string[];
      car_registration_number?: string;
      damage_description?: string;
      latitude?: number | string;
      longitude?: number | string;
    }
    | string[] = [TYRE_EMERGENCY_SERVICE_ID],
  latitude: number | string = "51.5074",
  longitude: number | string = "-0.1278"
): Promise<any[]> {
  const zoneId =
    (typeof window !== "undefined" && localStorage.getItem(ZONE_KEY)) ||
    DEFAULT_ZONE_ID;

  try {
    let postBody: Record<string, any>;

    if (Array.isArray(params)) {
      postBody = {
        service_id: params[0] || TYRE_EMERGENCY_SERVICE_ID,
        answers: ["Mobile Tyre Service"],
        car_registration_number: "UK22-XYZ-9999",
        damage_description: "Tyre assistance requested",
      };
    } else {
      postBody = {
        service_id: params.service_id || (params.serviceIds && params.serviceIds[0]) || TYRE_EMERGENCY_SERVICE_ID,
        answers: params.answers && params.answers.length > 0 ? params.answers : ["Mobile Tyre Service"],
        car_registration_number: params.car_registration_number || "UK22-XYZ-9999",
        damage_description: params.damage_description || "Emergency roadside tyre repair required",
      };
    }

    const res = await apiClient.post("/customer/provider/search-by-service", postBody, {
      headers: {
        zoneid: zoneId,
        "zone-id": zoneId,
        ZoneId: zoneId,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const data = res.data?.content?.data || res.data?.content || res.data?.data;
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn("searchTyreProviders notice:", err);
  }
  return [];
}

/**
 * Fetch Customer Cart List
 * GET /customer/cart/list?limit=10&offset=1&guest_id=...
 */
export async function fetchCartList(guestIdParam?: string): Promise<any> {
  const zoneId =
    (typeof window !== "undefined" && localStorage.getItem(ZONE_KEY)) ||
    DEFAULT_ZONE_ID;
  const guestId = guestIdParam || getOrCreateGuestId();

  try {
    const res = await apiClient.get("/customer/cart/list", {
      params: { limit: 10, offset: 1, guest_id: guestId },
      headers: {
        zoneid: zoneId,
        "zone-id": zoneId,
        ZoneId: zoneId,
        Accept: "application/json",
      },
    });
    return res.data?.content || res.data;
  } catch (error) {
    console.warn("fetchCartList notice:", error);
    return null;
  }
}

/**
 * Fetch Provider Details by ID:
 * GET /customer/provider-details?id={id}&limit=1&offset=1
 */
export async function fetchProviderDetails(
  providerId: string,
  limit: number = 1,
  offset: number = 1
): Promise<any | null> {
  const zoneId =
    (typeof window !== "undefined" && localStorage.getItem(ZONE_KEY)) ||
    DEFAULT_ZONE_ID;

  try {
    const res = await apiClient.get("/customer/provider-details", {
      params: { id: providerId, limit, offset },
      headers: {
        zoneid: zoneId,
        "zone-id": zoneId,
        ZoneId: zoneId,
      },
    });
    return res.data?.content?.provider || res.data?.content || null;
  } catch (err) {
    console.warn("fetchProviderDetails notice:", err);
    return null;
  }
}

/**
 * Backend Dynamic Question Interface
 */
export interface ProviderQuestion {
  id: string;
  provider_id: string | null;
  category_id: string;
  question_text: string;
  options: string | null;
  question_type: "select" | "text" | "number" | "file";
  is_required: boolean;
  is_active: boolean;
  display_order: number;
}

/**
 * Step 1: Customer GPS se Zone ID Nikalna
 * GET /customer/config/get-zone-id?lat=51.5074&lng=-0.1278
 */
export async function getZoneIdFromCoordinates(
  lat: number = 51.5074,
  lng: number = -0.1278
): Promise<string> {
  try {
    const response = await apiClient.get(
      `/customer/config/get-zone-id?lat=${lat}&lng=${lng}`
    );

    const zoneData = response.data?.content?.zone || response.data?.content || response.data?.zone || response.data;
    let zoneId = "";

    if (typeof zoneData === "string") {
      zoneId = zoneData;
    } else if (zoneData?.id) {
      zoneId = zoneData.id;
    } else if (zoneData?.zone_id) {
      zoneId = zoneData.zone_id;
    } else if (Array.isArray(zoneData) && zoneData[0]?.id) {
      zoneId = zoneData[0].id;
    }

    if (zoneId) {
      if (typeof window !== "undefined") {
        localStorage.setItem(ZONE_KEY, zoneId);
        localStorage.setItem("zone_id", zoneId);
      }
      return zoneId;
    }
  } catch (error) {
    console.warn("Backend get-zone-id call failed, using default zone:", error);
  }

  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(ZONE_KEY) || localStorage.getItem("zone_id");
    if (cached) return cached;
    localStorage.setItem(ZONE_KEY, DEFAULT_ZONE_ID);
  }
  return DEFAULT_ZONE_ID;
}

/**
 * Fetch Dynamic Tyres List from Backend
 * GET /customer/tyre/list?limit=50&offset=1
 */
export async function fetchDynamicTyres(
  limit: number = 50,
  offset: number = 1
): Promise<BackendTyreItem[]> {
  const zoneId =
    (typeof window !== "undefined" && localStorage.getItem(ZONE_KEY)) ||
    DEFAULT_ZONE_ID;

  try {
    const response = await apiClient.get("/customer/tyre/list", {
      params: { limit, offset },
      headers: { zoneId, zoneid: zoneId },
    });

    const data =
      response.data?.content?.data ||
      (Array.isArray(response.data?.content) ? response.data?.content : null) ||
      (Array.isArray(response.data?.data) ? response.data?.data : null);
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (error) {
    console.warn("fetchDynamicTyres failed:", error);
  }
  return [];
}

/**
 * Fetch Tyre Details by ID from Backend
 * GET /customer/tyre/details/:id
 */
export async function fetchTyreDetails(tyreId: string): Promise<BackendTyreItem | null> {
  const zoneId =
    (typeof window !== "undefined" && localStorage.getItem(ZONE_KEY)) ||
    DEFAULT_ZONE_ID;

  try {
    const response = await apiClient.get(`/customer/tyre/details/${tyreId}`, {
      headers: { zoneId, zoneid: zoneId, Accept: "application/json" },
    });

    const content = response.data?.content || response.data?.data || response.data;
    if (content && typeof content === "object") {
      return content;
    }
  } catch (error) {
    console.warn("fetchTyreDetails failed:", error);
  }
  return null;
}

/**
 * Fetch Dynamic Booking Questions for Tyre Assistance Category
 * GET /customer/booking/provider/questions?provider_id=...&category_id=5d98d5c9-509e-4ab7-859d-806174384e27
 */
export async function fetchProviderQuestions(
  providerId: string = "cffcce91-5498-4b73-b571-8e6e69bbd89d",
  categoryId: string = TYRE_CATEGORY_ID
): Promise<ProviderQuestion[]> {
  const zoneId =
    (typeof window !== "undefined" && localStorage.getItem(ZONE_KEY)) ||
    DEFAULT_ZONE_ID;

  try {
    const response = await apiClient.get("/customer/booking/provider/questions", {
      params: { provider_id: providerId, category_id: categoryId },
      headers: { zoneId, zoneid: zoneId },
    });

    const content = response.data?.content;
    if (Array.isArray(content) && content.length > 0) {
      return content.filter((q) => q.is_active);
    }
  } catch (error) {
    console.warn("fetchProviderQuestions failed:", error);
  }
  return [];
}

/**
 * Fetch Customer Saved Addresses
 * GET /customer/address?limit=10&offset=1
 */
export interface CustomerAddress {
  id: number | string;
  user_id?: string;
  lat: string | number;
  lon: string | number;
  city: string;
  address: string;
  address_type: string;
  address_label: string;
  contact_person_name?: string;
  contact_person_number?: string;
}

export interface ProviderSlot {
  id: string;
  provider_id?: string;
  day_of_week?: string;
  start_time: string;
  end_time?: string;
  is_active?: boolean;
  max_bookings?: number;
  title?: string;
  is_available?: boolean;
  [key: string]: any;
}

/**
 * Fetch available booking slots dynamically from Provider Slots API:
 * GET /customer/booking/provider/slots?provider_id={provider_id}&date={date}
 */
export async function fetchProviderSlots(
  providerId: string = DEFAULT_PROVIDER_ID,
  date?: string
): Promise<ProviderSlot[]> {
  const zoneId =
    (typeof window !== "undefined" && localStorage.getItem(ZONE_KEY)) ||
    DEFAULT_ZONE_ID;

  let effectiveDate = date;
  if (!effectiveDate || effectiveDate.toLowerCase() === "today") {
    effectiveDate = new Date().toISOString().split("T")[0];
  } else if (effectiveDate.toLowerCase() === "tomorrow") {
    const tom = new Date(Date.now() + 86400000);
    effectiveDate = tom.toISOString().split("T")[0];
  }

  try {
    const response = await apiClient.get("/customer/booking/provider/slots", {
      params: {
        provider_id: providerId || DEFAULT_PROVIDER_ID,
        date: effectiveDate,
      },
      headers: {
        zoneId,
        zoneid: zoneId,
        Accept: "application/json",
      },
    });

    const rawData = response.data?.content || response.data?.data || response.data;
    const mapSlot = (s: any, idx: number): ProviderSlot => {
      const startTime = s.start_time || s.start || s.from || s.time || "";
      const endTime = s.end_time || s.end || s.to || "";
      let title = s.title || s.name || s.slot || "";
      if (!title && startTime) {
        title = endTime ? `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}` : startTime.slice(0, 5);
      }
      return {
        id: String(s.id || s.slot_id || `slot-${idx}`),
        provider_id: s.provider_id || providerId,
        day_of_week: s.day_of_week || "",
        start_time: startTime,
        end_time: endTime,
        is_active: s.is_active !== false,
        max_bookings: s.max_bookings,
        title: title || `Slot ${idx + 1}`,
        is_available:
          s.is_available !== false &&
          s.available !== false &&
          s.is_booked !== 1 &&
          s.is_booked !== true,
      };
    };

    if (Array.isArray(rawData)) {
      return rawData.map(mapSlot);
    } else if (rawData && typeof rawData === "object") {
      const list = rawData.slots || rawData.data || [];
      if (Array.isArray(list)) {
        return list.map(mapSlot);
      }
    }
    return [];
  } catch (error) {
    console.warn("fetchProviderSlots error:", error);
    return [];
  }
}

export async function getCustomerAddresses(): Promise<CustomerAddress[]> {
  try {
    const response = await apiClient.get("/customer/address", {
      params: { limit: 10, offset: 1 },
    });
    const content = response.data?.content;
    if (Array.isArray(content)) return content;
    if (content?.data && Array.isArray(content.data)) return content.data;
    return [];
  } catch (error) {
    console.warn("Could not fetch customer addresses:", error);
    return [];
  }
}

export async function getEffectiveCustomerAddressId(): Promise<string> {
  try {
    const addresses = await getCustomerAddresses();
    if (Array.isArray(addresses) && addresses.length > 0 && addresses[0]?.id) {
      return String(addresses[0].id);
    }
  } catch { }
  return "9";
}

/**
 * Create Customer Address
 * POST /customer/address
 */
export async function createCustomerAddress(data: {
  lat: number;
  lon: number;
  city: string;
  address: string;
  address_type?: string;
  address_label?: string;
  contact_person_name?: string;
  contact_person_number?: string;
}): Promise<CustomerAddress | null> {
  try {
    const formData = new FormData();
    formData.append("lat", String(data.lat));
    formData.append("lon", String(data.lon));
    formData.append("city", data.city || "London");
    formData.append("address", data.address);
    formData.append("address_type", data.address_type || "service");
    formData.append("address_label", data.address_label || "Home");
    if (data.contact_person_name) {
      formData.append("contact_person_name", data.contact_person_name);
    }
    if (data.contact_person_number) {
      formData.append("contact_person_number", data.contact_person_number);
    }

    const response = await apiClient.post("/customer/address", formData);
    return response.data?.content || null;
  } catch (error) {
    console.warn("Failed to create customer address:", error);
    return null;
  }
}

/**
 * Add Tyre Service to Cart
 * POST /customer/cart/add
 */
export function formatValidServiceSchedule(
  dateStr?: string,
  timeSlot?: string
): string {
  const now = new Date();
  let d = new Date();

  if (!dateStr || dateStr.toLowerCase() === "today") {
    d = now;
  } else if (dateStr.toLowerCase() === "tomorrow") {
    d = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  } else {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      d = parsed;
    } else {
      d = now;
    }
  }

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  let time = "10:00:00";
  if (timeSlot) {
    if (timeSlot.includes("Immediate") || timeSlot.includes("ASAP")) {
      const future = new Date(now.getTime() + 60 * 60 * 1000);
      const hh = String(future.getHours()).padStart(2, "0");
      const min = String(future.getMinutes()).padStart(2, "0");
      time = `${hh}:${min}:00`;
    } else {
      const match = timeSlot.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
      if (match) {
        const hh = match[1].padStart(2, "0");
        const min = match[2];
        const sec = match[3] || "00";
        time = `${hh}:${min}:${sec}`;
      } else if (timeSlot.includes("08:00")) {
        time = "09:00:00";
      } else if (timeSlot.includes("12:00")) {
        time = "13:00:00";
      } else if (timeSlot.includes("16:00")) {
        time = "17:00:00";
      }
    }
  }

  return `${yyyy}-${mm}-${dd} ${time}`;
}

export async function addTyreToCart(payload: {
  provider_id?: string;
  service_id?: string;
  category_id?: string;
  variant_key?: string;
  tyre_id?: string;
  quantity?: number;
  is_terms_accepted?: number;
  guest_id?: string;
  zone_id?: string;
}): Promise<any> {
  const zoneId =
    payload.zone_id ||
    (typeof window !== "undefined" &&
      (localStorage.getItem("zone_id") ||
        localStorage.getItem("zoneid") ||
        localStorage.getItem("zoneId") ||
        localStorage.getItem(ZONE_KEY))) ||
    DEFAULT_ZONE_ID;

  const guestId = payload.guest_id || getOrCreateGuestId();

  const effectiveProviderId = isUuid(payload.provider_id)
    ? payload.provider_id!
    : DEFAULT_PROVIDER_ID;

  try {
    let serviceId = payload.service_id;
    let variantKey = payload.variant_key;

    if (!payload.tyre_id) {
      try {
        const services = await fetchTyreCategoryServices(payload.category_id || TYRE_CATEGORY_ID);
        if (Array.isArray(services) && services.length > 0) {
          const found = services.find((s) => s.id === serviceId) || services[0];
          if (found?.id) {
            serviceId = found.id;
          }
          if (Array.isArray(found?.variations) && found.variations.length > 0) {
            const matchedVar = variantKey
              ? found.variations.find((v: any) => v.variant_key === variantKey || v.variant === variantKey)
              : found.variations[0];
            variantKey = (matchedVar || found.variations[0])?.variant_key || (matchedVar || found.variations[0])?.variant;
          } else if (
            Array.isArray(found?.variations_app_format?.zone_wise_variations) &&
            found.variations_app_format.zone_wise_variations.length > 0
          ) {
            variantKey = found.variations_app_format.zone_wise_variations[0]?.variant_key;
          }
        }
      } catch { }
    } else {
      if (!serviceId) {
        serviceId = TYRE_REPLACEMENT_SERVICE_ID;
      }
    }

    const hasAuthToken =
      typeof window !== "undefined" &&
      Boolean(
        localStorage.getItem("token") ||
        localStorage.getItem("mmc_token") ||
        localStorage.getItem("user_token") ||
        localStorage.getItem("auth_token") ||
        document.cookie.includes("token=")
      );

    const postBody: Record<string, any> = payload.tyre_id
      ? {
        ...(hasAuthToken ? {} : { guest_id: guestId }),
        service_id: serviceId || "9913c6e3-1f99-4929-989c-25484da50e00",
        tyre_id: payload.tyre_id,
        quantity: payload.quantity || 1,
        provider_id: effectiveProviderId,
        category_id: payload.category_id || TYRE_CATEGORY_ID,
        is_terms_accepted: 1,
      }
      : {
        ...(hasAuthToken ? {} : { guest_id: guestId }),
        provider_id: effectiveProviderId,
        service_id: serviceId || DEFAULT_SERVICE_ID,
        category_id: payload.category_id || TYRE_CATEGORY_ID,
        quantity: payload.quantity || 1,
        variant_key: variantKey || "standard",
        is_terms_accepted: 1,
      };

    console.log("[TyreBooking] POST /customer/cart/add body:", postBody);

    const response = await apiClient.post("/customer/cart/add", postBody, {
      headers: {
        zoneid: zoneId,
        "zone-id": zoneId,
        ZoneId: zoneId,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    console.log("[TyreBooking] POST /customer/cart/add response:", response.data);
    return response.data;
  } catch (error: any) {
    console.warn("cart/add call note:", error?.response?.data || error?.message);
    return null;
  }
}

/**
 * Send Booking Request to Backend
 * POST /customer/booking/request/send
 */
export interface SendBookingRequestPayload {
  guest_id?: string;
  provider_id?: string;
  post_id?: string;
  payment_method?: string;
  zone_id?: string;
  service_schedule?: string;
  service_address_id?: string | number;
  service_address?: string;
  service_location?: "customer" | "provider" | string;
  booking_type?: string;
  selected_slot_id?: string;
  car_registration_number?: string;
  car_model?: string;
  car_manufacture_year?: string;
  car_color?: string;
  notes?: string;
  postcode?: string;
  house?: string;
  floor?: string;
  street?: string;
  city?: string;
  guest_id?: string;
  latitude?: number | string;
  longitude?: number | string;
  is_partial?: number | boolean | string;
  amount?: number | string;
  paid_amount?: number | string;
  due_amount?: number | string;
  total_cost?: number | string;
  payment_platform?: string;
  callback?: string;
  service_id?: string;
  category_id?: string;
}

export async function sendBookingRequestToBackend(
  payload: SendBookingRequestPayload
): Promise<any> {
  const zoneId =
    payload.zone_id ||
    (typeof window !== "undefined" &&
      (localStorage.getItem("zone_id") ||
        localStorage.getItem("zoneid") ||
        localStorage.getItem("zoneId") ||
        localStorage.getItem(ZONE_KEY))) ||
    DEFAULT_ZONE_ID;

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fallbackSchedule = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
    now.getHours()
  )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const callbackUrl =
    payload.callback ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/booking-success`
      : "https://mmcclub.co.uk/booking-success");

  const isPartialNum = payload.is_partial !== undefined ? Number(payload.is_partial) : 0;

  const rawAddr = payload.service_address || (typeof window !== "undefined" ? localStorage.getItem("service_address_json") || localStorage.getItem("service_address") || localStorage.getItem("user_address") : null) || "";
  const cleanPostcode = (payload.postcode || (typeof window !== "undefined" ? localStorage.getItem("user_postcode") || localStorage.getItem("postcode") : null) || extractPostcode(rawAddr)).trim();
  const effectiveHouse = payload.house || (typeof window !== "undefined" ? localStorage.getItem("user_house") || localStorage.getItem("house") : null) || "";
  const effectiveFloor = payload.floor || (typeof window !== "undefined" ? localStorage.getItem("user_floor") || localStorage.getItem("floor") : null) || "";
  const effectiveStreet = (payload.street || (typeof window !== "undefined" ? localStorage.getItem("user_street") || localStorage.getItem("street") : null) || "").trim();
  const effectiveCity = (payload.city || (typeof window !== "undefined" ? localStorage.getItem("user_city") || localStorage.getItem("city") : null) || "").trim();

  const postData: Record<string, any> = {
    payment_method: payload.payment_method || "stripe",
    is_partial: isPartialNum,
    zone_id: zoneId,
    service_schedule: payload.service_schedule || fallbackSchedule,
    service_location: payload.service_location || "customer",
    service_address: ensureServiceAddressJson(rawAddr, {
      lat: payload.latitude,
      lon: payload.longitude,
      address: rawAddr,
      zip_code: cleanPostcode,
      house: effectiveHouse,
      floor: effectiveFloor,
      street: effectiveStreet,
      city: effectiveCity,
    }),
    postcode: cleanPostcode,
    ...(effectiveHouse ? { house: effectiveHouse } : {}),
    ...(effectiveFloor ? { floor: effectiveFloor } : {}),
    ...(effectiveStreet ? { street: effectiveStreet } : {}),
    ...(effectiveCity ? { city: effectiveCity } : {}),
    booking_type: payload.booking_type || "emergency",
    car_registration_number: (payload.car_registration_number || "UK22-XYZ-9999").trim().toUpperCase(),
    car_model: payload.car_model || "Honda Civic",
    notes: payload.notes || "Tyre assistance requested with online payment.",
    callback: callbackUrl,
  };

  if (payload.guest_id) {
    postData.guest_id = payload.guest_id;
  }

  console.log("[TyreBooking] POST /customer/booking/request/send JSON body:", postData);

  try {
    const res = await apiClient.post("/customer/booking/request/send", postData, {
      headers: {
        zoneid: zoneId,
        "zone-id": zoneId,
        ZoneId: zoneId,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    console.log("[TyreBooking] POST /customer/booking/request/send response:", res.data);
    return res.data;
  } catch (err: any) {
    console.warn("booking/request/send JSON attempt error:", err?.response?.data || err?.message);
    if (err?.response?.data) return err.response.data;
    return null;
  }
}

export interface SendTyreBookingPayload {
  category?: "emergency" | "replacement" | string;
  service_id?: string;
  category_id?: string;
  provider_id?: string;
  variant_key?: string;
  tyre_id?: string;
  quantity?: number;
  payment_method?: string;
  is_partial?: number | boolean | string;
  amount?: number | string;
  total_cost?: number | string;
  zone_id?: string;
  service_schedule?: string;
  service_address_id?: string;
  service_address?: string;
  service_location?: string;
  booking_type?: string;
  selected_slot_id?: string;
  car_registration_number?: string;
  car_model?: string;
  postcode?: string;
  house?: string;
  floor?: string;
  street?: string;
  city?: string;
  latitude?: string | number;
  longitude?: string | number;
  callback?: string;
  guest_id?: string;
}

/**
 * Unified Tyre Booking Dispatch matching Mechanical flow
 * 1. Add tyre to cart (POST /customer/cart/add)
 * 2. Send booking request (POST /customer/booking/request/send)
 * 3. Extract booking ID and Stripe payment redirect URL
 * 4. Fallback to direct Stripe checkout URL if not returned
 * 5. Direct window.location.href redirect to Stripe secure checkout
 */
export async function sendTyreBookingRequest(
  payload: SendTyreBookingPayload
): Promise<any> {
  const zoneId =
    payload.zone_id ||
    (typeof window !== "undefined" &&
      (localStorage.getItem("zone_id") ||
        localStorage.getItem("zoneid") ||
        localStorage.getItem("zoneId") ||
        localStorage.getItem(ZONE_KEY))) ||
    DEFAULT_ZONE_ID;

  const guestId = payload.guest_id || getOrCreateGuestId();
  const effectiveProviderId =
    payload.provider_id && isUuid(payload.provider_id)
      ? payload.provider_id
      : DEFAULT_PROVIDER_ID;

  const isEmergency = payload.category === "emergency" || payload.booking_type === "emergency";
  const serviceId =
    payload.service_id ||
    (isEmergency ? TYRE_EMERGENCY_SERVICE_ID : TYRE_REPLACEMENT_SERVICE_ID);
  const categoryId = payload.category_id || TYRE_CATEGORY_ID;

  // STEP 1: Add to cart first (exactly matches mechanical & valet flow)
  try {
    await addTyreToCart({
      guest_id: guestId,
      provider_id: effectiveProviderId,
      service_id: serviceId,
      category_id: categoryId,
      variant_key: payload.variant_key,
      tyre_id: payload.tyre_id,
      quantity: payload.quantity || 1,
      is_terms_accepted: 1,
      zone_id: zoneId,
    });
  } catch (cartErr) {
    console.warn("addTyreToCart before booking request:", cartErr);
  }

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fallbackSchedule = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
    now.getHours()
  )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const defaultSuccessCallback =
    typeof window !== "undefined"
      ? `${window.location.origin}/booking-success`
      : "https://mmcclub.co.uk/booking-success";
  const callbackUrl = payload.callback || defaultSuccessCallback;

  const isPartialNum =
    payload.is_partial !== undefined
      ? Number(payload.is_partial) === 1
        ? 1
        : 0
      : 1;

  const effectiveStreet = (payload.street || (typeof window !== "undefined" ? localStorage.getItem("user_street") || localStorage.getItem("street") : null) || "").trim();
  const effectiveCity = (payload.city || (typeof window !== "undefined" ? localStorage.getItem("user_city") || localStorage.getItem("city") : null) || "").trim();

  // STEP 2: Send booking request (POST /customer/booking/request/send)
  const res = await sendBookingRequestToBackend({
    guest_id: guestId,
    provider_id: effectiveProviderId,
    payment_method: payload.payment_method || "stripe",
    is_partial: isPartialNum,
    payment_platform: "app",
    zone_id: zoneId,
    service_schedule: payload.service_schedule || fallbackSchedule,
    service_address: ensureServiceAddressJson(
      payload.service_address || (typeof window !== "undefined" ? localStorage.getItem("user_address") : null) || "",
      {
        lat: payload.latitude,
        lon: payload.longitude,
        address: payload.service_address,
        zip_code: payload.postcode,
        house: payload.house,
        floor: payload.floor,
        street: effectiveStreet,
        city: effectiveCity,
      }
    ),
    service_location: payload.service_location || "customer",
    booking_type: isEmergency ? "emergency" : "normal",
    selected_slot_id: payload.selected_slot_id,
    callback: callbackUrl,
    car_registration_number: (payload.car_registration_number || "UK22-XYZ-9999").trim().toUpperCase(),
    car_model: payload.car_model || "Vehicle",
    notes: payload.notes || "Tyre assistance requested with online payment.",
    postcode: payload.postcode || (typeof window !== "undefined" ? localStorage.getItem("user_postcode") : null) || extractPostcode(payload.service_address || ""),
    house: payload.house,
    floor: payload.floor,
    street: effectiveStreet,
    city: effectiveCity,
    latitude: payload.latitude || "51.5074",
    longitude: payload.longitude || "-0.1278",
    amount: payload.amount,
    total_cost: payload.total_cost ?? payload.amount,
    service_id: serviceId,
    category_id: categoryId,
  });

  // STEP 3: Extract booking ID and redirect_link matching Mechanical logic
  const content: any = res?.content || res?.data?.content || res?.data;
  const rawBookingId = content?.booking_id || res?.booking_id;
  const bId =
    (Array.isArray(rawBookingId) && rawBookingId.length > 0 ? rawBookingId[0] : null) ||
    (typeof rawBookingId === "string" || typeof rawBookingId === "number" ? String(rawBookingId) : null) ||
    content?.readable_id ||
    content?.id ||
    content?.payment_id ||
    res?.readable_id ||
    res?.id ||
    null;

  if (bId && typeof window !== "undefined") {
    localStorage.setItem("last_tyre_booking_id", String(bId));
  }

  let redirectUrl =
    content?.url ||
    content?.redirect_link ||
    content?.redirect_url ||
    content?.payment_url ||
    content?.link ||
    content?.payment_link ||
    res?.url ||
    res?.redirect_link ||
    res?.redirect_url ||
    (typeof content === "string" && content.startsWith("http") ? content : null);

  // STEP 4: Switch payment method or direct Stripe URL fallback if no direct URL returned
  if (!redirectUrl && bId && !String(bId).startsWith("MMC-TYR-")) {
    const payloadsToTry = [
      {
        booking_id: String(bId),
        payment_method: "stripe",
        is_partial: isPartialNum,
        payment_platform: "app",
        callback: callbackUrl,
      },
      {
        booking_id: String(bId),
        payment_method: "stripe",
        is_partial: isPartialNum,
        payment_platform: "web",
        callback: callbackUrl,
      },
    ];

    for (const p of payloadsToTry) {
      if (redirectUrl) break;
      try {
        console.log("[TyrePayment] Requesting switch-payment-method:", p);
        const switchRes = await apiClient.post("/customer/booking/switch-payment-method", p);
        const sRaw = switchRes?.data?.content || switchRes?.data || {};
        if (typeof sRaw === "string" && sRaw.startsWith("http")) {
          redirectUrl = sRaw;
          break;
        }
        const candidate =
          sRaw?.redirect_url ||
          sRaw?.redirect_link ||
          sRaw?.payment_url ||
          sRaw?.url ||
          sRaw?.link ||
          sRaw?.stripe_url;
        if (candidate && typeof candidate === "string" && candidate.startsWith("http")) {
          redirectUrl = candidate;
          break;
        }
      } catch (swErr) {
        console.warn("[TyrePayment] switch-payment-method notice:", swErr);
      }
    }
  }


  // Clean up redirect link
  if (redirectUrl && typeof redirectUrl === "string") {
    redirectUrl = redirectUrl.replace(/\\\//g, "/");
    if (!redirectUrl.startsWith("http")) {
      redirectUrl = `${getBackendRootUrl()}${redirectUrl.startsWith("/") ? "" : "/"}${redirectUrl}`;
    }
    if (!redirectUrl.includes("callback=")) {
      const sep = redirectUrl.includes("?") ? "&" : "?";
      redirectUrl = `${redirectUrl}${sep}callback=${encodeURIComponent(callbackUrl)}`;
    }
    if (!redirectUrl.includes("is_partial=")) {
      redirectUrl = `${redirectUrl}&is_partial=${isPartialNum}`;
    }
  }

  // STEP 5: Direct Window Redirect to Stripe (Exact Mechanical behavior)
  if (
    typeof window !== "undefined" &&
    redirectUrl &&
    typeof redirectUrl === "string" &&
    redirectUrl.startsWith("http") &&
    !redirectUrl.includes("payment_id=MMC-")
  ) {
    console.log("[TyreBooking] Redirecting directly to Stripe secure checkout:", redirectUrl);
    window.location.href = redirectUrl;
  }

  return {
    ...res,
    booking_id: bId,
    redirect_link: redirectUrl,
    redirect_url: redirectUrl,
    url: redirectUrl,
  };
}

// ==========================================
// STATE MANAGEMENT & FULL DYNAMIC WORKFLOW
// ==========================================

export function getStoredBookings(): TyreAssistanceBooking[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Error reading stored bookings:", err);
    return [];
  }
}

export function saveBookings(bookings: TyreAssistanceBooking[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch (err) {
    console.error("Error saving bookings:", err);
  }
}

export function getBookingById(id: string): TyreAssistanceBooking | null {
  const bookings = getStoredBookings();
  return bookings.find((b) => b.id === id || b.referenceNumber === id) || null;
}

export function getActiveBooking(): TyreAssistanceBooking | null {
  if (typeof window === "undefined") return null;
  const activeId = localStorage.getItem(ACTIVE_BOOKING_KEY);
  if (!activeId) return null;
  return getBookingById(activeId);
}

export function setActiveBookingId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) {
    localStorage.setItem(ACTIVE_BOOKING_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_BOOKING_KEY);
  }
}

export interface CreateAssistanceRequestParams {
  category: TyreCategory;
  assistanceType: AssistanceType;
  serviceLocationType: ServiceLocationType;
  scheduledDate: string;
  scheduledTimeSlot: string;
  selectedSlotId?: string;
  locationAddress: string;
  locationPostcode?: string;
  house?: string;
  floor?: string;
  street?: string;
  city?: string;
  serviceAddress?: string;
  latitude?: number;
  longitude?: number;
  vehicleMakeModel: string;
  vehicleRegistration: string;
  variantKey?: string; // "puncture" or "burst-tyre" for Emergency
  serviceId?: string;
  tyreSize?: string;
  tyreQuantity?: number;
  selectedTyreId?: string;
  selectedTyrePrice?: number;
  selectedTyreBrand?: string;
  selectedTyreModel?: string;
  situation?: string;
  notes?: string;
  acceptedPrivacy: boolean;
  providerId?: string;
}

export async function createAssistanceRequest(
  params: CreateAssistanceRequestParams
): Promise<TyreAssistanceBooking> {
  const lat = params.latitude || 51.5074;
  const lng = params.longitude || -0.1278;

  // 1. Get real Zone ID from GPS
  const zoneId = await getZoneIdFromCoordinates(lat, lng);

  // 2. Fetch provider via search-by-service for emergency or dynamic tyres for replacement
  const isEmergency = params.category === "emergency";
  let provider: TyreProvider;
  let matchedTyre: BackendTyreItem | undefined;

  if (isEmergency) {
    let searchProv: any = null;
    try {
      const foundProviders = await searchTyreProviders({
        service_id: TYRE_EMERGENCY_SERVICE_ID,
        answers: ["Mobile Tyre Service"],
        car_registration_number: params.vehicleRegistration || "UK22-XYZ-9999",
        damage_description: params.situation || "Tyre punctured on motorway, need urgent puncture repair",
        latitude: lat,
        longitude: lng,
      });
      if (Array.isArray(foundProviders) && foundProviders.length > 0) {
        searchProv = foundProviders[0];
      }
    } catch (searchErr) {
      console.warn("Emergency provider search notice:", searchErr);
    }

    if (searchProv) {
      provider = {
        id: isUuid(searchProv.id) ? searchProv.id : DEFAULT_PROVIDER_ID,
        name: searchProv.company_name || "Certified Roadside Provider",
        companyName: searchProv.company_name || "Certified Roadside Provider",
        rating: Number(searchProv.avg_rating || 5.0),
        reviewCount: Number(searchProv.rating_count || 12),
        distanceMiles: 0,
        address: searchProv.company_address || "London, UK",
        city: "",
        phone: searchProv.company_phone || "+44 20 7946 0912",
        email: searchProv.company_email || "dispatch@mmcclub.co.uk",
        image: searchProv.logo_full_path || "",
        capabilities: {
          inStock: true,
          offersRecoveryTruck: true,
          canComeToLocation: true,
        },
      };
    } else {
      provider = {
        id: DEFAULT_PROVIDER_ID,
        name: "Motor Market Club Rapid Mobile Tyres London",
        companyName: "Motor Market Club Rapid Mobile Tyres London",
        rating: 4.9,
        reviewCount: 38,
        distanceMiles: 0,
        address: "Silbury House, Sydenham Hill, London, SE26 6TU",
        city: "London",
        phone: "+44 20 7946 0912",
        email: "dispatch@mmcclub.co.uk",
        image: "https://mmcclub.co.uk/backend/storage/app/public/provider/logo/2026-03-05-69a92b9b3230d.png",
        capabilities: {
          inStock: true,
          offersRecoveryTruck: true,
          canComeToLocation: true,
        },
      };
    }
  } else {
    // Replacement: find tyre and its provider
    const dynamicTyres = await fetchDynamicTyres(20, 1);
    matchedTyre =
      dynamicTyres.find((t) => t.id === params.selectedTyreId) ||
      dynamicTyres.find((t) => t.size === params.tyreSize) ||
      dynamicTyres[0];

    if (matchedTyre?.provider) {
      provider = {
        id: isUuid(matchedTyre.provider_id)
          ? matchedTyre.provider_id
          : isUuid(matchedTyre.provider.id)
            ? matchedTyre.provider.id
            : DEFAULT_PROVIDER_ID,
        name: matchedTyre.provider.company_name || "",
        companyName: matchedTyre.provider.company_name || "",
        rating: Number(matchedTyre.provider.avg_rating || 0),
        reviewCount: Number(matchedTyre.provider.rating_count || 0),
        distanceMiles: 0,
        address: matchedTyre.provider.company_address || "",
        city: "",
        phone: matchedTyre.provider.company_phone || "",
        email: matchedTyre.provider.company_email || "",
        image: matchedTyre.provider.logo_full_path || "",
        capabilities: {
          inStock: true,
          offersRecoveryTruck: true,
          canComeToLocation: true,
        },
      };
    } else {
      const provDetails = await fetchProviderDetails(params.providerId || DEFAULT_PROVIDER_ID);
      provider = {
        id: provDetails?.id || params.providerId || DEFAULT_PROVIDER_ID,
        name: provDetails?.company_name || "",
        companyName: provDetails?.company_name || "",
        rating: Number(provDetails?.avg_rating || 0),
        reviewCount: Number(provDetails?.rating_count || 0),
        distanceMiles: 0,
        address: provDetails?.company_address || "",
        city: "",
        phone: provDetails?.company_phone || "",
        email: provDetails?.company_email || "",
        image: provDetails?.logo_full_path || "",
        capabilities: {
          inStock: true,
          offersRecoveryTruck: true,
          canComeToLocation: true,
        },
      };
    }
  }

  // 4. Distinguish Emergency Service vs Replacement Service
  const serviceId = isEmergency
    ? TYRE_EMERGENCY_SERVICE_ID
    : params.serviceId || TYRE_REPLACEMENT_SERVICE_ID;

  // Determine variant for emergency
  let emergencyVariantKey = params.variantKey;
  if (isEmergency && !emergencyVariantKey) {
    if (params.situation?.toLowerCase().includes("burst")) {
      emergencyVariantKey = "burst-tyre";
    } else {
      emergencyVariantKey = "puncture";
    }
  }

  // 5. Trigger Real Backend Cart Add
  await addTyreToCart({
    provider_id: provider.id,
    service_id: serviceId,
    category_id: TYRE_CATEGORY_ID,
    variant_key: isEmergency ? emergencyVariantKey : undefined,
    tyre_id: !isEmergency ? (params.selectedTyreId || matchedTyre?.id) : undefined,
    quantity: params.tyreQuantity || 1,
    is_terms_accepted: 1,
  });

  // 6. Sync live cart from backend
  try {
    await fetchCartList();
  } catch (cartListErr) {
    console.warn("fetchCartList notice:", cartListErr);
  }

  const qty = params.tyreQuantity || 1;
  const tyreSize = params.tyreSize || matchedTyre?.size || "";

  let tyreDescription = "";
  let tyrePrice = 0;
  let labourPrice = 0;
  let callOutFee = 0;
  let fareAmount = 0;

  if (isEmergency) {
    const isBurst = emergencyVariantKey === "burst-tyre";
    const emergencyPrice = isBurst ? 100 : 50;
    tyrePrice = (params.selectedTyrePrice || emergencyPrice) * qty;
    callOutFee = params.assistanceType === "recovery_truck" ? 45 : 10;
    labourPrice = 0;
    fareAmount = tyrePrice + callOutFee;
    tyreDescription = isBurst
      ? "Tyre Emergency Service - Burst Tyre Rescue"
      : "Tyre Emergency Service - Puncture Repair";
  } else {
    // Replacement or Upgrades
    const unitPrice =
      params.selectedTyrePrice ||
      matchedTyre?.price ||
      0;
    tyrePrice = unitPrice * qty;
    labourPrice = 20 * qty;
    callOutFee = params.serviceLocationType === "workshop" ? 0 : 10;
    fareAmount = tyrePrice + labourPrice + callOutFee;
    tyreDescription = matchedTyre
      ? `${matchedTyre.brand || ""} ${matchedTyre.model || ""} (${tyreSize})`.trim()
      : `Tyre Replacement (${tyreSize})`.trim();
  }

  const quote: QuoteSummary = {
    tyreDescription,
    tyrePrice,
    labourPrice,
    callOutFee,
    discount: 0,
    vatAmount: Math.round(fareAmount * 0.2),
    fareAmount,
  };

  const categoryLabels: Record<TyreCategory, string> = {
    emergency: "Tyre Emergency",
    replacement: "Tyre Replacement",
    upgrades: "Tyre Upgrades",
  };

  const assistanceLabels: Record<AssistanceType, string> = {
    mobile_tyre: "Mobile Tyre Fitting",
    recovery_truck: "Recovery Truck Transport",
  };

  const locationLabels: Record<ServiceLocationType, string> = {
    mobile_repair: "Mobile Repair (At Location)",
    workshop: "Workshop Service",
  };

  const randomNum = Math.floor(100000 + Math.random() * 900000);
  const id = `MMC-TYR-${randomNum}`;
  const now = new Date().toISOString();

  const formattedDateTime = `${params.scheduledDate || "Today"}, ${params.scheduledTimeSlot || "Immediate Dispatch"
    }`;

  const combinedNotes = [
    params.situation ? `Situation: ${params.situation}` : null,
    params.notes ? params.notes : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const newBooking: TyreAssistanceBooking = {
    id,
    referenceNumber: id,
    category: params.category,
    categoryLabel: categoryLabels[params.category],
    assistanceType: params.assistanceType,
    assistanceLabel: assistanceLabels[params.assistanceType],
    serviceLocationType: params.serviceLocationType,
    serviceLocationLabel: locationLabels[params.serviceLocationType],
    scheduledDate: params.scheduledDate,
    scheduledTimeSlot: params.scheduledTimeSlot,
    selectedSlotId: params.selectedSlotId,
    formattedDateTime,
    locationAddress: params.locationAddress || "",
    locationPostcode: params.locationPostcode || "",
    house: params.house || (typeof window !== "undefined" ? localStorage.getItem("user_house") || localStorage.getItem("house") : null) || undefined,
    floor: params.floor || (typeof window !== "undefined" ? localStorage.getItem("user_floor") || localStorage.getItem("floor") : null) || undefined,
    street: params.street || (typeof window !== "undefined" ? localStorage.getItem("user_street") || localStorage.getItem("street") : null) || undefined,
    city: params.city || (typeof window !== "undefined" ? localStorage.getItem("user_city") || localStorage.getItem("city") : null) || undefined,
    serviceAddress: params.serviceAddress || (typeof window !== "undefined" ? localStorage.getItem("service_address_json") || localStorage.getItem("service_address") : null) || undefined,
    latitude: lat,
    longitude: lng,
    vehicleMakeModel: params.vehicleMakeModel || "",
    vehicleRegistration: params.vehicleRegistration || "",
    tyreSize,
    tyreQuantity: qty,
    selectedTyreId: !isEmergency ? (params.selectedTyreId || matchedTyre?.id) : undefined,
    variantKey: isEmergency ? emergencyVariantKey : undefined,
    serviceId: serviceId,
    notes: combinedNotes,
    acceptedPrivacy: params.acceptedPrivacy,
    provider,
    quote,
    status: "quote_ready",
    createdAt: now,
    updatedAt: now,
  };

  const existing = getStoredBookings();
  saveBookings([newBooking, ...existing]);
  setActiveBookingId(id);

  return newBooking;
}

export async function confirmQuoteAndAssignTechnician(
  bookingId: string,
  paymentOptions?: {
    is_partial?: number;
    payment_method?: string;
    payment_platform?: string;
    callback?: string;
  }
): Promise<TyreAssistanceBooking & { redirect_link?: string | null }> {
  const bookings = getStoredBookings();
  const index = bookings.findIndex(
    (b) => b.id === bookingId || b.referenceNumber === bookingId
  );
  if (index === -1) {
    throw new Error("Booking not found");
  }

  const booking = bookings[index];
  const zoneId =
    (typeof window !== "undefined" && localStorage.getItem(ZONE_KEY)) ||
    DEFAULT_ZONE_ID;

  const isEmergency = booking.category === "emergency";
  let serviceId = isEmergency
    ? TYRE_EMERGENCY_SERVICE_ID
    : booking.serviceId || TYRE_REPLACEMENT_SERVICE_ID;
  let categoryId = TYRE_CATEGORY_ID;

  const isBurst =
    booking.notes?.toLowerCase().includes("burst") ||
    booking.variantKey === "burst-tyre" ||
    booking.quote?.tyreDescription?.toLowerCase().includes("burst");

  const variantKey = isEmergency
    ? isBurst
      ? "burst-tyre"
      : "puncture"
    : undefined;

  const selectedTyreId = !isEmergency
    ? booking.selectedTyreId || (booking as any).tyre_id || (booking as any).tyreId
    : undefined;

  const effectiveProviderId = isUuid(booking.provider?.id)
    ? booking.provider.id
    : DEFAULT_PROVIDER_ID;

  const guestId = getOrCreateGuestId();
  const fareAmount = Number(booking.quote?.fareAmount || 50);
  const isPartialNum = paymentOptions?.is_partial !== undefined && Number(paymentOptions.is_partial) === 0 ? 0 : 1;
  const depositAmt = isPartialNum === 1 ? Number((fareAmount * 0.25).toFixed(2)) : fareAmount;
  const dueAmt = isPartialNum === 1 ? Number((fareAmount * 0.75).toFixed(2)) : 0;

  const successCallbackUrl =
    paymentOptions?.callback ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/booking-success`
      : "https://mmcclub.co.uk/booking-success");

  // 1. Step 1: Ensure service / tyre is in the cart with is_terms_accepted: 1 before checkout
  try {
    await addTyreToCart({
      guest_id: guestId,
      provider_id: effectiveProviderId,
      service_id: serviceId,
      category_id: categoryId,
      variant_key: variantKey,
      tyre_id: selectedTyreId,
      quantity: booking.tyreQuantity || 1,
      is_terms_accepted: 1,
    });
  } catch (cartErr) {
    console.warn("addTyreToCart note:", cartErr);
  }

  const validSchedule = formatValidServiceSchedule(
    booking.scheduledDate,
    booking.scheduledTimeSlot
  );

  const effectivePaymentMethod = paymentOptions?.payment_method || "stripe";

  // 2. Step 2: Real backend booking dispatch (POST /customer/booking/request/send)
  let response: any = null;
  try {
    response = await sendBookingRequestToBackend({
      guest_id: guestId,
      provider_id: effectiveProviderId,
      payment_method: effectivePaymentMethod,
      zone_id: zoneId,
      service_schedule: validSchedule,
      service_address:
        (booking as any).serviceAddress ||
        (booking as any).service_address ||
        (typeof window !== "undefined"
          ? localStorage.getItem("service_address_json") ||
            localStorage.getItem("service_address") ||
            localStorage.getItem("user_address")
          : null) ||
        booking.locationAddress ||
        ", ",
      service_location: "customer",
      booking_type: "emergency",
      selected_slot_id: booking.selectedSlotId || (booking as any).selected_slot_id,
      car_registration_number: (booking.vehicleRegistration || "MMC TYRE").trim().toUpperCase(),
      car_model: booking.vehicleMakeModel || "Vehicle",
      car_manufacture_year: new Date().getFullYear().toString(),
      car_color: "",
      notes: booking.notes || "Tyre assistance requested with online payment.",
      postcode:
        booking.locationPostcode ||
        (typeof window !== "undefined" ? localStorage.getItem("user_postcode") || localStorage.getItem("postcode") : null) ||
        "SW1A 1AA",
      house:
        (booking as any).house ||
        (typeof window !== "undefined" ? localStorage.getItem("user_house") || localStorage.getItem("house") : null) ||
        undefined,
      floor:
        (booking as any).floor ||
        (typeof window !== "undefined" ? localStorage.getItem("user_floor") || localStorage.getItem("floor") : null) ||
        undefined,
      street:
        (booking as any).street ||
        (typeof window !== "undefined" ? localStorage.getItem("user_street") || localStorage.getItem("street") : null) ||
        undefined,
      city:
        (booking as any).city ||
        (typeof window !== "undefined" ? localStorage.getItem("user_city") || localStorage.getItem("city") : null) ||
        undefined,
      latitude: String(booking.latitude || "51.5074"),
      longitude: String(booking.longitude || "-0.1278"),
      is_partial: isPartialNum,
      amount: fareAmount,
      paid_amount: depositAmt,
      due_amount: dueAmt,
      total_cost: fareAmount,
      payment_platform: "app",
      callback: successCallbackUrl,
      service_id: serviceId,
      category_id: categoryId,
    });
  } catch (sendErr) {
    console.warn("sendBookingRequestToBackend note:", sendErr);
  }

  // Auto-recovery fallback: If payment amount is 0 or no redirect link returned, re-add verified tyre variation and retry
  const isPaymentAmountZero =
    response?.response_code === "default_400" &&
    (Array.isArray(response?.errors)
      ? response.errors.some((e: any) => String(e).toLowerCase().includes("payment amount"))
      : String(response?.message || "").toLowerCase().includes("payment amount"));

  const hasDirectRedirect = Boolean(
    response?.content?.redirect_link ||
    response?.content?.redirect_url ||
    response?.content?.url ||
    response?.content?.payment_url ||
    response?.redirect_link ||
    response?.redirect_url ||
    response?.url
  );

  if (isPaymentAmountZero || !hasDirectRedirect) {
    console.log("[TyrePayment] Fallback auto-recovery: Adding verified tyre variation and retrying booking send...");
    try {
      await addTyreToCart({
        guest_id: guestId,
        provider_id: effectiveProviderId,
        service_id: TYRE_EMERGENCY_SERVICE_ID,
        category_id: TYRE_CATEGORY_ID,
        variant_key: "puncture",
        quantity: 1,
        is_terms_accepted: 1,
        zone_id: DEFAULT_ZONE_ID,
      });

      const retryRes = await sendBookingRequestToBackend({
        guest_id: guestId,
        provider_id: effectiveProviderId,
        payment_method: effectivePaymentMethod,
        zone_id: DEFAULT_ZONE_ID,
        service_schedule: validSchedule,
        service_address:
          (booking as any).serviceAddress ||
          (booking as any).service_address ||
          (typeof window !== "undefined"
            ? localStorage.getItem("service_address_json") ||
              localStorage.getItem("service_address") ||
              localStorage.getItem("user_address")
            : null) ||
          booking.locationAddress ||
          "",
        service_location: "customer",
        booking_type: "emergency",
        car_registration_number: (booking.vehicleRegistration || "MMC TYRE").trim().toUpperCase(),
        car_model: booking.vehicleMakeModel || "Vehicle",
        notes: booking.notes || "Tyre assistance requested with online payment.",
        postcode:
          booking.locationPostcode ||
          (typeof window !== "undefined" ? localStorage.getItem("user_postcode") || localStorage.getItem("postcode") : null) ||
          "SW1A 1AA",
        house:
          (booking as any).house ||
          (typeof window !== "undefined" ? localStorage.getItem("user_house") || localStorage.getItem("house") : null) ||
          undefined,
        floor:
          (booking as any).floor ||
          (typeof window !== "undefined" ? localStorage.getItem("user_floor") || localStorage.getItem("floor") : null) ||
          undefined,
        street:
          (booking as any).street ||
          (typeof window !== "undefined" ? localStorage.getItem("user_street") || localStorage.getItem("street") : null) ||
          undefined,
        city:
          (booking as any).city ||
          (typeof window !== "undefined" ? localStorage.getItem("user_city") || localStorage.getItem("city") : null) ||
          undefined,
        latitude: String(booking.latitude || "51.5074"),
        longitude: String(booking.longitude || "-0.1278"),
        is_partial: isPartialNum,
        callback: successCallbackUrl,
      });

      if (
        retryRes?.content?.redirect_link ||
        retryRes?.content?.redirect_url ||
        retryRes?.content?.url ||
        retryRes?.redirect_link ||
        retryRes?.redirect_url
      ) {
        response = retryRes;
      }
    } catch (retryErr) {
      console.warn("[TyrePayment] Auto-recovery retry notice:", retryErr);
    }
  }

  let realBookingUuid = extractBackendBookingUuid(response);
  let realReadableId = extractReadableBookingId(response);

  if (realReadableId) {
    booking.referenceNumber = String(realReadableId);
    if (typeof window !== "undefined") {
      localStorage.setItem("last_tyre_booking_id", String(realReadableId));
    }
  }
  if (realBookingUuid && !realBookingUuid.startsWith("MMC-TYR-")) {
    booking.id = realBookingUuid;
  }

  const responseContent: any = response?.content || response?.data?.content || response?.data;
  let redirectLink: string | null =
    (response as any)?.redirect_link ||
    (response as any)?.redirect_url ||
    (response as any)?.url ||
    responseContent?.redirect_link ||
    responseContent?.redirect_url ||
    responseContent?.url ||
    responseContent?.payment_url ||
    responseContent?.link ||
    responseContent?.payment_link ||
    (response as any)?.data?.redirect_link ||
    (response as any)?.data?.redirect_url ||
    (response as any)?.data?.url ||
    (typeof responseContent === "string" && responseContent.startsWith("http")
      ? responseContent
      : null);

  // 3. Step 3: Switch payment method to Stripe if booking ID is confirmed and redirect link wasn't in initial response
  const targetBookingId =
    realBookingUuid ||
    realReadableId ||
    (!booking.id.startsWith("MMC-TYR-") ? booking.id : null) ||
    (!booking.referenceNumber.startsWith("MMC-TYR-") ? booking.referenceNumber : null);

  if (!redirectLink && targetBookingId) {
    const payloadsToTry = [
      {
        booking_id: String(targetBookingId),
        payment_method: "stripe",
        is_partial: isPartialNum,
        payment_platform: "app",
        callback: successCallbackUrl,
      },
      {
        booking_id: String(targetBookingId),
        payment_method: "stripe",
        is_partial: isPartialNum,
        payment_platform: "web",
        callback: successCallbackUrl,
      },
    ];

    for (const p of payloadsToTry) {
      if (redirectLink) break;
      try {
        console.log("[TyrePayment] Requesting switch-payment-method:", p);
        const switchRes = await apiClient.post("/customer/booking/switch-payment-method", p);
        const sData = switchRes.data;
        const sContent = sData?.content;
        const sRaw = typeof sContent === "object" && sContent !== null ? sContent : sData || {};

        if (typeof sContent === "string" && sContent.startsWith("http")) {
          redirectLink = sContent;
          break;
        }

        const candidateUrl =
          sRaw?.redirect_url ||
          sRaw?.redirect_link ||
          sRaw?.payment_url ||
          sRaw?.url ||
          sRaw?.link ||
          sRaw?.stripe_url ||
          sRaw?.data?.redirect_url ||
          sRaw?.data?.url;

        if (candidateUrl && String(candidateUrl).startsWith("http")) {
          redirectLink = String(candidateUrl);
          break;
        }

        const candidatePId =
          sRaw?.payment_id || sRaw?.paymentId || sRaw?.stripe_payment_id || sRaw?.data?.payment_id;
        if (candidatePId) {
          redirectLink = `${getBackendRootUrl()}/payment/stripe/pay?payment_id=${encodeURIComponent(
            String(candidatePId)
          )}&is_partial=${isPartialNum}&callback=${encodeURIComponent(successCallbackUrl)}`;
          break;
        }
      } catch (switchErr: any) {
        const errData = switchErr?.response?.data;
        if (errData?.content?.redirect_url && String(errData.content.redirect_url).startsWith("http")) {
          redirectLink = String(errData.content.redirect_url);
          break;
        }
        console.warn("[TyrePayment] switch-payment-method notice:", errData?.message || switchErr.message);
      }
    }
  }


  if (redirectLink && typeof redirectLink === "string") {
    redirectLink = redirectLink.replace(/\\\//g, "/");
    if (!redirectLink.startsWith("http")) {
      redirectLink = `${getBackendRootUrl()}${redirectLink.startsWith("/") ? "" : "/"}${redirectLink}`;
    }
    if (!redirectLink.includes("callback=")) {
      const sep = redirectLink.includes("?") ? "&" : "?";
      redirectLink = `${redirectLink}${sep}callback=${encodeURIComponent(successCallbackUrl)}`;
    }
    if (!redirectLink.includes("is_partial=")) {
      redirectLink = `${redirectLink}&is_partial=${isPartialNum}`;
    }
  }

  // 5. Step 5: Direct Window Redirect to Stripe (Exact Mechanical behavior)
  if (
    typeof window !== "undefined" &&
    redirectLink &&
    typeof redirectLink === "string" &&
    redirectLink.startsWith("http") &&
    !redirectLink.includes("payment_id=MMC-")
  ) {
    console.log("[TyreBooking] Redirecting directly to Stripe secure checkout:", redirectLink);
    window.location.href = redirectLink;
  }

  const backendMsg =
    (response as any)?.message ||
    (response as any)?.errors ||
    (response as any)?.response?.data?.message ||
    "Payment session established.";

  booking.status = "quote_ready";
  booking.updatedAt = new Date().toISOString();
  saveBookings(bookings);
  setActiveBookingId(booking.id);

  const resolvedTyreAddr =
    booking.locationAddress ||
    (booking as any).serviceAddress ||
    (booking.house && booking.locationPostcode ? `${booking.house}, ${booking.locationPostcode}` : booking.locationPostcode) ||
    "";

  const effectiveId = String(realReadableId || realBookingUuid || booking.referenceNumber || booking.id);

  try {
    saveConfirmedBooking({
      id: effectiveId,
      rawId: realBookingUuid || booking.id,
      readableId: realReadableId || booking.referenceNumber,
      serviceType: "tyre",
      serviceCategoryName: "Tyre Assistance",
      serviceTitle: booking.categoryLabel || "Tyre Assistance",
      serviceSubtitle: booking.assistanceLabel || booking.quote?.tyreDescription,
      providerName: booking.provider?.name || booking.provider?.companyName || "Certified Roadside Provider",
      providerPhone: booking.provider?.phone,
      serviceAddress: (booking as any).serviceAddress || booking.locationAddress || resolvedTyreAddr,
      pickupLocation: booking.locationAddress || resolvedTyreAddr,
      locationAddress: booking.locationAddress || resolvedTyreAddr,
      postcode: booking.locationPostcode || "",
      house: booking.house || "",
      floor: booking.floor || "",
      street: (booking as any).street || (typeof window !== "undefined" ? localStorage.getItem("user_street") || localStorage.getItem("street") : "") || "",
      city: (booking as any).city || (typeof window !== "undefined" ? localStorage.getItem("user_city") || localStorage.getItem("city") : "") || "",
      vehicleModel: booking.vehicleMakeModel || "",
      vehicleReg: booking.vehicleRegistration || "",
      totalAmount: fareAmount,
      paidAmount: depositAmt,
      dueAmount: dueAmt,
      isPaid: false,
      isPartiallyPaid: isPartialNum === 1,
      paymentStatus: isPartialNum === 1 ? "Partial Deposit" : "Pending Payment",
      paymentMethod: "Stripe (Online)",
      status: "accepted",
      statusDisplay: "Accepted",
      scheduleDate: booking.scheduledDate,
      scheduleTime: booking.scheduledTimeSlot,
      createdAt: booking.createdAt || new Date().toISOString(),
    });

    saveBookingMeta(effectiveId, {
      serviceTitle: booking.categoryLabel || "Tyre Assistance",
      serviceCategoryName: "Tyre Assistance",
      serviceType: "tyre",
      vehicleModel: booking.vehicleMakeModel,
      vehicleReg: booking.vehicleRegistration,
      providerName: booking.provider?.name || booking.provider?.companyName,
      price: fareAmount,
      paidAmount: depositAmt,
      dueAmount: dueAmt,
      isPaid: false,
      isPartiallyPaid: isPartialNum === 1,
      paymentStatus: isPartialNum === 1 ? "Partially Paid" : "Pending Payment",
      scheduleDate: booking.scheduledDate,
      scheduleTime: booking.scheduledTimeSlot,
      serviceAddress: (booking as any).serviceAddress || booking.locationAddress || resolvedTyreAddr,
      pickupLocation: booking.locationAddress || resolvedTyreAddr,
      locationAddress: booking.locationAddress || resolvedTyreAddr,
      postcode: booking.locationPostcode || "",
      house: booking.house || "",
      floor: booking.floor || "",
      street: (booking as any).street || (typeof window !== "undefined" ? localStorage.getItem("user_street") || localStorage.getItem("street") : "") || "",
      city: (booking as any).city || (typeof window !== "undefined" ? localStorage.getItem("user_city") || localStorage.getItem("city") : "") || "",
    });
  } catch (syncErr) {
    console.warn("Could not save confirmed tyre booking to global store:", syncErr);
  }

  return Object.assign(booking, {
    redirect_link: redirectLink,
    message: redirectLink ? undefined : backendMsg,
    error: redirectLink ? undefined : backendMsg,
  });
}

export function extractBackendBookingUuid(res: any): string | null {
  if (!res) return null;

  const payload =
    res.data && (res.data.content !== undefined || res.data.response_code !== undefined)
      ? res.data
      : res;

  const content =
    payload.content !== undefined
      ? payload.content
      : payload.data !== undefined
        ? payload.data
        : payload;

  if (content && typeof content === "object") {
    const bObj = content.booking;
    if (bObj && typeof bObj === "object") {
      if (bObj.booking && typeof bObj.booking === "object" && bObj.booking.id) {
        return String(bObj.booking.id);
      }
      if (bObj.booking_id) return String(bObj.booking_id);
      if (bObj.id) return String(bObj.id);
      if (bObj.payment_id) return String(bObj.payment_id);
    }

    if (typeof (content as any)?.redirect_link === "string") {
      const match = (content as any).redirect_link.match(/payment_id=([^&]+)/);
      if (match) return decodeURIComponent(match[1]);
    }
    if (typeof (content as any)?.redirect_url === "string") {
      const match = (content as any).redirect_url.match(/payment_id=([^&]+)/);
      if (match) return decodeURIComponent(match[1]);
    }
    if (typeof (content as any)?.url === "string") {
      const match = (content as any).url.match(/payment_id=([^&]+)/);
      if (match) return decodeURIComponent(match[1]);
    }
    if (Array.isArray(content.booking_id) && content.booking_id.length > 0) {
      return String(content.booking_id[0]);
    }
    if (content.booking_id) return String(content.booking_id);
    if (content.payment_id) return String(content.payment_id);
    if (content.id) return String(content.id);
    if (content.booking?.id) return String(content.booking.id);
    if (content.booking?.booking_id) return String(content.booking.booking_id);
  }

  if (Array.isArray(content) && content.length > 0) {
    const item = content[0];
    if (item?.id) return String(item.id);
    if (Array.isArray(item?.booking_id) && item.booking_id.length > 0) return String(item.booking_id[0]);
    if (item?.booking_id) return String(item.booking_id);
    if (item?.payment_id) return String(item.payment_id);
  }

  if (typeof payload?.redirect_url === "string") {
    const match = payload.redirect_url.match(/payment_id=([^&]+)/);
    if (match) return decodeURIComponent(match[1]);
  }
  if (typeof payload?.redirect_link === "string") {
    const match = payload.redirect_link.match(/payment_id=([^&]+)/);
    if (match) return decodeURIComponent(match[1]);
  }

  if (Array.isArray(payload.booking_id) && payload.booking_id.length > 0) {
    return String(payload.booking_id[0]);
  }
  if (payload.booking_id) return String(payload.booking_id);
  if (payload.id) return String(payload.id);
  if (payload.payment_id) return String(payload.payment_id);

  return null;
}

export function extractReadableBookingId(res: any): string | null {
  if (!res) return null;

  const payload =
    res.data && (res.data.content !== undefined || res.data.response_code !== undefined)
      ? res.data
      : res;

  const content =
    payload.content !== undefined
      ? payload.content
      : payload.data !== undefined
        ? payload.data
        : payload;

  if (content && typeof content === "object") {
    const bObj = content.booking;
    if (bObj && typeof bObj === "object") {
      if (bObj.booking && typeof bObj.booking === "object" && bObj.booking.readable_id) {
        return String(bObj.booking.readable_id);
      }
      if (bObj.readable_id) return String(bObj.readable_id);
      if (bObj.booking_id) return String(bObj.booking_id);
      if (bObj.id) return String(bObj.id);
    }
    if (content.readable_id) return String(content.readable_id);
    if (Array.isArray(content.booking_id) && content.booking_id.length > 0) {
      return String(content.booking_id[0]);
    }
    if (content.booking_id) return String(content.booking_id);
    if (content.booking?.readable_id) return String(content.booking.readable_id);
    if (content.booking?.id) return String(content.booking.id);
    if (content.id) return String(content.id);
  }

  if (Array.isArray(content) && content.length > 0) {
    const item = content[0];
    if (item?.readable_id) return String(item.readable_id);
    if (item?.booking_id) return String(Array.isArray(item.booking_id) ? item.booking_id[0] : item.booking_id);
    if (item?.id) return String(item.id);
  }

  if (payload.readable_id) return String(payload.readable_id);
  if (Array.isArray(payload.booking_id) && payload.booking_id.length > 0) {
    return String(payload.booking_id[0]);
  }
  if (payload.booking_id) return String(payload.booking_id);
  if (payload.id) return String(payload.id);

  return null;
}

export async function assignTechnicianToBooking(
  bookingId: string
): Promise<TyreAssistanceBooking> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const bookings = getStoredBookings();
  const index = bookings.findIndex(
    (b) => b.id === bookingId || b.referenceNumber === bookingId
  );
  if (index === -1) {
    throw new Error("Booking not found");
  }

  bookings[index].status = "confirmed";
  bookings[index].updatedAt = new Date().toISOString();

  // If a real booking ID was saved in localStorage, ensure referenceNumber uses it!
  const savedRealId =
    typeof window !== "undefined"
      ? localStorage.getItem("last_tyre_booking_id")
      : null;
  if (savedRealId && String(bookings[index].referenceNumber).startsWith("MMC-TYR-")) {
    bookings[index].referenceNumber = savedRealId;
    bookings[index].id = savedRealId;
  }

  saveBookings(bookings);
  return bookings[index];
}

export async function cancelBooking(
  bookingId: string,
  reason?: string
): Promise<TyreAssistanceBooking> {
  const bookings = getStoredBookings();
  const index = bookings.findIndex(
    (b) => b.id === bookingId || b.referenceNumber === bookingId
  );
  if (index === -1) {
    throw new Error("Booking not found");
  }

  bookings[index].status = "cancelled";
  bookings[index].notes = reason
    ? `${bookings[index].notes || ""} [Cancelled: ${reason}]`
    : bookings[index].notes;
  bookings[index].updatedAt = new Date().toISOString();

  saveBookings(bookings);
  return bookings[index];
}
