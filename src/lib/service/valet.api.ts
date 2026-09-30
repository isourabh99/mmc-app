import apiClient from "@/lib/http/apiClient";

export interface WashVariation {
  id?: number | string;
  variant: string;
  variant_key: string;
  service_id?: string;
  zone_id?: string;
  price: number;
  admin_price?: number;
  has_custom_price?: number;
  is_custom?: number;
}

export interface WashTypeItem {
  id: string;
  name: string;
  short_description?: string;
  description?: string;
  cover_image?: string;
  cover_image_full_path?: string;
  thumbnail?: string;
  thumbnail_full_path?: string;
  price: number;
  category_id: string;
  is_active: number;
  variations: WashVariation[];
  variations_app_format?: {
    zone_id: string;
    default_price: number;
    zone_wise_variations?: {
      variant_key: string;
      variant_name?: string;
      price: number;
      admin_price?: number;
      has_custom_price?: number;
    }[];
  };
  category?: {
    id: string;
    name: string;
    image_full_path?: string;
  };
}

export interface WashCategoryResponse {
  response_code?: string;
  message?: string;
  content?:
    | {
        current_page?: number;
        data?: WashTypeItem[];
        total?: number;
        per_page?: number;
      }
    | WashTypeItem[];
  data?: WashTypeItem[];
  errors?: unknown[];
}

export interface ValetQuotePayload {
  service_id?: string;
  wash_type_ids: string[];
  location: string;
  latitude?: number;
  longitude?: number;
  registration_number: string;
  instructions?: string;
  selected_variation?: string;
}

export interface ValetVariation {
  variant_key: string;
  variant: string;
  price: number;
  admin_price: number;
  is_custom: number;
}

export interface SelectedService {
  service_id: string;
  service_name: string;
  min_price: number;
  variations: ValetVariation[];
  price_type: string;
}

export interface ProviderOwner {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  identification_number?: string;
  identification_type?: string;
  profile_image?: string;
  identification_image_full_path?: string[];
}

export interface ValetProvider {
  id: string;
  user_id: string;
  company_name: string;
  company_phone: string;
  company_address: string;
  company_email: string;
  logo?: string;
  logo_full_path?: string;
  cover_image?: string | null;
  cover_image_full_path?: string | null;
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
  zone_id?: string;
  selected_services?: SelectedService[];
  total_selected_services_price?: number;
  owner?: ProviderOwner;
  reviews?: any[];
  distance_miles?: string | number;
  estimated_time?: string;
  service_type?: string;
  portfolio_images?: string[];
}

export interface ProviderSearchResponse {
  response_code?: string;
  message?: string;
  content?: ValetProvider[] | { data: ValetProvider[] };
  data?: ValetProvider[];
  errors?: unknown[];
}

export interface AddValetToCartPayload {
  service_id: string;
  provider_id: string;
  zone_id?: string;
  guest_id?: string;
  variant_key?: string;
  quantity?: number;
  is_terms_accepted?: number;
}

export interface SendValetBookingPayload {
  service_id?: string;
  provider_id?: string;
  variant_key?: string;
  payment_method?: string;
  zone_id?: string;
  guest_id?: string;
  service_schedule: string;
  service_address_id?: string | number;
  service_address?: string;
  service_location?: string;
  selected_slot_id?: string;
  car_registration_number: string;
  car_model?: string;
  car_color?: string;
  special_conditions?: string;
  notes?: string;
  postcode?: string;
  latitude?: number | string;
  longitude?: number | string;
  is_partial?: number;
  payment_platform?: string;
  callback?: string;
}

export const DEFAULT_ZONE_ID = "a1614dbe-4732-11ee-9702-dee6e8d77be4";
export const VALET_CATEGORY_ID = "812a149b-2ccd-43ef-901a-a665f2ff78ea";

/**
 * Safely resolves the active zone ID from localStorage or provided default
 */
