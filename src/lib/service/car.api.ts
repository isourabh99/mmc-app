import apiClient, { getApiBaseUrl, getBackendRootUrl } from "@/lib/http/apiClient";

export interface CategoryZone {
  id: string;
  name: string;
  is_active: number;
}

export interface Category {
  id: string;
  parent_id: string;
  name: string;
  image: string | null;
  position: number;
  description: string | null;
  is_active: number;
  is_featured: number;
  created_at: string;
  updated_at: string;
  image_full_path: string | null;
  zones?: CategoryZone[];
}

export interface CategoryResponse {
  response_code: string;
  message: string;
  content: {
    current_page: number;
    data: Category[];
    total: number;
    per_page: number;
  };
  errors: unknown[];
}

export interface CarType {
  id: number;
  name: string;
  slug: string;
  status: number;
  created_at?: string;
  updated_at?: string;
}

export interface CarTypesResponse {
  response_code: string;
  message: string;
  content: CarType[];
  errors: unknown[];
}

export interface CarProvider {
  id: string;
  user_id?: string;
  company_name: string;
  company_phone: string;
  company_address: string;
  company_email: string;
  logo?: string;
  logo_full_path?: string;
  cover_image?: string | null;
  cover_image_full_path?: string | null;
  contact_person_name?: string;
  contact_person_phone?: string;
  contact_person_email?: string;
  order_count?: number;
  rating_count?: number;
  avg_rating?: number;
  is_active?: number;
  is_approved?: number;
  postcode?: string | null;
  coordinates?: {
    latitude: string;
    longitude: string;
  };
}

export interface CarItem {
  id: number;
  service_category: string;
  provider_id: string;
  category_id: string;
  car_type_id: number;
  features?: string[] | string | null;
  brand: string;
  model: string | null;
  manufacture_year: string | number | null;
  year: string | number | null;
  fuel_type: string | null;
  transmission_type: string | null;
  transmission?: string | null;
  registration_number: string | null;
  air_conditioning: number;
  service_type: string | null;
  available_hours_start: string | null;
  available_hours_end: string | null;
  preferred_areas: string | null;
  seating_capacity: number | null;
  daily_rate: string;
  hourly_rate: string;
  security_deposit: string | null;
  postcode: string | null;
  address: string | null;
  available_for: string | null;
  terms_conditions: string | null;
  pricing_type: string;
  description: string | null;
  images: string[];
  image_full_paths: string[];
  driving_license_full_path?: string | null;
  vehicle_registration_full_path?: string | null;
  insurance_documents_full_path?: string | null;
  mot_certificate_full_path?: string | null;
  status: number;
  created_at: string;
  updated_at: string;
  mileage_limit?: string | null;
  extra_mileage_charge?: string | null;
  fuel_policy?: string | null;
  delivery_fee?: string | null;
  min_driver_age?: number | null;
  min_booking_hours?: number | null;
  luggage_capacity?: number | null;
  amenities?: string[] | string | null;
  chauffeur_tier?: string | null;
  type?: CarType;
  category?: Category;
  provider?: CarProvider;
}

export interface CarListContent {
  current_page?: number;
  data: CarItem[];
  total?: number;
  per_page?: number;
  last_page?: number;
}

export interface CarListResponse {
  response_code: string;
  message: string;
  content: CarListContent | CarItem[];
  errors: unknown[];
}

export interface CarDetailResponse {
  response_code: string;
  message: string;
  content: CarItem;
  errors: unknown[];
}

export const getDigitalPaymentCallbackUrl = (): string => {
  const apiBase = getApiBaseUrl();
  return `${apiBase}/digital-payment-booking-response`;
};

export interface CarBookingPayload {
  car_id: number | string;
  start_date: string;
  end_date: string;
  pickup_time: string; // e.g. "10:00 AM"
  drop_time: string; // e.g. "02:00 PM"
  pickup_type: "delivery" | "self" | string;
  delivery_address?: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  pickup_location?: string;
  drop_location?: string;
  payment_method: string; // "cash_after_service" | "stripe" | "offline"
  is_partial?: number;
  payment_platform?: string;
  callback?: string;
  description?: string;
  note?: string;
  pricing_type?: "hourly" | "daily" | string;
  hours?: number;
  rent_amount?: number;
  total_amount?: number;
}

