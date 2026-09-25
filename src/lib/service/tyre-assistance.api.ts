import apiClient from "@/lib/http/apiClient";
import {
  TyreAssistanceBooking,
  TyreCategory,
  AssistanceType,
  ServiceLocationType,
  TyreProvider,
  QuoteSummary,
  DEFAULT_PROVIDERS,
  DEFAULT_TECHNICIANS,
  calculateQuote,
} from "@/lib/data/tyre-assistance.data";

const STORAGE_KEY = "mmc_tyre_assistance_bookings";
const ACTIVE_BOOKING_KEY = "mmc_active_tyre_booking_id";
const ZONE_KEY = "zoneId";

// Default IDs
export const TYRE_CATEGORY_ID = "5d98d5c9-509e-4ab7-859d-806174384e27";
export const DEFAULT_SERVICE_ID = "9913c6e3-1f99-4929-989c-25484da50e00";
export const DEFAULT_PROVIDER_ID = "9b1d7cc4-6f97-4b80-8931-9167c3bc3c15";
export const DEFAULT_ZONE_ID = "a1614dbe-4732-11ee-9702-dee6e8d77be4";

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

    const data = response.data?.content?.data;
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (error) {
    console.warn("fetchDynamicTyres failed, using fallback:", error);
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

  // Sensible default questions matching backend schema
  return [
    {
      id: "c860ab63-8a2a-4e69-b3c4-f448a80b766d",
      provider_id: null,
      category_id: TYRE_CATEGORY_ID,
      question_text: "Assistance Type",
      options: "Mobile Tyre Service, Recovery Truck",
      question_type: "select",
      is_required: true,
      is_active: true,
      display_order: 1,
    },
    {
      id: "2c336123-5d3b-46d9-903b-fd12886ab880",
      provider_id: null,
      category_id: TYRE_CATEGORY_ID,
      question_text: "Tyre Size (e.g., 205/55 R16)",
      options: null,
      question_type: "text",
      is_required: true,
      is_active: true,
      display_order: 2,
    },
    {
      id: "960dec0d-a3a0-4bda-9882-55dbaf9ef392",
      provider_id: null,
      category_id: TYRE_CATEGORY_ID,
      question_text: "Vehicle Model & Year",
      options: null,
      question_type: "text",
      is_required: true,
      is_active: true,
      display_order: 3,
    },
    {
      id: "3fd59fd8-4d95-4ed4-be6c-3203b3d93623",
      provider_id: null,
      category_id: TYRE_CATEGORY_ID,
      question_text: "Current Situation",
      options: "Puncture, Burst Tyre, New Tyre",
      question_type: "select",
      is_required: true,
      is_active: true,
      display_order: 4,
    },
    {
      id: "521bed35-c457-432a-9202-22e02b3b59b6",
      provider_id: null,
      category_id: TYRE_CATEGORY_ID,
      question_text: "Number of Tyres",
      options: "1, 2, 3, 4",
      question_type: "select",
      is_required: true,
      is_active: true,
      display_order: 5,
    },
  ];
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
export async function addTyreToCart(payload: {
  provider_id: string;
  service_id: string;
  category_id?: string;
  tyre_id?: string;
  quantity: number;
  guest_id?: string;
}): Promise<any> {
  const zoneId =
    (typeof window !== "undefined" && localStorage.getItem(ZONE_KEY)) ||
    DEFAULT_ZONE_ID;

  const guestId =
    payload.guest_id ||
    (typeof window !== "undefined" && localStorage.getItem("guest_id")) ||
    "550e8400-e29b-41d4-a716-446655440000";

  try {
    const response = await apiClient.post(
      "/customer/cart/add",
      {
        guest_id: guestId,
        provider_id: payload.provider_id || DEFAULT_PROVIDER_ID,
        service_id: payload.service_id || DEFAULT_SERVICE_ID,
        category_id: payload.category_id || TYRE_CATEGORY_ID,
        tyre_id: payload.tyre_id,
        quantity: payload.quantity || 1,
      },
      {
        headers: { zoneId, zoneid: zoneId },
      }
    );
    return response.data;
  } catch (error) {
    console.warn("cart/add call note:", error);
    return null;
  }
}

/**
 * Send Booking Request to Backend
 * POST /customer/booking/request/send
 */
export interface SendBookingRequestPayload {
  guest_id?: string;
  payment_method: string;
  zone_id: string;
  service_schedule: string;
  service_address_id?: string | number;
  service_address?: string;
  service_location: "customer" | "provider" | string;
  booking_type: string;
  car_registration_number: string;
  car_model: string;
  car_manufacture_year?: string;
  car_color?: string;
  notes?: string;
  postcode?: string;
  latitude?: number | string;
  longitude?: number | string;
}

export async function sendBookingRequestToBackend(
  payload: SendBookingRequestPayload
): Promise<any> {
  const zoneId =
    payload.zone_id ||
    (typeof window !== "undefined" && localStorage.getItem(ZONE_KEY)) ||
    DEFAULT_ZONE_ID;

  const guestId =
    payload.guest_id ||
    (typeof window !== "undefined" &&
      (localStorage.getItem("guest_id") ||
        localStorage.getItem("zone_id") ||
        localStorage.getItem("zoneid"))) ||
    zoneId;

  let cleanPostcode = (payload.postcode || "").trim();
  if (cleanPostcode.length > 15) {
    const match = cleanPostcode.match(/[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}|\b\d{5,6}\b/i);
    cleanPostcode = match ? match[0] : cleanPostcode.slice(0, 15);
  }
  if (!cleanPostcode) cleanPostcode = "12345";

  const fullAddress = payload.service_address || "Customer Location, UK";

  const formattedPayload: Record<string, any> = {
    ...payload,
    guest_id: guestId,
    zone_id: zoneId,
    service_address_id: String(payload.service_address_id || "6"),
    service_address: fullAddress,
    service_location: "customer",
    postcode: cleanPostcode,
    latitude: String(payload.latitude || "22.66215"),
    longitude: String(payload.longitude || "75.9035"),
  };

  try {
    const response = await apiClient.post(
      "/customer/booking/request/send",
      formattedPayload,
      {
        headers: { zoneId, zoneid: zoneId, ZoneId: zoneId },
      }
    );
    return response.data;
  } catch (error) {
    console.warn("booking/request/send note:", error);
    return null;
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
  tyreSize?: string;
  tyreQuantity?: number;
  selectedTyreId?: string;
  selectedTyrePrice?: number;
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
      id: matchedTyre.provider_id || DEFAULT_PROVIDER_ID,
      name: matchedTyre.provider.company_name || "Test Company Ltd",
      companyName: matchedTyre.provider.company_name || "Test Company Ltd",
      rating: Number(matchedTyre.provider.avg_rating || 0),
      reviewCount: Number(matchedTyre.provider.rating_count || 0),
      distanceMiles: 1.2,
      address:
        matchedTyre.provider.company_address || "123 Main Street, Test City",
      city: "London",
      phone: matchedTyre.provider.company_phone || "+44 20 7946 0912",
      email: matchedTyre.provider.company_email || "company@test.com",
      image:
        matchedTyre.provider.logo_full_path ||
        "https://mmcclub.co.uk/storage/app/public/provider/logo/2026-01-19-696db787ec8d0.png",
      capabilities: {
        inStock: true,
        offersRecoveryTruck: true,
        canComeToLocation: true,
      },
    };
  } else {
    provider = DEFAULT_PROVIDERS[0];
  }

  // 4. Trigger Real Backend Cart Add
  await addTyreToCart({
    provider_id: provider.id,
    service_id: matchedTyre?.service_id || DEFAULT_SERVICE_ID,
    category_id: TYRE_CATEGORY_ID,
    tyre_id: matchedTyre?.id,
    quantity: params.tyreQuantity || 1,
  });

  const tyreSize = params.tyreSize || matchedTyre?.size || "195/65 R15";
  const qty = params.tyreQuantity || 1;

  // Calculate quote based on dynamic tyre or standard breakdown
  let tyreUnitBase = matchedTyre?.price ? (matchedTyre.price > 500 ? 50 : matchedTyre.price) : 50;
  let tyrePrice = tyreUnitBase * qty;
  let labourPrice = 25 * qty;
  let callOutFee = params.assistanceType === "recovery_truck" ? 45 : 10;
  const fareAmount = params.category === "emergency" && qty === 1 ? 120 : tyrePrice + labourPrice + callOutFee;

  const quote: QuoteSummary = {
    tyreDescription: `${tyreSize} - ${matchedTyre?.brand || "Bridgestone"}`,
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

  const formattedDateTime = `${params.scheduledDate || "Today"}, ${
    params.scheduledTimeSlot || "Immediate Dispatch"
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
    locationAddress: params.locationAddress || "Flat 4B, Baker Street, London",
    locationPostcode: params.locationPostcode || "NW1 6XE",
    latitude: lat,
    longitude: lng,
    vehicleMakeModel: params.vehicleMakeModel || "BMW 5 Series",
    vehicleRegistration: params.vehicleRegistration || "GF21 XYZ",
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
  bookingId: string
): Promise<TyreAssistanceBooking> {
  const bookings = getStoredBookings();
  const index = bookings.findIndex((b) => b.id === bookingId);
  if (index === -1) {
    throw new Error("Booking not found");
  }

  const booking = bookings[index];
  const zoneId =
    (typeof window !== "undefined" && localStorage.getItem(ZONE_KEY)) ||
    DEFAULT_ZONE_ID;

  // Real backend booking dispatch
  await sendBookingRequestToBackend({
    guest_id: "550e8400-e29b-41d4-a716-446655440000",
    payment_method: "cash_after_service",
    zone_id: zoneId,
    service_schedule: `${booking.scheduledDate} 10:00:00`,
    service_address_id: "6",
    service_location:
      booking.serviceLocationType === "workshop" ? "provider" : "customer",
    booking_type: booking.category === "emergency" ? "emergency" : "normal",
    car_registration_number: booking.vehicleRegistration,
    car_model: booking.vehicleMakeModel,
    notes: booking.notes || "Mobile tyre fitting required at location.",
  });

  booking.status = "assigning_technician";
  booking.updatedAt = new Date().toISOString();
  saveBookings(bookings);

  return booking;
}

export async function assignTechnicianToBooking(
  bookingId: string
): Promise<TyreAssistanceBooking> {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const bookings = getStoredBookings();
  const index = bookings.findIndex((b) => b.id === bookingId);
  if (index === -1) {
    throw new Error("Booking not found");
  }

  const isTruck = bookings[index].assistanceType === "recovery_truck";
  const technician = isTruck ? DEFAULT_TECHNICIANS[1] : DEFAULT_TECHNICIANS[0];

  bookings[index].status = "confirmed";
  bookings[index].technician = technician;
  bookings[index].updatedAt = new Date().toISOString();

  saveBookings(bookings);
  return bookings[index];
}

export async function cancelBooking(
  bookingId: string,
  reason?: string
): Promise<TyreAssistanceBooking> {
  const bookings = getStoredBookings();
  const index = bookings.findIndex((b) => b.id === bookingId);
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
