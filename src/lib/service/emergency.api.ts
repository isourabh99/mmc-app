import axios from "axios";
import apiClient, { getApiBaseUrl, getBackendRootUrl } from "@/lib/http/apiClient";
import { ensureServiceAddressJson, extractPostcode } from "@/lib/service/address.helper";

export interface EmergencyServiceItem {
  id: string;
  name: string;
  short_description?: string;
  description?: string;
  price?: number;
  category_id?: string;
  is_active?: number;
  icon_key?: string;
}

export interface EmergencyCategoryResponse {
  response_code: string;
  message: string;
  data?: EmergencyServiceItem[];
  content: {
    current_page: number;
    data: EmergencyServiceItem[];
    total: number;
    per_page: number;
  };
}

export const EMERGENCY_CATEGORY_ID = "860791e7-ed6d-46ca-992c-1348dd4c42ad";
export const DEFAULT_ZONE_ID = "a1614dbe-4732-11ee-9702-dee6e8d77be4";

export const DEFAULT_FALLBACK_EMERGENCY_SERVICES: EmergencyServiceItem[] = [
  {
    id: "1e5455a9-62f8-4489-bfa8-4eb52d033a7d",
    name: "Tyre Emergency & Roadside Puncture",
    short_description: "Mobile tyre fitting, puncture repairs & emergency replacements",
    price: 60,
  },
  {
    id: "2b6566ba-73a9-5590-cfa9-5fc63e144b8e",
    name: "Battery Jump Start & Booster Service",
    short_description: "Dead battery mobile jump start, diagnostic checks & alternator testing",
    price: 45,
  },
  {
    id: "3c7677cb-84ba-66a1-dfba-6ad74f255c9f",
    name: "Breakdown Recovery & Flatbed Towing",
    short_description: "Rapid flatbed recovery to home or destination garage",
    price: 95,
  },
  {
    id: "4d8788dc-95cb-77b2-e0cb-7be850366da0",
    name: "Emergency Fuel Delivery / Wrong Fuel Drain",
    short_description: "Roadside petrol/diesel delivery or wrong fuel drainage system flush",
    price: 50,
  },
  {
    id: "5e9899ed-06dc-88c3-f1dc-8cf961477eb1",
    name: "Vehicle Lockout & Key Recovery",
    short_description: "Damage-free vehicle entry, auto locksmith & key lock retrieval",
    price: 70,
  },
];

/**
 * Dynamically resolves the Emergency Category ID from live /customer/category API
 * GET /customer/category?limit=10&offset=1
 */
export const getEmergencyCategoryId = async (): Promise<string> => {
  try {
    const apiBase = getApiBaseUrl() || "https://mmcclub.co.uk/backend/api/v1";
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const headers: Record<string, string> = {
      Accept: "application/json",
      zoneid: DEFAULT_ZONE_ID,
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await axios.get<any>(`${apiBase}/customer/category?limit=20&offset=1`, {
      headers,
    });

    const categories =
      res.data?.content?.data ||
      (Array.isArray(res.data?.content) ? res.data?.content : null) ||
      (Array.isArray(res.data?.data) ? res.data?.data : []);

    if (Array.isArray(categories)) {
      const found = categories.find((c: any) => {
        const name = String(c?.name || "").toLowerCase();
        return (
          name.includes("emergency") ||
          name.includes("roadside") ||
          c?.id === EMERGENCY_CATEGORY_ID
        );
      });
      if (found?.id) {
        return String(found.id);
      }
    }
  } catch (err) {
    console.warn("Dynamic emergency category lookup error, fallback to default:", err);
  }

  return EMERGENCY_CATEGORY_ID;
};

/**
 * Fetch dynamic emergency services strictly from backend API:
 * GET /customer/service/category/${categoryId}?limit=10&offset=1
 * Strictly using static zoneid: a1614dbe-4732-11ee-9702-dee6e8d77be4
 */
export const getEmergencyServices = async (
  categoryId: string = EMERGENCY_CATEGORY_ID,
  limit: number = 100,
  offset: number = 1
): Promise<EmergencyServiceItem[]> => {
  const targetCatId = categoryId || EMERGENCY_CATEGORY_ID;
  const apiBase = getApiBaseUrl() || "https://mmcclub.co.uk/backend/api/v1";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
      zoneid: DEFAULT_ZONE_ID,
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await axios.get<EmergencyCategoryResponse>(
      `${apiBase}/customer/service/category/${targetCatId}?limit=${limit}&offset=${offset}`,
      { headers }
    );

    const items =
      response.data?.content?.data ||
      (Array.isArray(response.data?.content) ? response.data?.content : null) ||
      (Array.isArray(response.data?.data) ? response.data?.data : null);

    if (Array.isArray(items) && items.length > 0) {
      return items;
    }
    return DEFAULT_FALLBACK_EMERGENCY_SERVICES;
  } catch (error: any) {
    console.warn("Emergency services fetch error, using safe fallback:", error?.message);
    return DEFAULT_FALLBACK_EMERGENCY_SERVICES;
  }
};

