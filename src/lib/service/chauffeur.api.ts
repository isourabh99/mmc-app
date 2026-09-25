import apiClient from "@/lib/http/apiClient";

export interface CarType {
  id: number;
  name: string;
  slug: string;
  status: number;
  created_at: string;
  updated_at: string;
}

interface CarTypesResponse {
  response_code: string;
  message: string;
  content: CarType[];
  errors: unknown[];
}

export const getCarTypes = async (): Promise<CarType[]> => {
  try {
    const response = await apiClient.get<CarTypesResponse>(
      "/customer/car/types"
    );

    return response.data.content;
  } catch (error) {
    console.error("Failed to fetch car types:", error);
    throw error;
  }
};

export interface Coordinates {
  latitude: string;
  longitude: string;
}



export interface CategoryTranslation {
  id: number;
  translationable_type: string;
  translationable_id: string;
  locale: string;
  key: string;
  value: string;
}

export interface Category {
  id: string;
  parent_id: string;
  name: string;
  image: string;
  position: number;
  description: string | null;
  is_active: number;
  is_featured: number;
  created_at: string;
  updated_at: string;
  image_full_path: string;
  translations: CategoryTranslation[];
  storage: unknown | null;
}

export interface Provider {
  id: string;
  user_id: string;
  company_name: string;
  company_phone: string;
  company_address: string;
  company_email: string;
  logo: string;
  contact_person_name: string;
  contact_person_phone: string;
  contact_person_email: string;
  order_count: number;
  service_man_count: number;
  service_capacity_per_day: number;
  rating_count: number;
  avg_rating: number;
  commission_status: number;
  commission_percentage: number;
  is_active: number;
  is_emergency_active: number;
  after_hours_available: number;
  weekend_emergency_available: number;
  motorway_recovery_approved: number;
  emergency_response_time: string | null;
  created_at: string;
  updated_at: string;
  is_approved: number;
  zone_id: string;
  postcode: string | null;
  coordinates: Coordinates;
  is_suspended: number;
  deleted_at: string | null;
  service_availability: number;
  cover_image: string | null;
  logo_full_path: string;
  cover_image_full_path: string | null;
  storage: unknown | null;
}

export interface Chauffeur {
  id: number;
  service_category: string;
  provider_id: string;
  category_id: string;
  car_type_id: number;
  features: string | null;
  brand: string;
  manufacture_year: number | string | null;
  model: string;
  year: number | string | null;
  fuel_type: string | null;
  transmission_type: string | null;
  registration_number: string;
  transmission: string | null;
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
  driving_license?: string;
  vehicle_registration?: string;
  insurance_documents?: string;
  mot_certificate?: string;
  driving_license_full_path?: string | null;
  vehicle_registration_full_path?: string | null;
  insurance_documents_full_path?: string | null;
  mot_certificate_full_path?: string | null;
  status: number;
  coordinates: Coordinates | null;
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
  image_full_paths: string[];
  type: CarType;
  category: Category;
  provider: Provider;
}