export interface CarBookingItemDetail {
  id?: number;
  booking_id?: string;
  car_id?: number;
  user_id?: string;
  start_date?: string;
  end_date?: string;
  pickup_type?: string;
  pickup_time?: string;
  drop_time?: string;
  description?: string;
  rent_amount?: number;
  delivery_fee?: number;
  security_deposit?: number;
  total_amount?: number;
  payment_method?: string;
  payment_status?: string;
  booking_status?: string;
  is_paid?: number;
  created_at?: string;
  updated_at?: string;
  booking?: {
    id?: string;
    readable_id?: number | string;
    [key: string]: unknown;
  };
  car?: CarItem;
  [key: string]: unknown;
}

export interface CarBookingContent {
  booking?: CarBookingItemDetail;
  id?: number;
  booking_id?: string;
  car_id?: number;
  start_date?: string;
  end_date?: string;
  pickup_type?: string;
  pickup_time?: string;
  drop_time?: string;
  total_amount?: number;
  payment_method?: string;
  payment_status?: string;
  booking_status?: string;
  delivery_address?: string;
  redirect_link?: string;
  redirect_url?: string;
  amount?: number;
  [key: string]: unknown;
}

export interface CarBookingResponse {
  response_code: string;
  message: string;
  content: CarBookingContent;
  errors: unknown[];
}

// ==========================================
// API CLIENT METHODS
// ==========================================

/**
 * Fetch all categories (e.g. Car Hire, Chauffeur, Tyre Fittings, etc.)
 */
export const getCarCategories = async (
  limit: number = 20,
  offset: number = 1
): Promise<Category[]> => {
  try {
    const response = await apiClient.get<any>(
      "/customer/category",
      {
        params: { limit, offset },
      }
    );
    const data = response.data?.content?.data || response.data?.content || response.data?.data || [];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn("Notice: getCarCategories fetch:", error);
    return [];
  }
};

export const mapBackendItemToCarItem = (item: any, defaultCatId?: string): CarItem => {
  if (!item) return item;
  return {
    id: item.id,
    service_category: item.service_category || item.category?.name || "Car Hire",
    provider_id: item.provider_id || item.provider?.id || "",
    category_id: item.category_id || defaultCatId || "35f3a758-c66b-444e-83fb-9325a345e2db",
    car_type_id: Number(item.car_type_id || item.type?.id || 1),
    features: item.features || null,
    brand: item.brand || item.name || item.service_name || "Vehicle",
    model: item.model || item.short_description || null,
    manufacture_year: item.manufacture_year || item.year || 2024,
    year: item.year || item.manufacture_year || 2024,
    fuel_type: item.fuel_type || "Petrol",
    transmission_type: item.transmission_type || item.transmission || "Automatic",
    transmission: item.transmission || item.transmission_type || "Automatic",
    registration_number: item.registration_number || "",
    air_conditioning: item.air_conditioning !== undefined ? Number(item.air_conditioning) : 1,
    service_type: item.service_type || "car_hire",
    available_hours_start: item.available_hours_start || "09:00:00",
    available_hours_end: item.available_hours_end || "18:00:00",
    preferred_areas: item.preferred_areas || null,
    seating_capacity: item.seating_capacity ? Number(item.seating_capacity) : 5,
    daily_rate: String(item.daily_rate || item.min_bidding_price || item.price || "0"),
    hourly_rate: String(item.hourly_rate || item.min_bidding_price || item.price || "0"),
    security_deposit: item.security_deposit ? String(item.security_deposit) : "0",
    postcode: item.postcode || item.provider?.postcode || item.address || null,
    address: item.address || item.provider?.company_address || null,
    available_for: item.available_for || "hire",
    terms_conditions: item.terms_conditions || item.description || null,
    pricing_type: item.pricing_type || "hourly",
    description: item.description || item.short_description || "",
    images: Array.isArray(item.images) ? item.images : typeof item.images === "string" ? [item.images] : [],
    image_full_paths: Array.isArray(item.image_full_paths)
      ? item.image_full_paths
      : typeof item.image_full_paths === "string"
      ? [item.image_full_paths]
      : [],
    status: item.status !== undefined ? Number(item.status) : 1,
    created_at: item.created_at || new Date().toISOString(),
    updated_at: item.updated_at || new Date().toISOString(),
    mileage_limit: item.mileage_limit || null,
    extra_mileage_charge: item.extra_mileage_charge || null,
    fuel_policy: item.fuel_policy || null,
    delivery_fee: item.delivery_fee ? String(item.delivery_fee) : "0",
    min_driver_age: item.min_driver_age || 21,
    min_booking_hours: item.min_booking_hours || 1,
    luggage_capacity: item.luggage_capacity || 2,
    amenities: item.amenities || null,
    chauffeur_tier: item.chauffeur_tier || null,
    type: item.type || (item.car_type ? item.car_type : undefined),
    category: item.category || undefined,
    provider: item.provider || undefined,
  };
};

