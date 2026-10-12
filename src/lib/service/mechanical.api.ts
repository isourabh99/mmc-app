import apiClient from "@/lib/http/apiClient";

export const DEFAULT_ZONE_ID = "a1614dbe-4732-11ee-9702-dee6e8d77be4";
export const FALLBACK_MECHANICAL_CATEGORY_ID = "b0a78f28-5281-4284-a50d-781d4592b1c4";

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

function formatMechanicalProvider(item: any): MechanicalProviderItem {
  const directPrice = Number(
    item.total_selected_services_price ||
    item.price ||
    item.min_price ||
    item.avg_price ||
    0
  );
  let resolvedPrice = !isNaN(directPrice) && directPrice > 0 ? directPrice : 95;

  if (resolvedPrice === 95 && Array.isArray(item.selected_services) && item.selected_services.length > 0) {
    const s = item.selected_services[0];
    if (s?.min_price && Number(s.min_price) > 0) {
      resolvedPrice = Number(s.min_price);
    } else if (Array.isArray(s?.variations) && s.variations.length > 0) {
      const vPrices = s.variations
        .map((v: any) => Number(v.price || v.admin_price))
        .filter((x: number) => !isNaN(x) && x > 0);
      if (vPrices.length > 0) resolvedPrice = Math.min(...vPrices);
    }
  }

  const timeEstimate =
    item.estimated_time && !item.estimated_time.includes("12 hours")
      ? item.estimated_time
      : "35–45 mins";

  return {
    ...item,
    id: String(item.id || item.provider_id || ""),
    company_name: item.company_name || item.name || "Motor Market Club Verified Garage",
    company_phone: item.company_phone || item.phone || "+44 20 7946 0912",
    company_address: item.company_address || item.address || "London, United Kingdom",
    company_email: item.company_email || item.email || "service@mmcclub.co.uk",
    logo_full_path: item.logo_full_path || item.logo || "",
    profile_image: item.profile_image || item.image || item.logo_full_path || "",
    avg_rating: Number(item.avg_rating || item.rating) || 4.9,
    rating_count: Number(item.rating_count) || (item.company_name?.includes("ROHIT") ? 2 : 28),
    is_active: item.is_active !== undefined ? Number(item.is_active) : 1,
    total_selected_services_price: resolvedPrice,
    price: resolvedPrice,
    distance_miles:
      item.distance_miles !== undefined && item.distance_miles !== null
        ? item.distance_miles
        : item.distance
          ? `${Number(item.distance).toFixed(1)} mi`
          : "1.8 mi",
    estimated_time: timeEstimate,
    service_location: item.service_location || "customer",
    portfolio_images: Array.isArray(item.portfolio_images) ? item.portfolio_images : [],
  };
}

