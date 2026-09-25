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
  variant_key?: string;
  quantity?: number;
  is_terms_accepted?: number;
}

export interface SendValetBookingPayload {
  payment_method: string;
  zone_id?: string;
  service_schedule: string;
  service_address_id?: string;
  service_location?: string;
  selected_slot_id?: string;
  car_registration_number: string;
  car_model?: string;
  car_color?: string;
  special_conditions?: string;
  notes?: string;
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

/**
 * Search providers by service ID using the MMC backend endpoint:
 * POST /customer/provider/search-by-service
 */
export const searchProvidersByService = async (
  serviceId: string = "16c0655b-38ca-412f-94d1-1db5463cf70c",
  limit: number = 10,
  offset: number = 1,
  zoneId: string = DEFAULT_ZONE_ID
): Promise<ValetProvider[]> => {
  const activeZone = getActiveZoneId(zoneId);

  try {
    const res = await apiClient.post<ProviderSearchResponse>(
      `/customer/provider/search-by-service`,
      {
        service_id: serviceId,
        service_ids: [serviceId],
      },
      {
        params: {
          service_id: serviceId,
          limit,
          offset,
        },
        headers: {
          zoneid: activeZone,
          zoneId: activeZone,
          "Content-Type": "application/json",
          Accept: "application/json",
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

    const mappedProviders: ValetProvider[] = providerList.map(
      (p: any, idx: number) => ({
        ...p,
        id: String(p.id),
        company_name: p.company_name || "Specialist Valeter",
        company_phone: p.company_phone || "",
        company_address: p.company_address || "London, United Kingdom",
        company_email: p.company_email || "",
        logo_full_path:
          p.logo_full_path ||
          p.logo ||
          "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=200&q=80",
        avg_rating: Number(p.avg_rating) || 4.8,
        rating_count: Number(p.rating_count) || 12,
        total_selected_services_price:
          Number(p.total_selected_services_price) || 0,
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
      })
    );

    return mappedProviders;
  } catch (error) {
    console.error("Failed to search providers:", error);
    return [];
  }
};

/**
 * Add Valet service to Cart
 * POST /customer/cart/add
 */
export const addValetToCart = async (
  payload: AddValetToCartPayload
): Promise<any> => {
  const activeZone = getActiveZoneId();

  try {
    const res = await apiClient.post(
      "/customer/cart/add",
      {
        guest_id: (typeof window !== "undefined" && localStorage.getItem("guest_id")) || "550e8400-e29b-41d4-a716-446655440000",
        service_id: payload.service_id,
        provider_id: payload.provider_id,
        variant_key: payload.variant_key || "basic-wash",
        quantity: payload.quantity ?? 1,
        is_terms_accepted: payload.is_terms_accepted ?? 1,
      },
      {
        headers: {
          zoneid: activeZone,
          zoneId: activeZone,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error("Cart Add Error:", error);
    throw error;
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

  const fcmToken = typeof window !== "undefined" ? localStorage.getItem("fcm_token") : null;
  const guestId = (typeof window !== "undefined" && localStorage.getItem("guest_id")) || "550e8400-e29b-41d4-a716-446655440000";

  try {
    const res = await apiClient.post(
      "/customer/booking/request/send",
      {
        guest_id: guestId,
        payment_method: payload.payment_method || "cash_after_service",
        zone_id: activeZone,
        service_schedule: payload.service_schedule,
        service_address_id: payload.service_address_id || "2",
        service_location: payload.service_location || "customer",
        selected_slot_id:
          payload.selected_slot_id || "00dc5d50-fa91-4c49-b74a-1326fc8a1fdf",
        car_registration_number: payload.car_registration_number,
        car_model: payload.car_model || "Standard Vehicle",
        car_color: payload.car_color || "Silver",
        special_conditions:
          payload.special_conditions || "Doorstep vehicle valet service",
        notes: payload.notes || "Booked from MMC Customer Portal",
        ...(fcmToken ? { fcm_token: fcmToken } : {}),
      },
      {
        headers: {
          zoneid: activeZone,
          zoneId: activeZone,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error("Booking Request Error:", error);
    throw error;
  }
};