/**
 * Fetch cars filtered by category ID
 */
export const getCarList = async (
  categoryId?: string,
  params?: { limit?: number; offset?: number }
): Promise<CarItem[]> => {
  const catId = categoryId || "35f3a758-c66b-444e-83fb-9325a345e2db";
  
  // Strategy 1: Try /customer/car/list with category_id
  try {
    const response = await apiClient.get<CarListResponse>("/customer/car/list", {
      params: {
        category_id: catId,
        limit: params?.limit || 50,
        offset: params?.offset || 1,
      },
    });

    const content = response.data?.content;
    let list: any[] = [];
    if (Array.isArray(content)) {
      list = content;
    } else if (content && Array.isArray(content.data)) {
      list = content.data;
    } else if (Array.isArray(response.data?.data)) {
      list = response.data.data;
    }

    if (list.length > 0) {
      return list.map((item) => mapBackendItemToCarItem(item, catId));
    }
  } catch (err) {
    console.warn("[CarHire] /customer/car/list with category_id notice:", err);
  }

  // Strategy 2: Try /customer/car/list without category_id filter
  try {
    const generalRes = await apiClient.get<any>("/customer/car/list", {
      params: {
        limit: params?.limit || 50,
        offset: params?.offset || 1,
      },
    });
    const gContent = generalRes.data?.content;
    const gList = Array.isArray(gContent)
      ? gContent
      : Array.isArray(gContent?.data)
      ? gContent.data
      : Array.isArray(generalRes.data?.data)
      ? generalRes.data.data
      : [];

    if (gList.length > 0) {
      return gList.map((item: any) => mapBackendItemToCarItem(item, catId));
    }
  } catch (err) {
    console.warn("[CarHire] /customer/car/list general notice:", err);
  }

  // Strategy 3: Try /customer/service/category/${catId}
  try {
    const sRes = await apiClient.get<any>(`/customer/service/category/${catId}`, {
      params: { limit: params?.limit || 50, offset: params?.offset || 1 },
    });
    const sData = sRes.data?.content?.data || sRes.data?.content || sRes.data?.data || [];
    if (Array.isArray(sData) && sData.length > 0) {
      return sData.map((item: any) => mapBackendItemToCarItem(item, catId));
    }
  } catch (err) {
    console.warn("[CarHire] /customer/service/category notice:", err);
  }

  return [];
};

/**
 * Fetch single car details by ID
 */
