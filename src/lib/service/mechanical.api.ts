import apiClient from "@/lib/http/apiClient";

export const DEFAULT_ZONE_ID = "a1614dbe-4732-11ee-9702-dee6e8d77be4";
export const FALLBACK_MECHANICAL_CATEGORY_ID = "dbafef35-cfa4-4757-90f4-ddbf568d5d83";

export interface MechanicalCategoryItem {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  is_active?: number;
  image?: string;
  image_full_path?: string;
}

export interface MechanicalServiceItem {
  id: string;
  name: string;
  description?: string;
  short_description?: string;
  category_id?: string;
  min_bidding_price?: number;
  avg_rating?: number;
  rating_count?: number;
}

export interface MechanicalProviderItem {
  id: string;
  user_id?: string;
  company_name: string;
  company_phone?: string;
  company_address?: string;
  company_email?: string;
  profile_image?: string;
  logo?: string;
  logo_full_path?: string;
  avg_rating?: number;
  rating_count?: number;
  is_active?: number;
  service_location?: string;
  delivery_type?: string;
  total_selected_services_price?: number;
  price?: number;
  distance?: number;
  distance_miles?: string | number;
  estimated_time?: string;
  selected_services?: any[];
  [key: string]: any;
}

export const getMechanicalCategories = async (): Promise<MechanicalCategoryItem[]> => {
  const zoneId = DEFAULT_ZONE_ID;

  try {
    const response = await apiClient.get("/customer/category", {
      headers: { zoneid: zoneId },
      params: { limit: 50, offset: 1 },
    });

    const raw = response.data?.content?.data || response.data?.content || [];
    if (Array.isArray(raw)) {
      return raw.filter((item) => {
        const name = String(item.name || "").toLowerCase();
        return name.includes("mechan") || name.includes("repair") || name.includes("garage");
      });
    }
  } catch (error) {
    console.warn("mechanical categories failed:", error);
  }

  return [
    {
      id: FALLBACK_MECHANICAL_CATEGORY_ID,
      name: "Mechanical & Garage Services",
      description: "Mechanical and garage repairs",
      is_active: 1,
    },
  ];
};

export const getMechanicalServices = async (
  categoryId: string = FALLBACK_MECHANICAL_CATEGORY_ID
): Promise<MechanicalServiceItem[]> => {
  const zoneId = DEFAULT_ZONE_ID;

  try {
    const response = await apiClient.get(`/customer/service/category/${categoryId}`, {
      headers: { zoneid: zoneId },
      params: { limit: 100, offset: 1 },
    });

    const raw = response.data?.content?.data || response.data?.content || [];
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((item: any) => ({
        id: item.id,
        name: item.name || item.service_name || "Mechanical Service",
        description: item.description || item.short_description || "",
        short_description: item.short_description || item.description || "",
        category_id: item.category_id || categoryId,
        min_bidding_price: Number(item.min_bidding_price || item.price || 0),
        avg_rating: Number(item.avg_rating || 0),
        rating_count: Number(item.rating_count || 0),
      }));
    }
  } catch (error) {
    console.warn("mechanical services failed:", error);
  }

  return [
    { id: "f473637e-cd69-4796-8d4a-b8eed2f7efca", name: "Engine Diagnostics & Repair", description: "Engine fault and diagnostics", category_id: categoryId, min_bidding_price: 120 },
    { id: "9e1f8470-6b75-4d8b-bd9a-4839fe6f9b54", name: "Brake Service & Repair", description: "Pads, discs, braking system", category_id: categoryId, min_bidding_price: 140 },
    { id: "e5b3d18d-8d3d-4569-a0df-f604a90c8a40", name: "Suspension & Steering Fix", description: "Suspension tuning and alignment checks", category_id: categoryId, min_bidding_price: 170 },
    { id: "d84cc4fe-f6cc-46ce-acc1-56e80df6ff3a", name: "General Mechanical Check", description: "Inspection and repairs", category_id: categoryId, min_bidding_price: 95 },
  ];
};

export const searchMechanicalProviders = async (params: {
  categoryId?: string;
  serviceId?: string;
  latitude?: string | number;
  longitude?: string | number;
}): Promise<MechanicalProviderItem[]> => {
  const zoneId = DEFAULT_ZONE_ID;
  const categoryId = params.categoryId || FALLBACK_MECHANICAL_CATEGORY_ID;
  const latitude = params.latitude || "51.5074";
  const longitude = params.longitude || "-0.1278";

  try {
    const formData = new FormData();
    if (params.serviceId) formData.append("service_id", params.serviceId);
    formData.append("category_id", categoryId);
    formData.append("latitude", String(latitude));
    formData.append("longitude", String(longitude));

    const response = await apiClient.post("/customer/provider/search-by-service", formData, {
      headers: { zoneid: zoneId },
    });

    const raw = response.data?.content?.data || response.data?.content || [];
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((item: any) => ({
        ...item,
        id: String(item.id || item.provider_id),
        company_name: item.company_name || item.name || "Mechanical Garage",
        company_phone: item.company_phone || item.phone || "",
        company_address: item.company_address || item.address || "London, UK",
        company_email: item.company_email || item.email || "",
        logo_full_path: item.logo_full_path || item.logo || "",
        avg_rating: Number(item.avg_rating || item.rating || 4.8),
        rating_count: Number(item.rating_count || 0),
        total_selected_services_price: Number(item.total_selected_services_price || item.price || 0),
        distance: Number(item.distance || 0),
        distance_miles: item.distance_miles || item.distance || "2.1 mi",
        estimated_time: item.estimated_time || "45 mins",
      }));
    }
  } catch (error) {
    console.warn("searchMechanicalProviders failed:", error);
  }

  return [
    {
      id: "cffcce91-5498-4b73-b571-8e6e69bbd89d",
      company_name: "MotoCare Specialists",
      company_phone: "+44 20 7946 0151",
      company_address: "Leicester, UK",
      company_email: "info@motocare.co.uk",
      avg_rating: 4.9,
      rating_count: 142,
      is_active: 1,
      total_selected_services_price: 120,
      distance_miles: "1.8 mi",
      estimated_time: "35 mins",
    },
    {
      id: "8d7a2ba6-5ee1-48be-a988-44f0bef0fa7c",
      company_name: "DriveLine Garage",
      company_phone: "+44 20 7946 0177",
      company_address: "Birmingham, UK",
      company_email: "bookings@drivelinegarage.co.uk",
      avg_rating: 4.8,
      rating_count: 96,
      is_active: 1,
      total_selected_services_price: 135,
      distance_miles: "2.4 mi",
      estimated_time: "48 mins",
    },
  ];
};