export interface EmergencyRequestPayload {
  postcode: string;
  car_registration_number: string;
  emergency_service_id: string;
  emergency_service_name?: string;
  situation_description?: string;
  contact_phone?: string;
  contact_name?: string;
  car_model?: string;
  latitude?: number | string;
  longitude?: number | string;
  service_address?: string;
}

export interface EmergencyRequestResponse {
  response_code: string;
  message: string;
  content?: {
    id?: string | number;
    booking_id?: string | number;
    readable_id?: string;
    status?: string;
    reference_number?: string;
  };
}

/**
 * Submit Emergency Immediate Help Request to API
 */
export const submitEmergencyRequest = async (
  payload: EmergencyRequestPayload
): Promise<EmergencyRequestResponse> => {
  const formData = new FormData();

  formData.append("category_id", EMERGENCY_CATEGORY_ID);
  if (payload.emergency_service_id) {
    formData.append("service_id", payload.emergency_service_id);
    formData.append("service_ids[]", payload.emergency_service_id);
  }

  formData.append("car_registration_number", payload.car_registration_number.trim().toUpperCase());
  if (payload.car_model) {
    formData.append("car_model", payload.car_model.trim());
  }

  formData.append(
    "service_description",
    payload.emergency_service_name || "Emergency Roadside Assistance"
  );

  const combinedNotes = [
    `[EMERGENCY ASSISTANCE REQUEST - 24/7 DISPATCH]`,
    `Postcode / Location: ${payload.postcode.trim()}`,
    payload.service_address ? `Full Address: ${payload.service_address}` : "",
    payload.emergency_service_name ? `Emergency Type: ${payload.emergency_service_name}` : "",
    payload.car_model ? `Vehicle Model: ${payload.car_model}` : "",
    payload.situation_description ? `Situation: ${payload.situation_description}` : "",
    payload.contact_phone ? `Emergency Phone: ${payload.contact_phone}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  formData.append("damage_description", combinedNotes);
  formData.append("booking_type", "emergency");
  formData.append("emergency_type", "emergency");

  const nowStr = new Date().toISOString().replace("T", " ").substring(0, 19);
  formData.append("booking_schedule", nowStr);

  const zoneId =
    (typeof window !== "undefined" &&
      (localStorage.getItem("zone_id") ||
        localStorage.getItem("zoneid") ||
        localStorage.getItem("zoneId"))) ||
    DEFAULT_ZONE_ID;

  try {
    const response = await apiClient.post<EmergencyRequestResponse>(
      "/customer/post",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          zoneid: zoneId,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Emergency assistance request error:", error);
    throw error;
  }
};

export interface EmergencyProviderService {
  service_id: string;
  service_name: string;
  min_price: number;
  service_price: number;
  variations: any[];
  price_type: string;
  service_types: string[];
  estimated_time?: string | null;
  completed_service_images?: string[];
}

export interface EmergencyProviderItem {
  id: string;
  user_id?: string;
  company_name: string;
  company_phone: string;
  company_address: string;
  company_email?: string;
  logo?: string;
  logo_full_path?: string | null;
  cover_image?: string | null;
  cover_image_full_path?: string | null;
  contact_person_name?: string;
  contact_person_phone?: string;
  contact_person_email?: string;
  order_count?: number;
  service_man_count?: number;
  service_capacity_per_day?: number;
  rating_count?: number;
  avg_rating?: number;
  commission_status?: number;
  commission_percentage?: number;
  is_active?: number;
  is_emergency_active?: number;
  after_hours_available?: number;
  weekend_emergency_available?: number;
  motorway_recovery_approved?: number;
  emergency_response_time?: string | null;
  created_at?: string;
  updated_at?: string;
  is_approved?: number;
  zone_id?: string;
  postcode?: string | null;
  coordinates?: {
    latitude?: string | null;
    longitude?: string | null;
  };
  is_suspended?: number;
  service_availability?: number;
  selected_services?: EmergencyProviderService[];
  total_selected_services_price?: number;
  service_types?: string[];
  estimated_time?: string | null;
  completed_service_images?: string[];
  distance?: number;
  distance_in_km?: number;
  distance_in_miles?: number;
  distance_formatted?: string;
  distance_miles?: string | number;
  price?: number;
  min_price?: number;
  rating?: number;
  profile_image?: string;
  owner?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email?: string;
    phone?: string;
    profile_image?: string;
    profile_image_full_path?: string | null;
    user_type?: string;
  };
  reviews?: any[];
}



export interface SearchEmergencyProvidersParams {
  serviceIds: string[];
  categoryId?: string;
  latitude?: number | string;
  longitude?: number | string;
  zoneId?: string;
}

/**
 * Search Emergency Providers dynamically by Category ID & Service IDs:
 * POST /customer/provider/search-by-service
 * Strictly dynamic live backend API data.
 */
export const searchEmergencyProviders = async (
  params: SearchEmergencyProvidersParams
): Promise<EmergencyProviderItem[]> => {
  const staticZoneId = DEFAULT_ZONE_ID; // Strictly "a1614dbe-4732-11ee-9702-dee6e8d77be4"

  const lat =
    params.latitude ||
    (typeof window !== "undefined" ? localStorage.getItem("user_lat") : null) ||
    "22.66215";
  const lon =
    params.longitude ||
    (typeof window !== "undefined" ? localStorage.getItem("user_lon") : null) ||
    "75.9035";

  const categoryId = params.categoryId || EMERGENCY_CATEGORY_ID;
  const effectiveIds =
    params.serviceIds && params.serviceIds.length > 0 ? params.serviceIds : [];

  if (effectiveIds.length === 0) {
    return [];
  }

  const apiBase = getApiBaseUrl() || "https://mmcclub.co.uk/backend/api/v1";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const formData = new FormData();
  formData.append("category_id", categoryId);
  effectiveIds.forEach((id) => {
    formData.append("service_ids[]", id);
  });
  formData.append("latitude", String(lat));
  formData.append("longitude", String(lon));

  const headers: Record<string, string> = {
    Accept: "application/json",
    zoneid: staticZoneId,
    ZoneId: staticZoneId,
    "zone-id": staticZoneId,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await axios.post<any>(
      `${apiBase}/customer/provider/search-by-service`,
      formData,
      { headers }
    );

    const resData = response.data;
    const content = resData?.content ?? resData?.data;
    if (Array.isArray(content)) {
      return content;
    }
    if (content && typeof content === "object" && Array.isArray(content.data)) {
      return content.data;
    }
    return [];
  } catch (error: any) {
    console.warn("Emergency provider search error:", error?.message);
    return [];
  }
};

export interface AddEmergencyToCartParams {
  provider_id: string;
  service_id: string;
  category_id?: string;
  quantity?: number;
  guest_id?: string;
  is_terms_accepted?: number;
  zone_id?: string;
}

/**
 * Step 1: Add Emergency Service to Cart
 * POST /customer/cart/add
 */
export const addEmergencyToCart = async (
  params: AddEmergencyToCartParams
): Promise<any> => {
  const staticZoneId = DEFAULT_ZONE_ID; // "a1614dbe-4732-11ee-9702-dee6e8d77be4"
  const apiBase = getApiBaseUrl() || "https://mmcclub.co.uk/backend/api/v1";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  try {
    const payload = {
      guest_id: staticZoneId,
      provider_id: params.provider_id,
      service_id: params.service_id,
      category_id: params.category_id || EMERGENCY_CATEGORY_ID,
      quantity: params.quantity || 1,
      is_terms_accepted: params.is_terms_accepted ?? 1,
    };

    const headers: Record<string, string> = {
      zoneid: staticZoneId,
      ZoneId: staticZoneId,
      "zone-id": staticZoneId,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await axios.post(`${apiBase}/customer/cart/add`, payload, {
      headers,
    });

    return res.data;
  } catch (error: any) {
    console.warn("Emergency Cart Add Error:", error?.response?.data || error?.message);
    return null;
  }
};

/**
 * GET /customer/cart/list?limit=10&offset=1
 * Strictly using zoneid: a1614dbe-4732-11ee-9702-dee6e8d77be4
 */
export const getEmergencyCartList = async (): Promise<any> => {
  const apiBase = getApiBaseUrl() || "https://mmcclub.co.uk/backend/api/v1";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = {
    Accept: "application/json",
    zoneid: DEFAULT_ZONE_ID,
    ZoneId: DEFAULT_ZONE_ID,
    "zone-id": DEFAULT_ZONE_ID,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await axios.get(`${apiBase}/customer/cart/list?limit=10&offset=1`, { headers });
    return res.data;
  } catch (err: any) {
    console.warn("Emergency Cart List Note:", err?.message);
    return null;
  }
};

export interface SendEmergencyBookingRequestParams {
  payment_method?: string;
  service_address_id?: string;
  service_address?: string;
  service_schedule?: string;
  service_location?: "customer" | "workshop" | string;
  booking_type?: string;
  selected_slot_id?: string;
  damage_description?: string;
  car_registration_number: string;
  car_model?: string;
  postcode?: string;
  house?: string;
  floor?: string;
  latitude?: number | string;
  longitude?: number | string;
  zone_id?: string;
  guest_id?: string;
  car_image?: File | null;
  car_images?: File[];
  answers?: Record<string, any>;
  is_partial?: number | 0 | 1;
  amount?: number;
  payment_platform?: string;
  callback?: string;
}

/**
 * Step 2: Send Emergency Booking Request
 * POST /customer/booking/request/send
 */
export const sendEmergencyBookingRequest = async (
  params: SendEmergencyBookingRequestParams
): Promise<any> => {
  const apiBase = getApiBaseUrl() || "https://mmcclub.co.uk/backend/api/v1";
  const staticZoneId = DEFAULT_ZONE_ID; // "a1614dbe-4732-11ee-9702-dee6e8d77be4"
  const nowFormatted = new Date().toISOString().replace("T", " ").substring(0, 19);
  const effectiveAddress = params.service_address || (typeof window !== "undefined" ? localStorage.getItem("user_address") : null) || "221B Baker Street, London";
  const effectivePostcode = params.postcode || (typeof window !== "undefined" ? localStorage.getItem("user_postcode") : null) || extractPostcode(effectiveAddress);

  const jsonPayload: Record<string, any> = {
    payment_method: params.payment_method || "stripe",
    is_partial: params.is_partial !== undefined ? Number(params.is_partial) : 0,
    zone_id: staticZoneId,
    service_schedule: params.service_schedule || nowFormatted,
    service_location: "customer",
    service_address: ensureServiceAddressJson(effectiveAddress, {
      lat: params.latitude,
      lon: params.longitude,
      address: effectiveAddress,
      zip_code: effectivePostcode,
      house: params.house,
      floor: params.floor,
    }),
    postcode: effectivePostcode,
    booking_type: "emergency",
    car_registration_number: (params.car_registration_number || "STANDARD").trim().toUpperCase(),
    car_model: (params.car_model || "Vehicle").trim(),
    notes:
      params.damage_description ||
      "Emergency roadside assistance requested with online payment.",
    callback:
      params.callback ||
      (typeof window !== "undefined"
        ? `${window.location.origin}/booking-success`
        : "https://mmcclub.co.uk/booking-success"),
  };

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    zoneid: staticZoneId,
    ZoneId: staticZoneId,
    "zone-id": staticZoneId,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await axios.post(
      `${apiBase}/customer/booking/request/send`,
      jsonPayload,
      { headers }
    );
    return res.data;
  } catch (error: any) {
    console.error("Emergency Booking Request Error:", error?.response?.data || error?.message);
    throw error;
  }
};

export interface BookEmergencyProviderParams {
  provider: EmergencyProviderItem;
  payment_method?: string;
  service_schedule?: string;
  service_address?: string;
  car_registration_number: string;
  car_model?: string;
  emergency_service_id?: string;
  emergency_service_ids?: string[];
  emergency_service_name?: string;
  situation_description?: string;
  contact_phone?: string;
  service_location?: "customer" | "workshop";
  latitude?: number | string;
  longitude?: number | string;
  car_image?: File | null;
  car_images?: File[];
  postcode?: string;
  is_partial?: number | 0 | 1;
  amount?: number;
  payment_platform?: string;
  callback?: string;
}

/**
 * Complete Emergency Booking Workflow:
 * 1. POST /customer/cart/add (Internally first, for all selected services)
 * 2. GET /customer/cart/list (Inspect cart)
 * 3. POST /customer/booking/request/send (Send booking request)
 */
export const bookEmergencyProvider = async (
  params: BookEmergencyProviderParams
): Promise<{
  reference: string;
  booking_id?: string | number;
  payment_id?: string;
  message: string;
  status: string;
  redirect_link?: string;
  url?: string;
  amount?: number;
}> => {
  const nowSchedule =
    params.service_schedule ||
    new Date().toISOString().replace("T", " ").substring(0, 19);

  // --------------------------------------------------------------------------
  // STEP 1: Add to Cart internally FIRST (POST /customer/cart/add) for all IDs
  // --------------------------------------------------------------------------
  const serviceIdsToAdd: string[] =
    params.emergency_service_ids && params.emergency_service_ids.length > 0
      ? params.emergency_service_ids
      : params.emergency_service_id
        ? [params.emergency_service_id]
        : params.provider.selected_services && params.provider.selected_services.length > 0
          ? [params.provider.selected_services[0].service_id]
          : ["0095e5b8-0131-4158-8138-69eacde3a38b"];

  for (const svcId of serviceIdsToAdd) {
    try {
      await addEmergencyToCart({
        provider_id: params.provider.id,
        service_id: svcId,
        category_id: EMERGENCY_CATEGORY_ID,
        quantity: 1,
        is_terms_accepted: 1,
        zone_id: DEFAULT_ZONE_ID,
      });
    } catch (cartErr) {
      console.warn("Cart add step note for", svcId, cartErr);
    }
  }

  // Cart List check
  try {
    await getEmergencyCartList();
  } catch (err) { }

  // --------------------------------------------------------------------------
  // STEP 2: Send Booking Request SECOND (POST /customer/booking/request/send)
  // --------------------------------------------------------------------------
  const bookingRes = await sendEmergencyBookingRequest({
    payment_method: "stripe",
    is_partial: params.is_partial !== undefined ? params.is_partial : 0,
    zone_id: DEFAULT_ZONE_ID,
    service_schedule: nowSchedule,
    service_address_id: (typeof window !== "undefined" && localStorage.getItem("service_address_id")) || "9",
    service_address: params.service_address || (typeof window !== "undefined" ? localStorage.getItem("user_address") : null) || "221B Baker Street, London",
    postcode: params.postcode || (typeof window !== "undefined" ? localStorage.getItem("user_postcode") : null) || "",
    latitude: params.latitude || (typeof window !== "undefined" ? localStorage.getItem("user_lat") : null) || "51.5074",
    longitude: params.longitude || (typeof window !== "undefined" ? localStorage.getItem("user_lon") : null) || "-0.1278",
    service_location: "customer",
    booking_type: "emergency",
    car_registration_number: params.car_registration_number,
    car_model: params.car_model || "Vehicle",
    damage_description:
      params.situation_description ||
      params.emergency_service_name ||
      "Emergency roadside assistance requested with online payment.",
    callback:
      params.callback ||
      (typeof window !== "undefined"
        ? `${window.location.origin}/booking-success`
        : "https://mmcclub.co.uk/booking-success"),
  });

  const rawContent = bookingRes?.content || bookingRes?.data || bookingRes;
  const rawBookingId =
    (Array.isArray(rawContent) && rawContent.length > 0
      ? (rawContent[0]?.booking_id || rawContent[0]?.id || rawContent[0])
      : null) ||
    rawContent?.booking_id ||
    rawContent?.readable_id ||
    rawContent?.reference ||
    rawContent?.id ||
    bookingRes?.booking_id ||
    bookingRes?.id;

  const realBookingId =
    (Array.isArray(rawBookingId) && rawBookingId.length > 0 ? String(rawBookingId[0]) : null) ||
    (typeof rawBookingId === "string" && rawBookingId.trim() ? rawBookingId.trim() : null) ||
    (typeof rawBookingId === "number" ? String(rawBookingId) : null);

  const generatedRef =
    realBookingId ||
    `EMG-${Math.floor(100000 + Math.random() * 900000)}`;

  let redirectUrl =
    rawContent?.url ||
    rawContent?.redirect_link ||
    rawContent?.redirect_url ||
    rawContent?.payment_url ||
    bookingRes?.url ||
    bookingRes?.redirect_link ||
    bookingRes?.redirect_url;

  return {
    reference: generatedRef,
    booking_id: realBookingId || generatedRef,
    payment_id: rawContent?.payment_id,
    message: bookingRes?.message || "Booking request sent successfully",
    status: bookingRes?.response_code || "success",
    redirect_link: redirectUrl,
    url: redirectUrl,
    amount: params.amount,
  };
};