export const getCarDetails = async (
  carId: number | string
): Promise<CarItem | null> => {
  if (!carId) return null;

  try {
    const response = await apiClient.get<any>(
      `/customer/car/details/${carId}`
    );
    const content = response.data?.content;
    const item =
      content?.car ||
      (content && typeof content === "object" && !Array.isArray(content) && content.id ? content : null) ||
      response.data?.data;

    if (item && item.id) {
      return mapBackendItemToCarItem(
        item,
        item.category_id || "35f3a758-c66b-444e-83fb-9325a345e2db"
      );
    }
  } catch (error) {
    console.warn(`[CarHire] /customer/car/details/${carId} notice:`, error);
  }

  // Fallback 1: try finding in car list
  try {
    const list = await getCarList();
    const found = list.find((c) => String(c.id) === String(carId));
    if (found) return found;
  } catch {}

  // Fallback 2: try /customer/service/${carId}
  try {
    const sRes = await apiClient.get<any>(`/customer/service/${carId}`);
    const sItem = sRes.data?.content;
    if (sItem && sItem.id) {
      return mapBackendItemToCarItem(
        sItem,
        sItem.category_id || "35f3a758-c66b-444e-83fb-9325a345e2db"
      );
    }
  } catch {}

  return null;
};

/**
 * Fetch car types (e.g. Luxury, Electric, High-Performance, etc.)
 */
export const getCarTypes = async (): Promise<CarType[]> => {
  try {
    const response = await apiClient.get<any>("/customer/car/types");
    const raw = response.data;
    if (Array.isArray(raw?.content)) return raw.content;
    if (raw?.content && Array.isArray(raw.content.data)) return raw.content.data;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw)) return raw;
    return [];
  } catch (error) {
    console.warn("Failed to fetch car types:", error);
    return [];
  }
};

/**
 * Book a car hire
 */
export const bookCar = async (
  payload: CarBookingPayload
): Promise<CarBookingResponse> => {
  try {
    const sanitizedPayload = {
      ...payload,
      payment_method:
        payload.payment_method === "cash_on_delivery" || !payload.payment_method
          ? "cash_after_service"
          : payload.payment_method,
    };
    const response = await apiClient.post<CarBookingResponse>(
      "/customer/car/book",
      sanitizedPayload
    );
    return response.data;
  } catch (error) {
    console.error("Failed to book car:", error);
    throw error;
  }
};

// ==========================================
// UTILITY HELPERS FOR CLEAN DISPLAY & IMAGES
// ==========================================