export const addMechanicalToCart = async (payload: {
  provider_id: string;
  service_id: string;
  category_id: string;
  quantity?: number;
}): Promise<any> => {
  const zoneId = DEFAULT_ZONE_ID;

  const response = await apiClient.post(
    "/customer/cart/add",
    {
      provider_id: payload.provider_id,
      service_id: payload.service_id,
      category_id: payload.category_id,
      quantity: payload.quantity ?? 1,
      is_terms_accepted: 1,
      terms_and_conditions: 1,
      is_provider_terms_accepted: 1,
      terms_accepted: 1,
    },
    {
      headers: {
        zoneid: zoneId,
        zoneId: zoneId,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

export const getMechanicalProviderSlots = async (providerId: string, date: string): Promise<any[]> => {
  const zoneId = DEFAULT_ZONE_ID;

  try {
    const response = await apiClient.get("/customer/booking/provider/slots", {
      headers: { zoneid: zoneId },
      params: {
        provider_id: providerId,
        date,
      },
    });

    const raw = response.data?.content?.data || response.data?.content || [];
    return Array.isArray(raw) ? raw : [];
  } catch (error) {
    console.warn("mechanical slots failed:", error);
    return [
      { id: "slot-1", start_time: "09:00:00", end_time: "09:30:00", title: "09:00 AM - 09:30 AM", is_available: true },
      { id: "slot-2", start_time: "10:00:00", end_time: "10:30:00", title: "10:00 AM - 10:30 AM", is_available: true },
      { id: "slot-3", start_time: "11:00:00", end_time: "11:30:00", title: "11:00 AM - 11:30 AM", is_available: true },
    ];
  }
};

export const getMechanicalProviderQuestions = async (
  providerId: string,
  categoryId: string = FALLBACK_MECHANICAL_CATEGORY_ID
): Promise<any[]> => {
  const zoneId = DEFAULT_ZONE_ID;

  try {
    const response = await apiClient.get("/customer/booking/provider/questions", {
      headers: { zoneid: zoneId },
      params: {
        provider_id: providerId,
        category_id: categoryId,
      },
    });

    const raw = response.data?.content?.data || response.data?.content || [];
    return Array.isArray(raw) ? raw : [];
  } catch (error) {
    console.warn("mechanical provider questions failed:", error);
    return [
      { id: "q-issue", question_text: "What is the issue with your vehicle?", field_type: "text", is_required: true },
      { id: "q-priority", question_text: "Is this an emergency or routine repair?", field_type: "select", options: ["Routine", "Emergency"], is_required: true },
    ];
  }
};

export const sendMechanicalBookingRequest = async (payload: {
  provider_id: string;
  payment_method: string;
  service_schedule: string;
  service_address_id?: string;
  service_location?: string;
  booking_type?: string;
  selected_slot_id?: string;
  damage_description?: string;
  car_registration_number?: string;
  car_model?: string;
  notes?: string;
  answers?: Record<string, string>;
  postcode?: string;
  car_image?: File | null;
  zone_id?: string;
}): Promise<any> => {
  const zoneId = payload.zone_id || DEFAULT_ZONE_ID;

  const formData = new FormData();
  formData.append("provider_id", payload.provider_id);
  formData.append("payment_method", payload.payment_method || "cash_after_service");
  formData.append("service_address_id", payload.service_address_id || "6");
  formData.append("service_schedule", payload.service_schedule || "2026-01-14 10:00:00");
  formData.append("service_location", payload.service_location || "customer");
  formData.append("booking_type", payload.booking_type || "normal");
  if (payload.selected_slot_id) formData.append("selected_slot_id", payload.selected_slot_id);
  if (payload.damage_description) formData.append("damage_description", payload.damage_description);
  if (payload.car_registration_number) formData.append("car_registration_number", payload.car_registration_number);
  if (payload.car_model) formData.append("car_model", payload.car_model);
  if (payload.notes) formData.append("notes", payload.notes);
  if (payload.postcode) formData.append("postcode", payload.postcode);
  if (payload.answers) {
    Object.entries(payload.answers).forEach(([key, value]) => {
      formData.append(`answers[${key}]`, String(value));
    });
  }
  if (payload.car_image) formData.append("car_image", payload.car_image);
  formData.append("is_terms_accepted", "1");
  formData.append("is_provider_terms_accepted", "1");
  formData.append("terms_and_conditions", "1");
  formData.append("terms_accepted", "1");
  formData.append("zone_id", zoneId);

  const response = await apiClient.post("/customer/booking/request/send", formData, {
    headers: {
      zoneid: zoneId,
      zoneId: zoneId,
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};
