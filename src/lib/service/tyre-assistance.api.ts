import apiClient from "@/lib/http/apiClient";
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
}

/**
 * Fetch Tyre Services for Category (Emergency vs Replacement)
 * GET /customer/service/category/5d98d5c9-509e-4ab7-859d-806174384e27?limit=10&offset=1
 */
export async function fetchTyreCategoryServices(
  categoryId: string = TYRE_CATEGORY_ID
): Promise<any[]> {
  const zoneId =
    (typeof window !== "undefined" && localStorage.getItem(ZONE_KEY)) ||
    DEFAULT_ZONE_ID;

  try {
    const response = await apiClient.get(
      `/customer/service/category/${categoryId}`,
      {
        params: { limit: 10, offset: 1 },
        headers: { zoneid: zoneId, zoneId },
      }
    );

    const data = response.data?.content?.data;
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (error) {
    console.warn("fetchTyreCategoryServices failed:", error);
  }

  return [];
}

/**
 * Dynamic Provider Search for Tyre Services:
 * POST /customer/provider/search-by-service
 */
export async function searchTyreProviders(
  serviceIds: string[] = [TYRE_REPLACEMENT_SERVICE_ID, TYRE_EMERGENCY_SERVICE_ID],
  latitude: number | string = "51.5074",
  longitude: number | string = "-0.1278"
): Promise<any[]> {
  const zoneId =
    (typeof window !== "undefined" && localStorage.getItem(ZONE_KEY)) ||
    DEFAULT_ZONE_ID;

  try {
    const formData = new FormData();
    serviceIds.forEach((id) => formData.append("service_ids[]", id));
    formData.append("latitude", String(latitude));
    formData.append("longitude", String(longitude));

    const res = await apiClient.post("/customer/provider/search-by-service", formData, {
      headers: {
        zoneid: zoneId,
        "zone-id": zoneId,
        ZoneId: zoneId,
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
    } else if (timeSlot.includes("08:00")) {
      time = "09:00:00";
    } else if (timeSlot.includes("12:00")) {
      time = "13:00:00";
    } else if (timeSlot.includes("16:00")) {
      time = "17:00:00";
    } else if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeSlot.trim())) {
      time = timeSlot.trim().length === 5 ? `${timeSlot.trim()}:00` : timeSlot.trim();
    }
  }

  return `${yyyy}-${mm}-${dd} ${time}`;
}

export const isUuid = (id?: string | null): boolean => {
  if (!id || typeof id !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());
};

export async function addTyreToCart(payload: {
  provider_id?: string;
  service_id?: string;
  category_id?: string;
  variant_key?: string;
  tyre_id?: string;
  quantity?: number;
  is_terms_accepted?: number;
  guest_id?: string;
}): Promise<any> {
  const zoneId =
    (typeof window !== "undefined" &&
      (localStorage.getItem("zone_id") ||
        localStorage.getItem("zoneid") ||
        localStorage.getItem("zoneId") ||
        localStorage.getItem(ZONE_KEY))) ||
    DEFAULT_ZONE_ID;

  const effectiveProviderId = isUuid(payload.provider_id)
    ? payload.provider_id!
    : DEFAULT_PROVIDER_ID;

  try {
    const postBody: Record<string, any> = {
      provider_id: effectiveProviderId,
      service_id: payload.service_id || DEFAULT_SERVICE_ID,
      category_id: payload.category_id || TYRE_CATEGORY_ID,
      quantity: payload.quantity || 1,
      is_terms_accepted: 1,
    };

    if (payload.variant_key) {
      postBody.variant_key = payload.variant_key;
    }
    if (payload.tyre_id) {
      postBody.tyre_id = payload.tyre_id;
    }

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
  payment_method?: string;
  zone_id?: string;
  service_schedule?: string;
  service_address_id?: string | number;
  service_address?: string;
  service_location?: "customer" | "provider" | string;
  booking_type?: string;
  car_registration_number?: string;
  car_model?: string;
  car_manufacture_year?: string;
  car_color?: string;
  notes?: string;
  postcode?: string;
  latitude?: number | string;
  longitude?: number | string;
  is_partial?: number | boolean | string;
  amount?: number | string;
  paid_amount?: number | string;
  due_amount?: number | string;
  total_cost?: number | string;
  payment_platform?: string;
  callback?: string;
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

  const guestId = payload.guest_id || getOrCreateGuestId();

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fallbackSchedule = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  // Exact JSON body format matching user curl and Demandium specification
  const postData: Record<string, any> = {
    guest_id: guestId,
    provider_id: payload.provider_id || DEFAULT_PROVIDER_ID,
    payment_method: payload.payment_method || "stripe",
    is_partial: String(payload.is_partial !== undefined ? (Number(payload.is_partial) === 1 ? "1" : "0") : "1"),
    payment_platform: payload.payment_platform || "app",
    zone_id: zoneId,
    service_schedule: payload.service_schedule || fallbackSchedule,
    service_address_id: String(payload.service_address_id || "6"),
    service_location: "customer",
    booking_type: payload.booking_type || "normal",
    selected_slot_id: (payload as any).selected_slot_id || "00dc5d50-fa91-4c49-b74a-1326fc8a1fdf",
    callback:
      payload.callback ||
      (typeof window !== "undefined"
        ? `${window.location.origin}/booking-success`
        : "https://mmcclub.co.uk/booking-success"),
    car_registration_number: (payload.car_registration_number || "").trim().toUpperCase(),
    car_model: payload.car_model || "",
    car_manufacture_year: payload.car_manufacture_year || new Date().getFullYear().toString(),
    car_color: payload.car_color || "",
    notes: payload.notes || "",
  };
  if ((payload as any).post_id) {
    postData.post_id = (payload as any).post_id;
  }

  console.log("[TyreBooking] POST /customer/booking/request/send body:", postData);

  try {
    const response = await apiClient.post(
      "/customer/booking/request/send",
      postData,
      {
        headers: {
          zoneid: zoneId,
          "zone-id": zoneId,
          ZoneId: zoneId,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    console.log("[TyreBooking] POST /customer/booking/request/send response:", response?.data);
    return response?.data;
  } catch (error: any) {
    console.warn("booking/request/send error:", error?.response?.data || error?.message);
    return error?.response?.data || null;
  }
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
  locationAddress: string;
  locationPostcode?: string;
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

  // 2. Fetch live dynamic tyres from backend to find provider
  const dynamicTyres = await fetchDynamicTyres(20, 1);
  const matchedTyre =
    dynamicTyres.find((t) => t.id === params.selectedTyreId) ||
    dynamicTyres.find((t) => t.size === params.tyreSize) ||
    dynamicTyres[0];

  // 3. Construct dynamic Provider object using real backend data
  let provider: TyreProvider;
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

  // 4. Distinguish Emergency Service vs Replacement Service
  const isEmergency = params.category === "emergency";
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
    formattedDateTime,
    locationAddress: params.locationAddress || "",
    locationPostcode: params.locationPostcode || "",
    latitude: lat,
    longitude: lng,
    vehicleMakeModel: params.vehicleMakeModel || "",
    vehicleRegistration: params.vehicleRegistration || "",
    tyreSize,
    tyreQuantity: qty,
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
  const serviceId = isEmergency
    ? TYRE_EMERGENCY_SERVICE_ID
    : TYRE_REPLACEMENT_SERVICE_ID;
  const isBurst = booking.notes?.toLowerCase().includes("burst");
  const variantKey = isEmergency
    ? isBurst
      ? "burst-tyre"
      : "puncture"
    : undefined;

  const effectiveProviderId = isUuid(booking.provider?.id)
    ? booking.provider.id
    : DEFAULT_PROVIDER_ID;

  // 1. Step 1: Ensure service is in the cart with is_terms_accepted: 1 before checkout (exact match to mobile app)
  try {
    await addTyreToCart({
      provider_id: effectiveProviderId,
      service_id: serviceId,
      category_id: TYRE_CATEGORY_ID,
      variant_key: variantKey,
      quantity: 1,
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

  // 2. Step 2: Real backend booking dispatch (matching mobile app)
  const response = await sendBookingRequestToBackend({
    guest_id: getOrCreateGuestId(),
    provider_id: effectiveProviderId,
    payment_method: effectivePaymentMethod,
    zone_id: zoneId,
    service_schedule: validSchedule,
    service_address_id: "6",
    service_address: booking.locationAddress || "Customer Location, United Kingdom",
    service_location: "customer",
    booking_type: isEmergency ? "emergency" : "normal",
    car_registration_number: booking.vehicleRegistration || "",
    car_model: booking.vehicleMakeModel || "",
    car_manufacture_year: new Date().getFullYear().toString(),
    car_color: "",
    notes: booking.notes || "",
    is_partial: paymentOptions?.is_partial ?? 1,
    payment_platform: "app",
  });

  const realBookingUuid = extractBackendBookingUuid(response);
  const realReadableId = extractReadableBookingId(response);

  if (realReadableId) {
    booking.referenceNumber = String(realReadableId);
    if (typeof window !== "undefined") {
      localStorage.setItem("last_tyre_booking_id", String(realReadableId));
    }
  }
  if (realBookingUuid) {
    booking.id = realBookingUuid;
  }

  const responseContent: unknown = response?.content;
  let redirectLink =
    (response as any)?.content?.url ||
    (response as any)?.content?.redirect_link ||
    (response as any)?.content?.redirect_url ||
    (response as any)?.content?.payment_url ||
    (response as any)?.content?.link ||
    (response as any)?.content?.payment_link ||
    (response as any)?.url ||
    (response as any)?.redirect_link ||
    (response as any)?.redirect_url ||
    (typeof responseContent === "string" && responseContent.startsWith("http")
      ? responseContent
      : null);

  // If backend didn't supply direct redirectLink in booking response, call switch-payment-method
  const candidateIds = [
    realBookingUuid,
    (response as any)?.content?.booking_id,
    (response as any)?.content?.id,
    realReadableId,
    booking.id,
  ].filter(Boolean);

  if (!redirectLink) {
    for (const cid of candidateIds) {
      if (redirectLink) break;
      for (const pPlatform of ["app", "web"]) {
        if (redirectLink) break;
        try {
          console.log("[TyrePayment] Calling switch-payment-method with candidate booking_id:", cid, pPlatform);
          const switchRes = await apiClient.post("/customer/booking/switch-payment-method", {
            booking_id: String(cid),
            payment_method: "stripe",
            is_partial: paymentOptions?.is_partial ?? 1,
            payment_platform: pPlatform,
            callback:
              paymentOptions?.callback ||
              (typeof window !== "undefined"
                ? `${window.location.origin}/booking-success`
                : "https://mmcclub.co.uk/booking-success"),
          });
          const sData = switchRes.data;
          const sContent = sData?.content;
          const sRaw = (typeof sContent === "object" && sContent !== null) ? sContent : sData || {};

          if (typeof sContent === "string" && sContent.startsWith("http")) {
            redirectLink = sContent;
            break;
          } else {
            const u = sRaw.redirect_url || sRaw.redirect_link || sRaw.payment_url || sRaw.url || sRaw.link || sRaw.stripe_url || sRaw.data?.redirect_url;
            if (u && String(u).startsWith("http")) {
              redirectLink = String(u);
              break;
            } else if (sRaw.payment_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(sRaw.payment_id))) {
              redirectLink = `https://mmcclub.co.uk/backend/payment/stripe/pay?payment_id=${encodeURIComponent(String(sRaw.payment_id))}&is_partial=${paymentOptions?.is_partial ?? 1}`;
              break;
            }
          }
        } catch (sErr: any) {
          const errData = sErr?.response?.data;
          if (errData?.content?.redirect_url && String(errData.content.redirect_url).startsWith("http")) {
            redirectLink = String(errData.content.redirect_url);
            break;
          }
          console.warn("[TyrePayment] switch-payment-method notice for cid:", cid, sErr?.message);
        }
      }
    }
  }

  // If still no direct link, construct Demandium Stripe gateway link ONLY if it's a valid UUID
  if (!redirectLink && realBookingUuid && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(realBookingUuid)) {
    redirectLink = `https://mmcclub.co.uk/backend/payment/stripe/pay?payment_id=${encodeURIComponent(realBookingUuid)}&is_partial=${paymentOptions?.is_partial ?? 1}`;
  }

  booking.status = redirectLink ? "quote_ready" : "quote_ready";
  booking.updatedAt = new Date().toISOString();
  saveBookings(bookings);
  setActiveBookingId(booking.id);

  return Object.assign(booking, { redirect_link: redirectLink });
}

export function extractBackendBookingUuid(res: any): string | null {
  if (!res) return null;
  const isUuid = (str: any) =>
    typeof str === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());

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

  if (Array.isArray(content) && content.length > 0) {
    const item = content[0];
    if (isUuid(item?.id)) return String(item.id);
    if (Array.isArray(item?.booking_id) && isUuid(item.booking_id[0])) return String(item.booking_id[0]);
    if (isUuid(item?.booking_id)) return String(item.booking_id);
  }

  if (content && typeof content === "object") {
    if (typeof (content as any)?.redirect_link === "string") {
      const match = (content as any).redirect_link.match(/payment_id=([0-9a-fA-F-]+)/);
      if (match && isUuid(match[1])) return match[1];
    }
    if (Array.isArray(content.booking_id) && isUuid(content.booking_id[0])) {
      return String(content.booking_id[0]);
    }
    if (isUuid(content.booking_id)) return String(content.booking_id);
    if (isUuid(content.id)) return String(content.id);
    if (isUuid(content.booking?.id)) return String(content.booking.id);
    if (isUuid(content.booking?.booking_id)) return String(content.booking.booking_id);
  }

  if (isUuid(payload.booking_id)) return String(payload.booking_id);
  if (Array.isArray(payload.booking_id) && isUuid(payload.booking_id[0])) {
    return String(payload.booking_id[0]);
  }
  if (isUuid(payload.id)) return String(payload.id);

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

  // 1. If content is an array: [ { readable_id: 100040, ... } ]
  if (Array.isArray(content) && content.length > 0) {
    const item = content[0];
    if (item?.readable_id) return String(item.readable_id);
    if (item?.booking_id) return String(Array.isArray(item.booking_id) ? item.booking_id[0] : item.booking_id);
    if (item?.id) return String(item.id);
  }

  // 2. If content is an object: { readable_id: 100040, ... }
  if (content && typeof content === "object") {
    if (content.readable_id) return String(content.readable_id);
    if (Array.isArray(content.booking_id) && content.booking_id.length > 0) {
      return String(content.booking_id[0]);
    }
    if (content.booking_id) return String(content.booking_id);
    if (content.booking?.readable_id) return String(content.booking.readable_id);
    if (content.booking?.id) return String(content.booking.id);
    if (content.id) return String(content.id);
  }

  // 3. Check top-level properties
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
  if (savedRealId && bookings[index].referenceNumber.startsWith("MMC-TYR-")) {
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