export const formatCurrency = (val: string | number | null | undefined): string => {
  if (val === null || val === undefined || val === "") return "£0.00";
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return `£0.00`;
  return `£${num.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const normalizeCarImageUrl = (
  pathOrUrl: string | null | undefined,
  type: "car" | "service" | "provider" | "category" = "car"
): string => {
  if (!pathOrUrl || typeof pathOrUrl !== "string") return "";
  const trimmed = pathOrUrl.trim().replace(/^["']|["']$/g, "");
  if (
    !trimmed ||
    trimmed === "null" ||
    trimmed === "undefined" ||
    trimmed === "[]" ||
    trimmed.endsWith("/") ||
    trimmed === "def.png" ||
    trimmed.endsWith("/def.png") ||
    trimmed === "default.png" ||
    trimmed.endsWith("/default.png")
  ) {
    return "";
  }

  const apiBase = getBackendRootUrl();

  // If already a full URL, ensure domain/port matches active backend (fix localhost vs LAN IP issues)
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      const activeBase = new URL(apiBase);
      if (
        parsed.hostname === "localhost" ||
        parsed.hostname === "127.0.0.1" ||
        parsed.host !== activeBase.host
      ) {
        return `${activeBase.origin}${parsed.pathname}${parsed.search}`;
      }
    } catch {}
    return trimmed;
  }

  // If path contains storage/
  const cleanPath = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  if (cleanPath.startsWith("storage/") || cleanPath.includes("/storage/")) {
    const withoutLeading = cleanPath.startsWith("storage/") ? cleanPath : cleanPath.slice(cleanPath.indexOf("storage/"));
    return `${apiBase}/${withoutLeading}`;
  }

  // If subfolder already in path
  if (cleanPath.startsWith("car/") || cleanPath.startsWith("service/") || cleanPath.startsWith("provider/") || cleanPath.startsWith("category/")) {
    return `${apiBase}/storage/app/public/${cleanPath}`;
  }

  // Fallback to type prefix
  return `${apiBase}/storage/app/public/${type}/${cleanPath}`;
};

export const getCarGalleryImages = (car: CarItem | any): string[] => {
  const fallback =
    "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80";

  if (!car) return [fallback];

  const results: string[] = [];

  const addCandidate = (
    val: any,
    type: "car" | "service" | "provider" | "category" = "car"
  ) => {
    if (!val) return;
    if (Array.isArray(val)) {
      val.forEach((item) => addCandidate(item, type));
    } else if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            parsed.forEach((item) => addCandidate(item, type));
            return;
          }
        } catch {}
      }
      const normalized = normalizeCarImageUrl(trimmed, type);
      if (normalized && !results.includes(normalized)) {
        results.push(normalized);
      }
    }
  };

  // 1. image_full_paths
  addCandidate(car.image_full_paths, "car");

  // 2. images array or string
  addCandidate(car.images, "car");

  // 3. direct image fields
  addCandidate(car.image_full_path, "car");
  addCandidate(car.cover_image_full_path, "service");
  addCandidate(car.thumbnail_full_path, "service");
  addCandidate(car.cover_image, "service");
  addCandidate(car.image, "car");
  addCandidate(car.thumbnail, "service");
  addCandidate(car.service_image, "service");
  addCandidate(car.profile_image, "car");

  // 4. Provider image if no other image found
  if (results.length === 0 && car.provider) {
    addCandidate(car.provider.cover_image_full_path, "provider");
    addCandidate(car.provider.cover_image, "provider");
    addCandidate(car.provider.logo_full_path, "provider");
    addCandidate(car.provider.logo, "provider");
  }

  return results.length > 0 ? results : [fallback];
};

export const getCarPrimaryImage = (car: CarItem | any): string => {
  const images = getCarGalleryImages(car);
  return images[0] || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80";
};

export const parseTermsAndConditions = (rawTerms: string | null | undefined): string[] => {
  if (!rawTerms) return [];
  return rawTerms
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/^[\*\-\•]\s*/, ""));
};

export const formatTimeTo12Hour = (timeStr: string): string => {
  if (!timeStr) return "10:00 AM";
  if (/am|pm/i.test(timeStr)) return timeStr.toUpperCase();

  const [hourStr, minStr] = timeStr.split(":");
  let hour = parseInt(hourStr, 10);
  const min = minStr ? minStr.slice(0, 2) : "00";
  if (isNaN(hour)) return timeStr;

  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  const formattedHour = hour < 10 ? `0${hour}` : `${hour}`;
  return `${formattedHour}:${min} ${ampm}`;
};

export const getCarProviderLogo = (provider?: CarProvider | null): string => {
  if (!provider) return "";
  const apiBase = getBackendRootUrl();

  if (
    provider.logo_full_path &&
    typeof provider.logo_full_path === "string" &&
    !provider.logo_full_path.endsWith("/") &&
    provider.logo_full_path !== "null"
  ) {
    if (
      provider.logo_full_path.startsWith("http://") ||
      provider.logo_full_path.startsWith("https://")
    ) {
      try {
        const parsed = new URL(provider.logo_full_path);
        const activeBase = new URL(apiBase);
        if (
          parsed.hostname === "localhost" ||
          parsed.hostname === "127.0.0.1" ||
          parsed.host !== activeBase.host
        ) {
          return `${activeBase.origin}${parsed.pathname}${parsed.search}`;
        }
      } catch { }
      return provider.logo_full_path;
    }
    const cleanPath = provider.logo_full_path.startsWith("/")
      ? provider.logo_full_path
      : `/${provider.logo_full_path}`;
    return `${apiBase}${cleanPath}`;
  }

  if (
    provider.logo &&
    typeof provider.logo === "string" &&
    provider.logo !== "default.png" &&
    provider.logo !== "null" &&
    !provider.logo.endsWith("/")
  ) {
    if (provider.logo.startsWith("http://") || provider.logo.startsWith("https://")) {
      return provider.logo;
    }
    const cleanPath = provider.logo.startsWith("/")
      ? provider.logo
      : `/${provider.logo}`;
    if (cleanPath.includes("/storage/")) {
      return `${apiBase}${cleanPath}`;
    }
    return `${apiBase}/storage/app/public/provider/logo/${provider.logo}`;
  }

  return "";
};