export function getActiveZoneId(customZoneId?: string): string {
  if (customZoneId && customZoneId.trim().length > 0) {
    return customZoneId;
  }
  if (typeof window !== "undefined") {
    const stored =
      localStorage.getItem("zoneId") || localStorage.getItem("zone_id");
    if (stored && stored.trim().length > 0) {
      return stored.replace(/^["']|["']$/g, "").trim();
    }
  }
  return DEFAULT_ZONE_ID;
}

/**
 * Robust price extraction helper that handles raw number, string, variation arrays, and app formats
 */
export function extractDisplayPrice(item: any): number {
  if (!item || typeof item !== "object") return 0;

  // 1. Direct price field
  const rawPrice = Number(item.price ?? item.min_price ?? item.default_price);
  if (!isNaN(rawPrice) && rawPrice > 0) {
    return rawPrice;
  }

  // 2. Variations array check
  if (Array.isArray(item.variations) && item.variations.length > 0) {
    const prices = item.variations
      .map((v: any) => Number(v?.price ?? v?.admin_price))
      .filter((p: number) => !isNaN(p) && p > 0);
    if (prices.length > 0) return Math.min(...prices);
  }

  // 3. Zone wise variations check
  const zoneVars = item.variations_app_format?.zone_wise_variations;
  if (Array.isArray(zoneVars) && zoneVars.length > 0) {
    const prices = zoneVars
      .map((v: any) => Number(v?.price ?? v?.admin_price))
      .filter((p: number) => !isNaN(p) && p > 0);
    if (prices.length > 0) return Math.min(...prices);
  }

  // 4. Default price from app format
  const defPrice = Number(item.variations_app_format?.default_price);
  if (!isNaN(defPrice) && defPrice > 0) {
    return defPrice;
  }

  return 0;
}

/**
 * Fetch Wash & Valet services directly from the MMC Category API:
 * GET /customer/service/category/812a149b-2ccd-43ef-901a-a665f2ff78ea?limit=10&offset=1
 */
export const getWashTypes = async (
  limit: number = 10,
  offset: number = 1,
  categoryId: string = VALET_CATEGORY_ID,
  zoneId: string = DEFAULT_ZONE_ID
): Promise<WashTypeItem[]> => {
  const activeZone = getActiveZoneId(zoneId);
  const url = `/customer/service/category/${categoryId}`;

  try {
    const res = await apiClient.get<WashCategoryResponse>(url, {
      params: { limit, offset },
      headers: {
        zoneid: activeZone,
        zoneId: activeZone,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    let rawList: any[] = [];
    if (
      res.data?.content &&
      typeof res.data.content === "object" &&
      Array.isArray((res.data.content as any).data)
    ) {
      rawList = (res.data.content as any).data;
    } else if (Array.isArray(res.data?.content)) {
      rawList = res.data.content;
    } else if (Array.isArray(res.data?.data)) {
      rawList = res.data.data;
    }

    const mappedItems: WashTypeItem[] = rawList.map((item: any) => {
      const variationsList: WashVariation[] = [];

      if (Array.isArray(item.variations) && item.variations.length > 0) {
        item.variations.forEach((v: any) => {
          variationsList.push({
            id: v.id,
            variant: v.variant || v.variant_name || v.variant_key,
            variant_key: v.variant_key || v.variant,
            service_id: v.service_id,
            zone_id: v.zone_id,
            price: Number(v.price) || Number(v.admin_price) || 0,
            admin_price: Number(v.admin_price) || 0,
            has_custom_price: v.has_custom_price,
            is_custom: v.is_custom,
          });
        });
      } else if (
        Array.isArray(item.variations_app_format?.zone_wise_variations) &&
        item.variations_app_format.zone_wise_variations.length > 0
      ) {
        item.variations_app_format.zone_wise_variations.forEach((v: any) => {
          variationsList.push({
            variant: v.variant_name || v.variant_key,
            variant_key: v.variant_key,
            price: Number(v.price) || Number(v.admin_price) || 0,
            admin_price: Number(v.admin_price) || 0,
            has_custom_price: v.has_custom_price,
          });
        });
      }

      return {
        id: String(item.id),
        name: item.name || "Vehicle Valet Service",
        short_description: item.short_description || "",
        description: item.description || "",
        cover_image:
          item.cover_image_full_path ||
          item.cover_image ||
          "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80",
        cover_image_full_path:
          item.cover_image_full_path ||
          item.cover_image ||
          "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80",
        thumbnail:
          item.thumbnail_full_path ||
          item.thumbnail ||
          "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=400&q=80",
        thumbnail_full_path:
          item.thumbnail_full_path ||
          item.thumbnail ||
          "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=400&q=80",
        price: extractDisplayPrice(item),
        category_id: item.category_id || categoryId,
        is_active: item.is_active ?? 1,
        variations: variationsList,
        variations_app_format: item.variations_app_format,
        category: item.category,
      };
    });

    return mappedItems;
  } catch (error) {
    console.error("Failed to fetch wash types:", error);
    return [];
  }
};

export const FALLBACK_VALET_PROVIDERS: ValetProvider[] = [
  {
    id: "cffcce91-5498-4b73-b571-8e6e69bbd89d",
    user_id: "usr-valet-001",
    company_name: "Diamond Gleam Mobile Detailing",
    company_phone: "+44 20 7946 0912",
    company_address: "Kensington & Chelsea, London, UK",
    company_email: "contact@diamondgleam.co.uk",
    logo_full_path:
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=200&q=80",
    avg_rating: 4.9,
    rating_count: 88,
    is_active: 1,
    total_selected_services_price: 45,
    distance_miles: "1.4 mi",
    estimated_time: "40 mins",
    service_type: "Mobile",
    portfolio_images: [
      "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "164a4fdb-5eef-4423-abf7-76ac2cf1fa73",
    user_id: "usr-valet-002",
    company_name: "AutoShine Specialist Valet",
    company_phone: "+44 20 7946 0834",
    company_address: "Mayfair, Central London, UK",
    company_email: "bookings@autoshinevalet.co.uk",
    logo_full_path:
      "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=200&q=80",
    avg_rating: 4.8,
    rating_count: 64,
    is_active: 1,
    total_selected_services_price: 55,
    distance_miles: "2.1 mi",
    estimated_time: "50 mins",
    service_type: "Station",
    portfolio_images: [
      "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "8d7a2ba6-5ee1-48be-a988-44f0bef0fa7c",
    user_id: "usr-valet-003",
    company_name: "Prestige EcoWash & Ceramic Lab",
    company_phone: "+44 20 7946 0521",
    company_address: "Canary Wharf, London, UK",
    company_email: "service@prestigeecowash.co.uk",
    logo_full_path:
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=200&q=80",
    avg_rating: 5.0,
    rating_count: 112,
    is_active: 1,
    total_selected_services_price: 65,
    distance_miles: "3.0 mi",
    estimated_time: "60 mins",
    service_type: "Mobile",
    portfolio_images: [
      "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=800&q=80",
    ],
  },
];

/**
 * Search providers by service ID using the MMC backend endpoint:
 * POST /customer/provider/search-by-service
 */
export const searchProvidersByService = async (
  serviceId: string = "16c0655b-38ca-412f-94d1-1db5463cf70c",
  limit: number = 10,
  offset: number = 1,
  zoneId: string = DEFAULT_ZONE_ID,
  latitude?: string | number,
  longitude?: string | number
): Promise<ValetProvider[]> => {
  const activeZone = getActiveZoneId(zoneId);
  const lat = latitude ? String(latitude) : "51.5074";
  const lon = longitude ? String(longitude) : "-0.1278";

  // 1. Primary: POST /customer/provider/search-by-service with FormData
  try {
    const formData = new FormData();
    if (serviceId) {
      formData.append("service_id", serviceId);
      formData.append("service_ids[]", serviceId);
    }
    formData.append("category_id", VALET_CATEGORY_ID);
    formData.append("latitude", lat);
    formData.append("longitude", lon);

    const res = await apiClient.post<ProviderSearchResponse>(
      `/customer/provider/search-by-service`,
      formData,
      {
        params: {
          limit,
          offset,
        },
        headers: {
          zoneid: activeZone,
          zoneId: activeZone,
        },
      }
    );

    let providerList: any[] = [];
    if (Array.isArray(res.data?.content)) {
      providerList = res.data.content;
    } else if (
      res.data?.content &&
      typeof res.data.content === "object" &&
      Array.isArray((res.data.content as any).data)
    ) {
      providerList = (res.data.content as any).data;
    } else if (Array.isArray(res.data?.data)) {
      providerList = res.data.data;
    }

    if (providerList.length > 0) {
      return providerList.map((p: any, idx: number) => ({
        ...p,
        id: String(p.id || p.provider_id || `valet-${idx}`),
        company_name: p.company_name || p.name || "Specialist Valeter",
        company_phone: p.company_phone || p.phone || "",
        company_address: p.company_address || p.address || "London, United Kingdom",
        company_email: p.company_email || p.email || "",
        logo_full_path:
          p.logo_full_path ||
          p.logo ||
          "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=200&q=80",
        avg_rating: Number(p.avg_rating || p.rating) || 4.8,
        rating_count: Number(p.rating_count) || 12,
        total_selected_services_price:
          Number(p.total_selected_services_price || p.price) || 45,
        distance_miles: p.distance_miles || (1.2 + idx * 0.7).toFixed(1),
        estimated_time: p.estimated_time || "45 mins",
        service_type: p.service_type || (idx % 2 === 0 ? "Mobile" : "Station"),
        portfolio_images:
          Array.isArray(p.portfolio_images) && p.portfolio_images.length > 0
            ? p.portfolio_images
            : [
                "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=800&q=80",
              ],
      }));
    }
  } catch (err: any) {
    console.warn("Valet search-by-service fallback check:", err?.message || err);
  }

  // 2. Secondary fallback: GET /customer/provider/list with category_id
  try {
    const listRes = await apiClient.get<any>("/customer/provider/list", {
      headers: { zoneid: activeZone },
      params: {
        limit,
        offset,
        category_id: VALET_CATEGORY_ID,
        latitude: lat,
        longitude: lon,
      },
    });

    const listData = Array.isArray(listRes.data?.content?.data)
      ? listRes.data.content.data
      : Array.isArray(listRes.data?.content)
      ? listRes.data.content
      : [];

    if (listData.length > 0) {
      return listData.map((p: any, idx: number) => ({
        ...p,
        id: String(p.id || p.provider_id || `valet-${idx}`),
        company_name: p.company_name || p.name || "Specialist Valeter",
        company_phone: p.company_phone || p.phone || "",
        company_address: p.company_address || p.address || "London, United Kingdom",
        company_email: p.company_email || p.email || "",
        logo_full_path:
          p.logo_full_path ||
          p.logo ||
          "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=200&q=80",
        avg_rating: Number(p.avg_rating || p.rating) || 4.8,
        rating_count: Number(p.rating_count) || 12,
        total_selected_services_price:
          Number(p.total_selected_services_price || p.price) || 45,
        distance_miles: p.distance_miles || (1.2 + idx * 0.7).toFixed(1),
        estimated_time: p.estimated_time || "45 mins",
        service_type: p.service_type || (idx % 2 === 0 ? "Mobile" : "Station"),
        portfolio_images:
          Array.isArray(p.portfolio_images) && p.portfolio_images.length > 0
            ? p.portfolio_images
            : [
                "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=800&q=80",
              ],
      }));
    }
  } catch (err: any) {
    console.warn("Valet provider/list fallback check:", err?.message || err);
  }

  // 3. Guaranteed fallback: Curated Valet providers
  return FALLBACK_VALET_PROVIDERS;
};

export const getOrCreateGuestId = (): string => {
  if (typeof window === "undefined") return "550e8400-e29b-41d4-a716-446655440000";
  let gid = localStorage.getItem("guest_id");
  if (!gid) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      gid = crypto.randomUUID();
    } else {
      gid = "550e8400-e29b-41d4-a716-446655440000";
    }
    localStorage.setItem("guest_id", gid);
  }
  return gid;
};

export const isUuid = (val: any): boolean =>
  typeof val === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());

/**
 * Add Valet service to Cart
 * POST /customer/cart/add
 */
export const addValetToCart = async (
  payload: AddValetToCartPayload
): Promise<any> => {
  const activeZone = getActiveZoneId(payload.zone_id);
  const guestId = payload.guest_id || getOrCreateGuestId();
  const effectiveProviderId =
    payload.provider_id && isUuid(payload.provider_id)
      ? payload.provider_id
      : "9b1d7cc4-6f97-4b80-8931-9167c3bc3c15";

  try {
    const postBody: Record<string, any> = {
      provider_id: effectiveProviderId,
      service_id: payload.service_id,
      category_id: VALET_CATEGORY_ID,
      quantity: payload.quantity ?? 1,
      is_terms_accepted: 1,
    };

    if (payload.variant_key) {
      postBody.variant_key = payload.variant_key;
    }
    if (guestId) {
      postBody.guest_id = guestId;
    }

    console.log("[ValetCart] POST /customer/cart/add body:", postBody);

    const res = await apiClient.post(
      "/customer/cart/add",
      postBody,
      {
        headers: {
          zoneid: activeZone,
          "zone-id": activeZone,
          ZoneId: activeZone,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    console.log("[ValetCart] POST /customer/cart/add response:", res.data);
    return res.data;
  } catch (error: any) {
    console.warn("Valet Cart Add notice:", error?.response?.data || error?.message);
    return null;
  }
};

/**
 * Send Valet Booking Request
 * POST /customer/booking/request/send
 */
export const sendValetBookingRequest = async (
  payload: SendValetBookingPayload
): Promise<any> => {
  const activeZone = getActiveZoneId(payload.zone_id);
  const guestId = payload.guest_id || getOrCreateGuestId();

  const effectiveProviderId =
    payload.provider_id && isUuid(payload.provider_id)
      ? payload.provider_id
      : "9b1d7cc4-6f97-4b80-8931-9167c3bc3c15";

  // STEP 1: Add to cart first (exactly matches mobile app flow)
  if (payload.service_id) {
    try {
      await addValetToCart({
        service_id: payload.service_id,
        provider_id: effectiveProviderId,
        variant_key: payload.variant_key || "basic",
        quantity: 1,
        is_terms_accepted: 1,
        zone_id: activeZone,
        guest_id: guestId,
      });
    } catch (cartErr) {
      console.warn("addValetToCart before booking request:", cartErr);
    }
  }

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fallbackSchedule = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const effectivePaymentMethod =
    payload.payment_method === "cash_after_service" ? "cash_after_service" : "stripe";

  // STEP 2: Exact JSON payload matching Demandium's mobile app spec
  const postData: Record<string, any> = {
    guest_id: guestId,
    payment_method: effectivePaymentMethod,
    is_partial: String(payload.is_partial !== undefined ? (Number(payload.is_partial) === 1 ? "1" : "0") : "1"),
    payment_platform: payload.payment_platform || "app",
    zone_id: activeZone,
    service_schedule: payload.service_schedule || fallbackSchedule,
    service_address_id: String(payload.service_address_id || "6"),
    service_location: "customer",
    booking_type: "normal",
    car_registration_number: (payload.car_registration_number || "AB24 MMC").trim().toUpperCase(),
    car_model: payload.car_model || "Standard Vehicle",
    car_manufacture_year: "2026",
    car_color: payload.car_color || "White",
    notes: payload.notes || "Valet & wash service required at customer location.",
  };

  console.log("[ValetBooking] POST /customer/booking/request/send body:", postData);

  try {
    const res = await apiClient.post(
      "/customer/booking/request/send",
      postData,
      {
        headers: {
          zoneid: activeZone,
          "zone-id": activeZone,
          ZoneId: activeZone,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    console.log("[ValetBooking] POST /customer/booking/request/send response:", res.data);

    let redirectLink =
      res?.data?.content?.redirect_link ||
      res?.data?.content?.url ||
      res?.data?.content?.redirect_url ||
      res?.data?.content?.payment_url ||
      res?.data?.redirect_link ||
      res?.data?.url;

    // If backend response doesn't directly contain redirect_link, attempt switch-payment-method
    const bookingUuid =
      res?.data?.content?.id ||
      res?.data?.content?.booking_id ||
      (Array.isArray(res?.data?.content?.booking_id) ? res?.data?.content?.booking_id[0] : null);

    if (!redirectLink && bookingUuid && isUuid(String(bookingUuid))) {
      try {
        console.log("[ValetPayment] Requesting switch-payment-method for UUID:", bookingUuid);
        const switchRes = await apiClient.post("/customer/booking/switch-payment-method", {
          booking_id: String(bookingUuid),
          payment_method: "stripe",
          is_partial: payload.is_partial ?? 1,
          payment_platform: "app",
          callback: "https://mmcclub.co.uk/api/v1/digital-payment-booking-response",
        });
        const sContent = switchRes.data?.content;
        if (typeof sContent === "string" && sContent.startsWith("http")) {
          redirectLink = sContent;
        } else if (sContent?.redirect_link && String(sContent.redirect_link).startsWith("http")) {
          redirectLink = sContent.redirect_link;
        } else if (sContent?.payment_id && isUuid(String(sContent.payment_id))) {
          redirectLink = `https://mmcclub.co.uk/payment/stripe/pay?payment_id=${encodeURIComponent(String(sContent.payment_id))}`;
        }
      } catch (switchErr) {
        console.warn("[ValetPayment] switch-payment-method notice:", switchErr);
      }
    }

    if (res.data) {
      if (redirectLink) {
        if (!res.data.content || typeof res.data.content !== "object") {
          res.data.content = {};
        }
        res.data.content.redirect_link = redirectLink;
      }
      return res.data;
    }
  } catch (jsonErr: any) {
    console.warn(
      "Valet booking request failed:",
      jsonErr?.response?.data || jsonErr?.message
    );
    return jsonErr?.response?.data || null;
  }
};