export interface ChauffeurSearchContent {
  current_page: number;
  data: Chauffeur[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface ChauffeurSearchResponse {
  response_code: string;
  message: string;
  content: ChauffeurSearchContent;
  errors: unknown[];
}

export interface ChauffeurSearchParams {
  car_type_id: number;
  date: string;
  limit?: number;
  offset?: number;
}

export const searchChauffeurs = async ({
  car_type_id,
  date,
  limit = 10,
  offset = 0,
}: ChauffeurSearchParams): Promise<ChauffeurSearchContent> => {
  try {
    const formData = new FormData();

    formData.append("car_type_id", String(car_type_id));
    formData.append("date", date);
    formData.append("limit", String(limit));
    formData.append("offset", String(offset));

    const response = await apiClient.post<ChauffeurSearchResponse>(
      "/customer/car/chauffeur/search",
      formData
    );

    return response.data.content;
  } catch (error) {
    console.error("Failed to search chauffeurs:", error);
    throw error;
  }
};

export interface ChauffeurBookingCoordinates {

  latitude: number;
  longitude: number;
}

export interface ChauffeurBookingPayload {
  car_id: number;
  start_date: string;
  end_date: string;
  pickup_time: string;
  drop_time: string;
  pickup_type: string;
  pickup_location: string;
  pickup_coordinates?: ChauffeurBookingCoordinates;
  drop_location: string;
  drop_coordinates?: ChauffeurBookingCoordinates;
  payment_method: string;
  callback?: string;
  note?: string;
}

export interface ChauffeurBookingDetail {
  id: number;
  booking_id: string;
  car_id: number;
  user_id?: string;
  start_date: string;
  end_date: string;
  pickup_type: string;
  pickup_time: string;
  drop_time: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  booking_status: string;
  is_paid: number;
  pickup_location: string;
  drop_location: string;
  pickup_coordinates?: ChauffeurBookingCoordinates;
  drop_coordinates?: ChauffeurBookingCoordinates;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface ChauffeurBookingContent {
  booking?: ChauffeurBookingDetail;
  redirect_link?: string;
  redirect_url?: string;
  booking_id?: string | number;
  [key: string]: unknown;
}

export interface ChauffeurBookingResponse {
  response_code: string;
  message: string;
  content: ChauffeurBookingContent;
  errors: unknown[];
}

export interface CustomerBookingItem {
  id: number;
  booking_id: string;
  car_id: number;
  user_id: string;
  start_date: string;
  end_date: string;
  pickup_type: string;
  pickup_time: string;
  drop_time: string;
  description: string | null;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  booking_status: string;
  is_paid: number;
  transaction_id?: string | null;
  pickup_location: string;
  drop_location: string;
  pickup_coordinates?: ChauffeurBookingCoordinates;
  drop_coordinates?: ChauffeurBookingCoordinates;
  updated_at: string;
  created_at: string;
  car?: Chauffeur;
  user?: {
    id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface CustomerBookingsParams {
  limit?: number;
  offset?: number;
  booking_status?: string;
  service_type?: string;
  booking_type?: string;
}

export interface CustomerBookingsResponse {
  response_code: string;
  message: string;
  content: {
    data?: CustomerBookingItem[];
    current_page?: number;
    total?: number;
    [key: string]: unknown;
  } | CustomerBookingItem[];
  errors: unknown[];
}

export const bookChauffeur = async (
  payload: ChauffeurBookingPayload
): Promise<ChauffeurBookingResponse> => {
  try {
    const sanitizedPayload: ChauffeurBookingPayload = {
      ...payload,
      payment_method: "cash_after_service",
    };
    const response = await apiClient.post<ChauffeurBookingResponse>(
      "/customer/car/chauffeur/book",
      sanitizedPayload
    );
    return response.data;
  } catch (error) {
    console.error("Failed to book chauffeur:", error);
    throw error;
  }
};

export const getCustomerBookings = async ({
  limit = 10,
  offset = 1,
  booking_status = "all",
  service_type = "all",
  booking_type = "car",
}: CustomerBookingsParams = {}): Promise<CustomerBookingItem[]> => {
  try {
    const response = await apiClient.get<CustomerBookingsResponse>(
      "/customer/booking",
      {
        params: {
          limit,
          offset,
          booking_status,
          service_type,
          booking_type,
        },
      }
    );

    const content: any = response.data?.content;

    if (content?.car_bookings?.data && Array.isArray(content.car_bookings.data)) {
      return content.car_bookings.data;
    }
    if (content?.car_bookings && Array.isArray(content.car_bookings)) {
      return content.car_bookings;
    }
    if (content?.data && Array.isArray(content.data)) {
      return content.data;
    }
    if (Array.isArray(content)) {
      return content;
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch customer bookings:", error);
    throw error;
  }
};

export const getChauffeurGalleryImages = (chauffeur: Chauffeur): string[] => {
  const fallback =
    "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80";

  if (
    chauffeur.image_full_paths &&
    Array.isArray(chauffeur.image_full_paths) &&
    chauffeur.image_full_paths.length > 0
  ) {
    const valid = chauffeur.image_full_paths.filter(
      (p) => p && typeof p === "string" && !p.endsWith("/")
    );
    if (valid.length > 0) return valid;
  }

  if (
    chauffeur.images &&
    Array.isArray(chauffeur.images) &&
    chauffeur.images.length > 0
  ) {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
      "http://192.168.29.83:8000";
    return chauffeur.images.map((img) =>
      img.startsWith("http") ? img : `${apiBase}/storage/app/public/car/${img}`
    );
  }

  return [fallback];
};


