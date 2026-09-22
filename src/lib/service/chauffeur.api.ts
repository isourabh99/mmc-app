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
    console.log(response);
    
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
  manufacture_year: number | null;
  model: string;
  year: number | null;
  fuel_type: string | null;
  transmission_type: string | null;
  registration_number: string;
  transmission: string | null;
  air_conditioning: number;
  service_type: string | null;
  available_hours_start: string;
  available_hours_end: string;
  preferred_areas: string;
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
  driving_license: string;
  vehicle_registration: string;
  insurance_documents: string;
  mot_certificate: string;
  status: number;
  coordinates: Coordinates | null;
  created_at: string;
  updated_at: string;
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
    console.log(response);
    
    return response.data.content;
  } catch (error) {
    console.error("Failed to search chauffeurs:", error);
    throw error;
  }
};