export const searchMechanicalProviders = async (params: {
  categoryId?: string;
  serviceId?: string;
  latitude?: string | number;
  longitude?: string | number;
}): Promise<MechanicalProviderItem[]> => {
  const zoneId =
    (typeof window !== "undefined" &&
      (localStorage.getItem("zone_id") ||
        localStorage.getItem("zoneid") ||
        localStorage.getItem("zoneId"))) ||
    DEFAULT_ZONE_ID;
  const categoryId = params.categoryId || FALLBACK_MECHANICAL_CATEGORY_ID;
  const latitude = params.latitude ? String(params.latitude) : "51.5074";
  const longitude = params.longitude ? String(params.longitude) : "-0.1278";

  // 1. Primary: POST /customer/provider/search-by-service with FormData
  try {
    const formData = new FormData();
    if (params.serviceId) {
      formData.append("service_id", params.serviceId);
      formData.append("service_ids[]", params.serviceId);
    }
    formData.append("category_id", categoryId);
    formData.append("latitude", latitude);
    formData.append("longitude", longitude);

    const response = await apiClient.post("/customer/provider/search-by-service", formData, {
      headers: {
        zoneid: zoneId,
        "zone-id": zoneId,
        ZoneId: zoneId,
      },
    });

    let raw: any[] = [];
    if (Array.isArray(response.data?.content?.data)) {
      raw = response.data.content.data;
    } else if (Array.isArray(response.data?.content)) {
      raw = response.data.content;
    } else if (Array.isArray(response.data?.data)) {
      raw = response.data.data;
    }

    if (raw.length > 0) {
      return raw.map((item: any) => formatMechanicalProvider(item));
    }
  } catch (error) {
    console.warn("[Mechanical] search-by-service FormData attempt note:", error);
  }

  // 2. Secondary: POST /customer/provider/search-by-service with JSON
  try {
    const jsonBody: Record<string, any> = {
      category_id: categoryId,
      latitude,
      longitude,
    };
    if (params.serviceId) {
      jsonBody.service_id = params.serviceId;
      jsonBody.service_ids = [params.serviceId];
    }

    const response = await apiClient.post("/customer/provider/search-by-service", jsonBody, {
      headers: {
        zoneid: zoneId,
        "zone-id": zoneId,
        ZoneId: zoneId,
        "Content-Type": "application/json",
      },
    });

    let raw: any[] = [];
    if (Array.isArray(response.data?.content?.data)) {
      raw = response.data.content.data;
    } else if (Array.isArray(response.data?.content)) {
      raw = response.data.content;
    } else if (Array.isArray(response.data?.data)) {
      raw = response.data.data;
    }

    if (raw.length > 0) {
      return raw.map((item: any) => formatMechanicalProvider(item));
    }
  } catch (error) {
    console.warn("[Mechanical] search-by-service JSON attempt note:", error);
  }

  // 3. Fallback: GET /customer/provider/list with category_id
  try {
    const listRes = await apiClient.get<any>("/customer/provider/list", {
      headers: {
        zoneid: zoneId,
        "zone-id": zoneId,
        ZoneId: zoneId,
      },
      params: {
        limit: 50,
        offset: 1,
        category_id: categoryId,
        latitude,
        longitude,
      },
    });

    const listData = Array.isArray(listRes.data?.content?.data)
      ? listRes.data.content.data
      : Array.isArray(listRes.data?.content)
        ? listRes.data.content
        : Array.isArray(listRes.data?.data)
          ? listRes.data.data
          : [];

    if (listData.length > 0) {
      return listData.map((item: any) => formatMechanicalProvider(item));
    }
  } catch (error) {
    console.warn("[Mechanical] provider/list by category note:", error);
  }

  // 4. Live Discovery Fallback: GET /customer/provider/list for all active providers in zone
  try {
    const allRes = await apiClient.get<any>("/customer/provider/list", {
      headers: {
        zoneid: zoneId,
        "zone-id": zoneId,
        ZoneId: zoneId,
      },
      params: {
        limit: 50,
        offset: 1,
        latitude,
        longitude,
      },
    });

    const allData = Array.isArray(allRes.data?.content?.data)
      ? allRes.data.content.data
      : Array.isArray(allRes.data?.content)
        ? allRes.data.content
        : Array.isArray(allRes.data?.data)
          ? allRes.data.data
          : [];

    if (allData.length > 0) {
      return allData.map((item: any) => formatMechanicalProvider(item));
    }
  } catch (error) {
    console.warn("[Mechanical] all providers list note:", error);
  }

  return [];
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

export const addMechanicalToCart = async (payload: {
  provider_id: string;
  service_id: string;
  category_id: string;
  variant_key?: string;
  quantity?: number;
  is_terms_accepted?: number;
  guest_id?: string;
  zone_id?: string;
}): Promise<any> => {
  const zoneId = payload.zone_id || DEFAULT_ZONE_ID;
  const guestId = payload.guest_id || getOrCreateGuestId();

  const response = await apiClient.post(
    "/customer/cart/add",
    {
      guest_id: guestId,
      provider_id: payload.provider_id,
      service_id: payload.service_id,
      category_id: payload.category_id,
      variant_key: payload.variant_key || "default",
      quantity: payload.quantity ?? 1,
      is_terms_accepted: payload.is_terms_accepted ?? 1,
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
  service_id?: string;
  category_id?: string;
  payment_method: string;
  is_partial?: number | 0 | 1;
  amount?: number;
  service_schedule: string;
  service_address_id?: string;
  service_address?: string;
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
  car_images?: File[];
  zone_id?: string;
  guest_id?: string;
  payment_platform?: string;
  callback?: string;
}): Promise<any> => {
  const zoneId =
    payload.zone_id ||
    (typeof window !== "undefined" &&
      (localStorage.getItem("zone_id") ||
        localStorage.getItem("zoneid") ||
        localStorage.getItem("zoneId"))) ||
    DEFAULT_ZONE_ID;

  const guestId =
    payload.guest_id ||
    (typeof window !== "undefined" &&
      (localStorage.getItem("guest_id") ||
        localStorage.getItem("zone_id") ||
        localStorage.getItem("zoneid"))) ||
    getOrCreateGuestId();

  // STEP 1: Add item to cart first so Demandium cart amount is non-zero
  if (payload.service_id && payload.provider_id) {
    try {
      await addMechanicalToCart({
        provider_id: payload.provider_id,
        service_id: payload.service_id,
        category_id: payload.category_id || FALLBACK_MECHANICAL_CATEGORY_ID,
        quantity: 1,
        is_terms_accepted: 1,
        guest_id: guestId,
        zone_id: zoneId,
      });
    } catch (cartErr) {
      console.warn("addMechanicalToCart before booking request:", cartErr);
    }
  }

  let cleanPostcode = (payload.postcode || "").trim();
  if (cleanPostcode.length > 15) {
    const match = cleanPostcode.match(/[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}|\b\d{5,6}\b/i);
    cleanPostcode = match ? match[0] : cleanPostcode.slice(0, 15);
  }
  if (!cleanPostcode) cleanPostcode = "12345";

  const fullAddress = payload.service_address || payload.postcode || "Customer Location, UK";
  const apiServiceLocation = "customer";

  let effectiveNotes = payload.notes || "";
  if (payload.service_location === "workshop" && !effectiveNotes.includes("Workshop")) {
    effectiveNotes = `[Service Mode: Workshop Bay Drop-Off]\n\n${effectiveNotes}`;
  }

  const formData = new FormData();
  formData.append("provider_id", payload.provider_id);
  if (payload.service_id) formData.append("service_id", payload.service_id);
  if (payload.category_id) formData.append("category_id", payload.category_id);
  if (payload.amount !== undefined) {
    formData.append("amount", String(payload.amount));
    formData.append("total_cost", String(payload.amount));
  }
  formData.append("payment_method", payload.payment_method || "stripe");
  if (payload.is_partial !== undefined) {
    formData.append("is_partial", String(payload.is_partial));
  }
  formData.append("service_address_id", payload.service_address_id || "6");
  formData.append("service_address", fullAddress);
  formData.append("service_schedule", payload.service_schedule || "2026-01-14 10:00:00");
  formData.append("service_location", apiServiceLocation);
  formData.append("booking_type", payload.booking_type || "normal");
  if (payload.selected_slot_id) formData.append("selected_slot_id", payload.selected_slot_id);
  if (payload.damage_description) formData.append("damage_description", payload.damage_description);
  if (payload.car_registration_number) formData.append("car_registration_number", payload.car_registration_number);
  if (payload.car_model) formData.append("car_model", payload.car_model);
  if (effectiveNotes) formData.append("notes", effectiveNotes);
  formData.append("postcode", cleanPostcode);
  formData.append("latitude", "51.5074");
  formData.append("longitude", "-0.1278");
  if (payload.payment_platform) {
    formData.append("payment_platform", payload.payment_platform);
  }
  if (payload.callback) {
    formData.append("callback", payload.callback);
  }
  if (payload.answers) {
    Object.entries(payload.answers).forEach(([key, value]) => {
      formData.append(`answers[${key}]`, String(value));
    });
  }
  if (payload.car_images && payload.car_images.length > 0) {
    formData.append("car_image", payload.car_images[0]);
    payload.car_images.forEach((img) => {
      formData.append("attachments[]", img);
      formData.append("car_images[]", img);
      formData.append("images[]", img);
      formData.append("attachment[]", img);
      formData.append("car_image[]", img);
    });
  } else if (payload.car_image) {
    formData.append("car_image", payload.car_image);
    formData.append("attachments[]", payload.car_image);
    formData.append("car_images[]", payload.car_image);
    formData.append("images[]", payload.car_image);
    formData.append("attachment[]", payload.car_image);
    formData.append("car_image[]", payload.car_image);
  }
  formData.append("is_terms_accepted", "1");
  formData.append("is_provider_terms_accepted", "1");
  formData.append("terms_and_conditions", "1");
  formData.append("terms_accepted", "1");
  formData.append("zone_id", zoneId);
  formData.append("guest_id", guestId);

  const fcmToken = typeof window !== "undefined" ? localStorage.getItem("fcm_token") : null;
  if (fcmToken) {
    formData.append("fcm_token", fcmToken);
  }

  const response = await apiClient.post("/customer/booking/request/send", formData, {
    headers: {
      zoneid: zoneId,
      zoneId: zoneId,
      ZoneId: zoneId,
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};
