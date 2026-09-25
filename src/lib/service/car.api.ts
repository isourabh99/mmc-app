import apiClient from "@/lib/http/apiClient";

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
  description?: string;
  note?: string;
}

export interface CarBookingContent {
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
    const response = await apiClient.get<CategoryResponse>(
      "/customer/category",
      {
        params: { limit, offset },
      }
    );
    return response.data?.content?.data || [];
  } catch (error) {
    console.error("Failed to fetch car categories:", error);
    return [];
  }
};

/**
 * Fetch cars filtered by category ID
 */
export const getCarList = async (
  categoryId?: string,
  params?: { limit?: number; offset?: number }
): Promise<CarItem[]> => {
  try {
    const response = await apiClient.get<CarListResponse>(
      "/customer/car/list",
      {
        params: {
          category_id: categoryId,
          limit: params?.limit || 20,
          offset: params?.offset || 1,
        },
      }
    );

    const content = response.data?.content;
    if (Array.isArray(content)) {
      return content;
    }
    if (content && Array.isArray(content.data)) {
      return content.data;
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch car list:", error);
    return [];
  }
};

/**
 * Fetch single car details by ID
 */
export const getCarDetails = async (
  carId: number | string
): Promise<CarItem | null> => {
  try {
    const response = await apiClient.get<CarDetailResponse>(
      `/customer/car/details/${carId}`
    );
    return response.data?.content || null;
  } catch (error) {
    console.error(`Failed to fetch car details for ID ${carId}:`, error);
    return null;
  }
};

/**
 * Fetch car types (e.g. Luxury, Electric, High-Performance, etc.)
 */
export const getCarTypes = async (): Promise<CarType[]> => {
  try {
    const response = await apiClient.get<CarTypesResponse>(
      "/customer/car/types"
    );
    return response.data?.content || [];
  } catch (error) {
    console.error("Failed to fetch car types:", error);
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
// UTILITY HELPERS FOR CLEAN DISPLAY
// ==========================================

export const formatCurrency = (val: string | number | null | undefined): string => {
  if (val === null || val === undefined || val === "") return "£0.00";
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return `£0.00`;
  return `£${num.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const getCarPrimaryImage = (car: CarItem): string => {
  if (car.image_full_paths && car.image_full_paths.length > 0) {
    const valid = car.image_full_paths.find((p) => p && typeof p === "string" && !p.endsWith("/"));
    if (valid) return valid;
  }
  if (car.images && car.images.length > 0) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://192.168.29.83:8000";
    return car.images[0].startsWith("http") ? car.images[0] : `${apiBase}/storage/app/public/car/${car.images[0]}`;
  }
  return "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80";
};

export const getCarGalleryImages = (car: CarItem): string[] => {
  const fallback = "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80";
  
  if (car.image_full_paths && Array.isArray(car.image_full_paths) && car.image_full_paths.length > 0) {
    const valid = car.image_full_paths.filter((p) => p && typeof p === "string" && !p.endsWith("/"));
    if (valid.length > 0) return valid;
  }

  if (car.images && Array.isArray(car.images) && car.images.length > 0) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://192.168.29.83:8000";
    return car.images.map((img) =>
      img.startsWith("http") ? img : `${apiBase}/storage/app/public/car/${img}`
    );
  }

  return [fallback];
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
