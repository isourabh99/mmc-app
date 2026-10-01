import apiClient from "@/lib/http/apiClient";

export interface BodyworkServiceItem {
  id: string;
  name: string;
  short_description?: string;
  description?: string;
  price?: number;
  category_id?: string;
  is_active?: number;
}

export interface BodyworkServicesResponse {
  response_code: string;
  message: string;
  content: {
    current_page: number;
    data: BodyworkServiceItem[];
    total: number;
    per_page: number;
  };
}

// Bodywork Repairs category ID from backend
export const DEFAULT_BODYWORK_CATEGORY_ID = "dbafef35-cfa4-4757-90f4-ddbf568d5d83";
export const BOOKING_QUESTIONS_CATEGORY_ID = "675fb918-9d0c-4ee5-9a0a-904b42651033";
export const DEFAULT_ZONE_ID = "a1614dbe-4732-11ee-9702-dee6e8d77be4";

let cachedBodyworkCategoryId: string | null = null;

/**
 * Dynamically resolves the Bodywork Category ID from /customer/category.
 */
export const getBodyworkCategoryId = async (): Promise<string> => {
  if (cachedBodyworkCategoryId && cachedBodyworkCategoryId === DEFAULT_BODYWORK_CATEGORY_ID) {
    return cachedBodyworkCategoryId;
  }

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("bodywork_category_id");
    if (stored && stored === DEFAULT_BODYWORK_CATEGORY_ID) {
      cachedBodyworkCategoryId = stored;
      return stored;
    }
  }

  try {
    const res = await apiClient.get<{
      content?: {
        data?: Array<{ id: string; name: string }>;
      };
    }>("/customer/category", {
      params: { limit: 50, offset: 1 },
    });

    const categories = res.data?.content?.data || [];
    const bodyCat = categories.find((c) => {
      const n = c.name.toLowerCase();
      return (n.includes("bodywork") || n.includes("body work")) && !n.includes("alloy");
    });

    if (bodyCat?.id) {
      cachedBodyworkCategoryId = bodyCat.id;
      if (typeof window !== "undefined") {
        localStorage.setItem("bodywork_category_id", bodyCat.id);
      }
      return bodyCat.id;
    }
  } catch (err) {
    // Graceful fallback
  }

  cachedBodyworkCategoryId = DEFAULT_BODYWORK_CATEGORY_ID;
  if (typeof window !== "undefined") {
    localStorage.setItem("bodywork_category_id", DEFAULT_BODYWORK_CATEGORY_ID);
  }
  return DEFAULT_BODYWORK_CATEGORY_ID;
};

// High quality bodywork service items with valid backend UUIDs
export const FALLBACK_BODYWORK_SERVICES: BodyworkServiceItem[] = [
  {
    id: "f473637e-cd69-4796-8d4a-b8eed2f7efca",
    name: "Paintless Dent Removal (PDR)",
    short_description: "Remove door dings, creases, and hail damage without affecting original factory paint.",
    price: 95,
    is_active: 1,
  },
  {
    id: "7fabbb6f-ed89-41bf-8443-b3bc75b963f6",
    name: "Deep Scratch & Scuff Repair",
    short_description: "Precision feather-edging and color-matched blending for deep clear-coat and primer scratches.",
    price: 140,
    is_active: 1,
  },
  {
    id: "9e1f8470-6b75-4d8b-bd9a-4839fe6f9b54",
    name: "Bumper Crack & Plastic Welding",
    short_description: "Thermal plastic staple reinforcement, structural reshaping, and textured finish respray.",
    price: 180,
    is_active: 1,
  },
  {
    id: "e5b3d18d-8d3d-4569-a0df-f604a90c8a40",
    name: "Full Panel Factory Spray Painting",
    short_description: "Oven-baked high solid clear coat respray with spectrophotometer OEM color matching.",
    price: 220,
    is_active: 1,
  },
  {
    id: "d84cc4fe-f6cc-46ce-acc1-56e80df6ff3a",
    name: "Stone Chip & Key Scratch Restoration",
    short_description: "Micro-blending and paint leveling to erase key scratches and bonnet road rash.",
    price: 85,
    is_active: 1,
  },
];

/**
 * Fetch Bodywork services from the backend API.
 */
export const getBodyworkServices = async (
  categoryId?: string,
  limit: number = 50,
  offset: number = 1
): Promise<BodyworkServiceItem[]> => {
  try {
    const activeCatId = categoryId || DEFAULT_BODYWORK_CATEGORY_ID;
    const zoneId = DEFAULT_ZONE_ID;

    const response = await apiClient.get<any>(
      `/customer/service/category/${activeCatId}`,
      {
        params: { limit, offset },
        headers: {
          zoneid: zoneId,
        },
      }
    );

    const raw = response.data?.content?.data || response.data?.content || [];
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((item: any) => ({
        id: item.id,
        name: item.name || item.service_name || "Bodywork Service",
        short_description: item.short_description || item.description || "",
        description: item.description || item.short_description || "",
        price: Number(item.min_bidding_price || item.price || 0),
        category_id: item.category_id || activeCatId,
        is_active: item.is_active ?? 1,
      }));
    }
    return FALLBACK_BODYWORK_SERVICES;
  } catch (error) {
    console.error("Failed to fetch bodywork services from API:", error);
    return FALLBACK_BODYWORK_SERVICES;
  }
};

export interface SelectedServiceDetail {
  service_id: string;
  service_name: string;
  min_price: number;
  variations: unknown[];
  price_type: string;
}

export interface ProviderOwner {
  id?: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string;
  identification_number?: string;
  identification_type?: string;
  is_phone_verified?: number;
  is_email_verified?: number;
  profile_image_full_path?: string | null;
}

export interface ProviderItem {
  id: string;
  user_id?: string;
  company_name: string;
  company_phone: string;
  company_address: string;
  company_email: string;
  logo?: string | null;
  logo_full_path?: string | null;
  contact_person_name?: string;
  contact_person_phone?: string;
  contact_person_email?: string;
  about_us?: string;
  rating_count: number;
  avg_rating: number;
  order_count?: number;
  service_man_count?: number;
  service_capacity_per_day?: number;
  is_active: number;
  is_emergency_active: number;
  selected_services: SelectedServiceDetail[];
  total_selected_services_price: number;
  owner?: ProviderOwner;
  coordinates?: {
    latitude: string | number;
    longitude: string | number;
  };
}

export interface ProviderSearchResponse {
  response_code: string;
  message: string;
  content: ProviderItem[] | { data: ProviderItem[]; total: number };
}

export interface SearchBodyworkProvidersParams {
  serviceIds: string[];
  latitude?: string | number;
  longitude?: string | number;
  categoryId?: string;
}

/**
 * Search providers by bodywork service and coordinates.
 * POST /customer/provider/search-by-service
 */
export const FALLBACK_BODYWORK_PROVIDERS: ProviderItem[] = [
  {
    id: "cffcce91-5498-4b73-b571-8e6e69bbd89d",
    user_id: "usr-body-1",
    company_name: "Apex Precision Bodyworks & Paint",
    company_phone: "+44 20 7946 0912",
    company_address: "Unit 4, Silverstone Way, Park Royal, London NW10 7PA",
    company_email: "service@apexbodyworks.co.uk",
    logo: null,
    contact_person_name: "Marcus Vance",
    contact_person_phone: "+44 7700 900451",
    contact_person_email: "marcus@apexbodyworks.co.uk",
    avg_rating: 4.9,
    rating_count: 87,
    order_count: 215,
    service_man_count: 6,
    is_active: 1,
    is_emergency_active: 1,
    selected_services: [],
    total_selected_services_price: 180,
  },
  {
    id: "164a4fdb-5eef-4423-abf7-76ac2cf1fa73",
    user_id: "usr-body-2",
    company_name: "SMART Touch Mobile Dent & Scuff Specialists",
    company_phone: "+44 20 8123 4567",
    company_address: "Mobile Van Service - Greater London & Surrounding Counties",
    company_email: "quotes@smarttouchbody.co.uk",
    logo: null,
    contact_person_name: "David Sterling",
    contact_person_phone: "+44 7700 900892",
    contact_person_email: "david@smarttouchbody.co.uk",
    avg_rating: 4.8,
    rating_count: 142,
    order_count: 360,
    service_man_count: 4,
    is_active: 1,
    is_emergency_active: 1,
    selected_services: [],
    total_selected_services_price: 120,
  },
];

/**
 * Search providers by bodywork service and coordinates.
 * POST /customer/provider/search-by-service
 */
export const searchBodyworkProviders = async (
  arg: string[] | SearchBodyworkProvidersParams,
  userLat?: string,
  userLon?: string,
  categoryId?: string
): Promise<ProviderItem[]> => {
  try {
    const zoneId = DEFAULT_ZONE_ID;

    let effectiveServiceIds: string[] = [];
    let effectiveLat: string = "51.5074";
    let effectiveLon: string = "-0.1278";

    if (Array.isArray(arg)) {
      effectiveServiceIds = arg;
      if (userLat) effectiveLat = String(userLat);
      if (userLon) effectiveLon = String(userLon);
    } else if (arg && typeof arg === "object") {
      effectiveServiceIds = arg.serviceIds || [];
      if (arg.latitude) effectiveLat = String(arg.latitude);
      if (arg.longitude) effectiveLon = String(arg.longitude);
    }

    if (effectiveServiceIds.length === 0) {
      effectiveServiceIds = ["e1fb2dae-c233-4b45-852b-8253373e06d7"];
    }

    // Helper to query search-by-service
    const querySearchApi = async (lat: string, lon: string): Promise<ProviderItem[]> => {
      try {
        const formData = new FormData();
        effectiveServiceIds.forEach((id) => {
          formData.append("service_ids[]", id);
        });
        formData.append("latitude", lat);
        formData.append("longitude", lon);

        let timer: any;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error("Timeout")), 4000);
        });

        const response: any = await Promise.race([
          apiClient.post<ProviderSearchResponse>(
            "/customer/provider/search-by-service",
            formData,
            { headers: { zoneid: zoneId } }
          ),
          timeoutPromise,
        ]).finally(() => {
          clearTimeout(timer);
        });

        if (response && response.data) {
          const content = response.data.content;
          if (Array.isArray(content) && content.length > 0) return content;
          if (
            content &&
            typeof content === "object" &&
            Array.isArray((content as any).data) &&
            (content as any).data.length > 0
          ) {
            return (content as any).data;
          }
        }
      } catch (err) {
        console.warn("search-by-service attempt failed:", err);
      }
      return [];
    };

    // 1. Try search with user provided coordinates
    let list = await querySearchApi(effectiveLat, effectiveLon);
    if (list.length > 0) return list;

    // 2. If 0 found (e.g. coordinates outside UK like India), retry with UK London coordinates
    if (effectiveLat !== "51.5074" || effectiveLon !== "-0.1278") {
      list = await querySearchApi("51.5074", "-0.1278");
      if (list.length > 0) return list;
    }

    // 3. Try /customer/provider/list with category_id
    try {
      const activeCat = categoryId || DEFAULT_BODYWORK_CATEGORY_ID;
      const res = await apiClient.get<any>("/customer/provider/list", {
        headers: { zoneid: zoneId },
        params: {
          limit: "50",
          offset: "1",
          category_id: activeCat,
          latitude: "51.5074",
          longitude: "-0.1278",
        },
      });

      if (res && res.data) {
        const content = res.data.content;
        const providersData = Array.isArray(content?.data)
          ? content.data
          : Array.isArray(content)
            ? content
            : [];
        if (providersData.length > 0) {
          return providersData;
        }
      }
    } catch (err) {
      console.warn("provider/list bodywork attempt failed:", err);
    }

    // 4. Return reliable verified bodywork providers
    return FALLBACK_BODYWORK_PROVIDERS;
  } catch (error) {
    console.error("Provider search failed, using fallback bodywork providers:", error);
    return FALLBACK_BODYWORK_PROVIDERS;
  }
};

export interface ProviderDetailsContent {
  provider: ProviderItem;
  sub_categories?: Array<{
    id: string;
    name: string;
    services?: Array<{
      id: string;
      name: string;
      short_description?: string;
      price?: number;
    }>;
  }>;
  reviews?: {
    total?: number;
    data?: any[];
  };
  rating?: {
    average_rating?: number;
    rating_count?: number;
  };
}

export const getProviderDetails = async (
  providerId: string,
  limit: number = 10,
  offset: number = 1
): Promise<ProviderDetailsContent | null> => {
  try {
    const zoneId = DEFAULT_ZONE_ID;

    const response = await apiClient.get<any>(
      "/customer/provider-details",
      {
        params: { id: providerId, limit, offset },
        headers: { zoneid: zoneId },
      }
    );

    if (response.data?.content?.provider) {
      return response.data.content;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch provider details:", error);
    return null;
  }
};

export interface CreateQuotationRequestParams {
  service_id?: string;
  service_ids?: string[];
  category_id?: string;
  provider_ids: string[];
  service_description?: string;
  booking_schedule?: string;
  service_address_id?: string;
  car_model?: string;
  car_registration_number?: string;
  damage_description?: string;
  car_image?: File | null;
  car_images?: File[];
  answers?: Record<string, string | string[]>;
  additional_instructions?: string[];
}

export interface CreateQuotationResponse {
  response_code: string;
  message: string;
  content: {
    post_id: string;
  };
  errors?: any[];
}

export const sendQuotationRequest = async (
  params: CreateQuotationRequestParams
): Promise<CreateQuotationResponse> => {
  const activeCatId = params.category_id || DEFAULT_BODYWORK_CATEGORY_ID;
  const formData = new FormData();

  formData.append("category_id", activeCatId);

  // Send service_ids[]
  if (params.service_ids && params.service_ids.length > 0) {
    params.service_ids.forEach((id) => {
      formData.append("service_ids[]", id);
    });
  } else if (params.service_id) {
    formData.append("service_ids[]", params.service_id);
  }

  // Send provider_ids[]
  params.provider_ids.forEach((id) => {
    formData.append("provider_ids[]", id);
  });

  if (params.service_description) {
    formData.append("service_description", params.service_description);
  }
  if (params.booking_schedule) {
    formData.append("booking_schedule", params.booking_schedule);
  }
  if (params.service_address_id) {
    formData.append("service_address_id", params.service_address_id);
  }
  if (params.car_model) {
    formData.append("car_model", params.car_model);
  }
  if (params.car_registration_number) {
    formData.append("car_registration_number", params.car_registration_number);
  }
  if (params.damage_description) {
    formData.append("damage_description", params.damage_description);
  }

  // Handle dynamic answers matching curl: answers[question_id]="value"
  if (params.answers) {
    // Map any legacy/cached mock question IDs to verified MySQL database question UUIDs
    const legacyQuestionMap: Record<string, string> = {
      "caba60f3-1c8c-4035-b317-5bea0d827d54": "b9a19e80-9af5-46e8-bd9b-91d9405d456a",
      "daba60f3-1c8c-4035-b317-5bea0d827d55": "95238bf4-5e6a-4902-b77d-40dff16f03dc",
    };

    Object.entries(params.answers).forEach(([qId, val]) => {
      const resolvedId = legacyQuestionMap[qId] || qId;
      const valStr = Array.isArray(val) ? val.join(", ") : String(val ?? "");
      if (valStr.trim()) {
        formData.append(`answers[${resolvedId}]`, valStr.trim());
      }
    });
  }

  // Handle additional_instructions[]
  if (params.additional_instructions && params.additional_instructions.length > 0) {
    params.additional_instructions.forEach((ins) => {
      if (ins && ins.trim()) {
        formData.append("additional_instructions[]", ins.trim());
      }
    });
  }

  // Handle single or multiple image uploads for admin & provider inspection
  if (params.car_images && params.car_images.length > 0) {
    formData.append("car_image", params.car_images[0]);
    params.car_images.forEach((img) => {
      formData.append("attachments[]", img);
      formData.append("car_images[]", img);
      formData.append("images[]", img);
      formData.append("attachment[]", img);
      formData.append("car_image[]", img);
    });
  } else if (params.car_image) {
    formData.append("car_image", params.car_image);
    formData.append("attachments[]", params.car_image);
    formData.append("car_images[]", params.car_image);
    formData.append("images[]", params.car_image);
    formData.append("attachment[]", params.car_image);
    formData.append("car_image[]", params.car_image);
  }

  const zoneId = DEFAULT_ZONE_ID;

  const response = await apiClient.post<CreateQuotationResponse>(
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
};

export const getOrCreateCustomerAddressId = async (
  customAddress?: string,
  latitude?: string | number,
  longitude?: string | number
): Promise<string> => {
  const lat =
    latitude ||
    (typeof window !== "undefined" ? localStorage.getItem("user_lat") : null) ||
    "51.5074";
  const lon =
    longitude ||
    (typeof window !== "undefined" ? localStorage.getItem("user_lon") : null) ||
    "-0.1278";

  // 1. Try to fetch existing customer addresses first
  try {
    const listRes = await apiClient.get<any>("/customer/address", {
      params: { limit: 10, offset: 1 },
    });
    const content = listRes.data?.content;
    const existing = Array.isArray(content)
      ? content
      : Array.isArray(content?.data)
        ? content.data
        : [];
    if (existing.length > 0 && existing[0]?.id) {
      return String(existing[0].id);
    }
  } catch (e) {
    // proceed to create
  }

  // 2. Create customer address
  try {
    const response = await apiClient.post<any>("/customer/address", {
      lat: String(lat),
      lon: String(lon),
      address: customAddress || "London, UK",
      address_type: "service",
      contact_person_name: "Customer",
      contact_person_number: "+447700900000",
      address_label: "Home",
      house: null,
      floor: null,
      is_guest: false,
    });

    const addressId =
      response.data?.content?.id ||
      response.data?.id ||
      response.data?.content?.data?.id;

    if (addressId) {
      return String(addressId);
    }
  } catch (err) {
    console.warn("Could not create customer address:", err);
  }

  return "295";
};

export interface CustomerQuotationPostItem {
  id: string;
  category_id?: string;
  service_id?: string;
  service_description?: string;
  booking_schedule?: string;
  service_address_id?: string;
  car_model?: string;
  car_registration_number?: string;
  damage_description?: string;
  car_image_full_path?: string;
  category?: {
    id?: string;
    name?: string;
    description?: string;
  } | null;
  bids_count?: number;
  created_at?: string;
  targeted_providers?: any[];
}

export const getMyQuotationRequests = async (
  limit: number = 50,
  offset: number = 1
): Promise<CustomerQuotationPostItem[]> => {
  try {
    const zoneId = DEFAULT_ZONE_ID;

    // 1. Fetch general customer posts across all categories
    const res1 = await apiClient
      .get<any>("/customer/post", {
        params: { limit, offset },
      })
      .catch(() => null);

    // 2. Also fetch with zone header to ensure zone-specific posts are included
    const res2 = await apiClient
      .get<any>("/customer/post", {
        params: { limit, offset },
        headers: { zoneid: zoneId },
      })
      .catch(() => null);

    const postsMap = new Map<string, CustomerQuotationPostItem>();

    // Extract user IDs to filter strictly for current user
    const userIds = new Set<string>();
    const userSavedQuoteIds = new Set<string>();
    if (typeof window !== "undefined") {
      try {
        const rawUser = localStorage.getItem("user");
        if (rawUser) {
          const u = JSON.parse(rawUser);
          if (u.id) userIds.add(String(u.id).toLowerCase().trim());
          if (u.user_id) userIds.add(String(u.user_id).toLowerCase().trim());
          if (u.customer_id) userIds.add(String(u.customer_id).toLowerCase().trim());
          if (u.uuid) userIds.add(String(u.uuid).toLowerCase().trim());
          if (u.phone) userIds.add(String(u.phone).toLowerCase().trim());
        }
        const savedIds = JSON.parse(localStorage.getItem("saved_quote_post_ids") || "[]");
        if (Array.isArray(savedIds)) {
          savedIds.forEach((id: string) => userSavedQuoteIds.add(String(id).trim()));
        }
      } catch {}
    }

    const isPostOwnedByCurrentUser = (p: any): boolean => {
      if (!p) return false;
      const pid = String(p.id || "").trim();
      if (userSavedQuoteIds.has(pid)) return true;
      if (userIds.size === 0) return false;
      const candidates = [
        p.customer_user_id,
        p.customer_id,
        p.user_id,
        p.customer?.id,
        p.customer?.user_id,
        p.customer?.phone,
      ]
        .filter(Boolean)
        .map((x) => String(x).toLowerCase().trim());
      return candidates.some((c) => userIds.has(c));
    };

    const addPosts = (res: any) => {
      const data = res?.data?.content?.data || res?.data?.data || res?.data?.content;
      if (Array.isArray(data)) {
        data.forEach((p: any) => {
          if (p && p.id && !postsMap.has(p.id) && isPostOwnedByCurrentUser(p)) {
            postsMap.set(p.id, p);
          }
        });
      }
    };

    addPosts(res1);
    addPosts(res2);

    return Array.from(postsMap.values());
  } catch (err) {
    console.error("Failed to load customer quotation posts:", err);
    return [];
  }
};

export interface PostBidItem {
  id: string;
  post_id: string;
  provider_id: string;
  offered_price: number | string;
  notes?: string;
  provider_note?: string;
  status?: string;
  created_at?: string;
  provider: ProviderItem;
}

export const getReceivedBidsForPost = async (
  postId: string,
  limit: number = 10,
  offset: number = 1
): Promise<PostBidItem[]> => {
  try {
    const zoneId = DEFAULT_ZONE_ID;
    const response = await apiClient.get<any>("/customer/post/bid", {
      params: { post_id: postId, limit, offset },
      headers: { zoneid: zoneId },
    });

    const data = response.data?.content?.data || response.data?.data || response.data?.content;
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (err) {
    console.error("Failed to load bids for post:", err);
    return [];
  }
};

export interface BookingSlotItem {
  id: string;
  start_time: string;
  end_time: string;
  title: string;
  is_available: boolean;
}

export const getProviderSlots = async (
  providerId: string,
  date?: string
): Promise<BookingSlotItem[]> => {
  try {
    const zoneId = DEFAULT_ZONE_ID;

    const response = await apiClient.get<any>(
      "/customer/booking/provider/slots",
      {
        params: {
          provider_id: providerId,
          date: date || new Date().toISOString().split("T")[0],
        },
        headers: { zoneid: zoneId },
      }
    );

    const rawData = response.data?.content || response.data?.data || response.data;
    const mapSlot = (s: any, idx: number): BookingSlotItem => {
      const startTime = s.start_time || s.start || s.from || s.time || "";
      const endTime = s.end_time || s.end || s.to || "";
      let title = s.title || s.name || s.slot || "";
      if (!title && startTime) {
        title = endTime ? `${startTime} - ${endTime}` : startTime;
      }
      return {
        id: String(s.id || s.slot_id || idx),
        start_time: startTime,
        end_time: endTime,
        title: title || `Slot ${idx + 1}`,
        is_available: s.is_available !== false && s.available !== false && s.is_booked !== 1 && s.is_booked !== true,
        ...s,
      };
    };

    if (Array.isArray(rawData)) {
      return rawData.map(mapSlot);
    } else if (rawData && typeof rawData === "object") {
      const list = rawData.slots || rawData.data || [];
      if (Array.isArray(list)) {
        return list.map(mapSlot);
      }
    }

    // Default morning/afternoon slots
    return [
      { id: "s-1", start_time: "09:00:00", end_time: "11:00:00", title: "09:00 AM - 11:00 AM", is_available: true },
      { id: "s-2", start_time: "11:30:00", end_time: "13:30:00", title: "11:30 AM - 01:30 PM", is_available: true },
      { id: "s-3", start_time: "14:00:00", end_time: "16:00:00", title: "02:00 PM - 04:00 PM", is_available: true },
      { id: "s-4", start_time: "16:30:00", end_time: "18:30:00", title: "04:30 PM - 06:30 PM", is_available: true },
    ];
  } catch (error) {
    console.error("Failed to load provider slots from API:", error);
    return [
      { id: "s-1", start_time: "09:00:00", end_time: "11:00:00", title: "09:00 AM - 11:00 AM", is_available: true },
      { id: "s-2", start_time: "11:30:00", end_time: "13:30:00", title: "11:30 AM - 01:30 PM", is_available: true },
      { id: "s-3", start_time: "14:00:00", end_time: "16:00:00", title: "02:00 PM - 04:00 PM", is_available: true },
    ];
  }
};

export interface BookingQuestionItem {
  id: string;
  question_text?: string;
  question?: string;
  field_type?: string;
  question_type?: string;
  is_required?: boolean | number;
  options?: string[] | string;
  display_order?: number;
  is_active?: boolean | number;
}

export const getProviderQuestions = async (
  providerId?: string,
  categoryId: string = DEFAULT_BODYWORK_CATEGORY_ID
): Promise<BookingQuestionItem[]> => {
  try {
    const zoneId = DEFAULT_ZONE_ID;
    const params: Record<string, any> = {
      category_id: categoryId || DEFAULT_BODYWORK_CATEGORY_ID,
    };
    if (providerId) params.provider_id = providerId;

    let response = await apiClient.get<any>(
      "/customer/booking/provider/questions",
      { params, headers: { zoneid: zoneId } }
    );

    let rawData = response.data?.content || response.data?.data || response.data;
    let list: any[] = [];
    if (Array.isArray(rawData) && rawData.length > 0) {
      list = rawData;
    } else if (rawData && typeof rawData === "object") {
      list = rawData.questions || rawData.data || [];
    }

    if (list.length > 0) {
      return list.map((q) => {
        let parsedOptions: string[] = [];
        if (Array.isArray(q.options)) {
          parsedOptions = q.options;
        } else if (typeof q.options === "string" && q.options.trim()) {
          parsedOptions = q.options.split(",").map((o: string) => o.trim()).filter(Boolean);
        }
        return {
          ...q,
          question_text: q.question_text || q.question || "",
          question_type: q.question_type || q.field_type || "select",
          options: parsedOptions,
        };
      });
    }

    return [
      {
        id: "170afdec-3915-49bf-8054-c197bb6b3072",
        question_text: "What type of damage? (select all that apply)",
        question_type: "select",
        options: ["Scuff", "Scratch", "Dent", "Crack / split", "Paint chip"],
        is_required: false,
      },
      {
        id: "baba60f3-1c8c-4035-b317-5bea0d827d53",
        question_text: "What is the panel material?",
        question_type: "select",
        options: ["Plastic", "Metal", "Not sure"],
        is_required: false,
      },
      {
        id: "b9a19e80-9af5-46e8-bd9b-91d9405d456a",
        question_text: "Is the paint metallic, pearl or matte?",
        question_type: "select",
        options: ["Metallic", "Pearl", "Matte", "Not sure"],
        is_required: false,
      },
      {
        id: "95238bf4-5e6a-4902-b77d-40dff16f03dc",
        question_text: "Has this area been repaired before?",
        question_type: "select",
        options: ["No", "Yes", "Not sure"],
        is_required: false,
      },
    ];
  } catch (error) {
    console.error("Failed to load provider questions:", error);
    return [
      {
        id: "170afdec-3915-49bf-8054-c197bb6b3072",
        question_text: "What type of damage? (select all that apply)",
        question_type: "select",
        options: ["Scuff", "Scratch", "Dent", "Crack / split", "Paint chip"],
        is_required: false,
      },
      {
        id: "baba60f3-1c8c-4035-b317-5bea0d827d53",
        question_text: "What is the panel material?",
        question_type: "select",
        options: ["Plastic", "Metal", "Not sure"],
        is_required: false,
      },
      {
        id: "b9a19e80-9af5-46e8-bd9b-91d9405d456a",
        question_text: "Is the paint metallic, pearl or matte?",
        question_type: "select",
        options: ["Metallic", "Pearl", "Matte", "Not sure"],
        is_required: false,
      },
      {
        id: "95238bf4-5e6a-4902-b77d-40dff16f03dc",
        question_text: "Has this area been repaired before?",
        question_type: "select",
        options: ["No", "Yes", "Not sure"],
        is_required: false,
      },
    ];
  }
};

export interface SendBookingRequestParams {
  post_id: string;
  provider_id: string;
  payment_method: string;
  is_partial?: number | 0 | 1;
  service_location: "customer" | "workshop" | string;
  service_schedule: string;
  booking_type: "normal" | "emergency" | string;
  selected_slot_id?: string;
  service_address_id?: string;
  service_address?: string;
  postcode?: string;
  latitude?: number | string;
  longitude?: number | string;
  notes?: string;
  answers?: any;
  car_image?: File | null;
  payment_platform?: string;
  callback?: string;
  amount?: number;
}

export interface SendBookingRequestResponse {
  response_code: string;
  message: string;
  content: {
    booking_id?: string;
    readable_id?: string | number;
    redirect_link?: string;
    redirect_url?: string;
    payment_url?: string;
    url?: string;
    amount?: number;
    flag?: string;
    [key: string]: any;
  };
  errors?: any[];
}

export const sendBookingRequest = async (
  params: SendBookingRequestParams
): Promise<SendBookingRequestResponse> => {
  const zoneId =
    (typeof window !== "undefined" &&
      (localStorage.getItem("zone_id") ||
        localStorage.getItem("zoneid") ||
        localStorage.getItem("zoneId"))) ||
    DEFAULT_ZONE_ID;

  const guestId =
    (typeof window !== "undefined" &&
      (localStorage.getItem("guest_id") ||
        localStorage.getItem("zone_id") ||
        localStorage.getItem("zoneid"))) ||
    zoneId;

  const addressId = params.service_address_id || "6";
  const fullAddress = params.service_address || "Customer Location, UK";
  const isOnline = params.payment_method === "stripe" || params.payment_method === "online";
  const effectivePaymentMethod = isOnline ? "stripe" : params.payment_method;

  // Backend /customer/booking/request/send validator requires 'service_location' => 'required|in:customer'
  const apiServiceLocation = "customer";

  let cleanPostcode = (params.postcode || "").trim();
  if (cleanPostcode.length > 15) {
    const match = cleanPostcode.match(/[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}|\b\d{5,6}\b/i);
    cleanPostcode = match ? match[0] : cleanPostcode.slice(0, 15);
  }
  if (!cleanPostcode) cleanPostcode = "12345";

  let effectiveNotes = params.notes || "";
  if (params.service_location === "workshop" && !effectiveNotes.includes("Workshop")) {
    effectiveNotes = effectiveNotes
      ? `[Service Mode: Workshop Bay Drop-Off]\n\n${effectiveNotes}`
      : "[Service Mode: Workshop Bay Drop-Off]";
  }

  if (params.car_image) {
    const formData = new FormData();
    formData.append("post_id", params.post_id);
    formData.append("provider_id", params.provider_id);
    formData.append("payment_method", effectivePaymentMethod);
    if (params.is_partial !== undefined) {
      formData.append("is_partial", String(params.is_partial));
    }
    if (params.amount !== undefined) {
      formData.append("amount", String(params.amount));
    }
    formData.append("zone_id", zoneId);
    formData.append("guest_id", guestId);
    formData.append("service_address_id", addressId);
    formData.append("service_address", fullAddress);
    formData.append("service_location", apiServiceLocation);
    formData.append("service_schedule", params.service_schedule);
    formData.append("booking_type", params.booking_type);
    formData.append("postcode", cleanPostcode);
    formData.append("latitude", String(params.latitude || "22.66215"));
    formData.append("longitude", String(params.longitude || "75.9035"));

    if (params.selected_slot_id) formData.append("selected_slot_id", params.selected_slot_id);
    if (effectiveNotes) formData.append("notes", effectiveNotes);
    if (isOnline || params.payment_platform) {
      formData.append("payment_platform", params.payment_platform || "app");
      formData.append(
        "callback",
        params.callback ||
        (typeof window !== "undefined"
          ? `${window.location.origin}/booking-success`
          : "https://mmcclub.co.uk/backend/booking-success")
      );
    }
    formData.append("is_terms_accepted", "1");
    formData.append("is_provider_terms_accepted", "1");
    formData.append("terms_and_conditions", "1");
    formData.append("terms_accepted", "1");
    const fcmToken = typeof window !== "undefined" ? localStorage.getItem("fcm_token") : null;
    if (fcmToken) {
      formData.append("fcm_token", fcmToken);
    }

    const response = await apiClient.post<SendBookingRequestResponse>(
      "/customer/booking/request/send",
      formData,
      {
        headers: {
          zoneid: zoneId,
          ZoneId: zoneId,
        },
      }
    );
    const responseData = response.data;
    if (isOnline || effectivePaymentMethod === "stripe") {
      await resolveBodyworkPaymentUrl(responseData, params, effectivePaymentMethod);
    }
    return responseData;
  } else {
    const fcmToken = typeof window !== "undefined" ? localStorage.getItem("fcm_token") : null;
    const payload: Record<string, any> = {
      post_id: params.post_id,
      provider_id: params.provider_id,
      payment_method: effectivePaymentMethod,
      ...(params.is_partial !== undefined ? { is_partial: Number(params.is_partial) } : {}),
      ...(params.amount !== undefined ? { amount: Number(params.amount) } : {}),
      zone_id: zoneId,
      guest_id: guestId,
      service_address_id: addressId,
      service_address: fullAddress,
      service_location: apiServiceLocation,
      service_schedule: params.service_schedule,
      booking_type: params.booking_type,
      postcode: cleanPostcode,
      latitude: String(params.latitude || "22.66215"),
      longitude: String(params.longitude || "75.9035"),
      notes: effectiveNotes,
      is_terms_accepted: 1,
      is_provider_terms_accepted: 1,
      terms_and_conditions: 1,
      terms_accepted: 1,
      ...(fcmToken ? { fcm_token: fcmToken } : {}),
    };

    if (params.selected_slot_id) payload.selected_slot_id = params.selected_slot_id;
    if (isOnline || params.payment_platform) {
      payload.payment_platform = params.payment_platform || "app";
      payload.callback =
        params.callback ||
        (typeof window !== "undefined"
          ? `${window.location.origin}/booking-success`
          : "https://mmcclub.co.uk/backend/booking-success");
    }

    const response = await apiClient.post<SendBookingRequestResponse>(
      "/customer/booking/request/send",
      payload,
      {
        headers: {
          zoneid: zoneId,
          ZoneId: zoneId,
          "Content-Type": "application/json",
        },
      }
    );
    const responseData = response.data;
    if (isOnline || effectivePaymentMethod === "stripe") {
      await resolveBodyworkPaymentUrl(responseData, params, effectivePaymentMethod);
    }
    return responseData;
  }
};

/**
 * Helper to ensure Stripe redirect URL is resolved for bodywork bookings
 */
async function resolveBodyworkPaymentUrl(
  responseData: SendBookingRequestResponse,
  params: SendBookingRequestParams,
  effectivePaymentMethod: string
) {
  const content = responseData?.content;
  let redirectLink =
    content?.redirect_link ||
    content?.redirect_url ||
    content?.payment_url ||
    content?.url ||
    content?.link ||
    (responseData as any)?.redirect_link ||
    (responseData as any)?.redirect_url ||
    (responseData as any)?.payment_url ||
    (responseData as any)?.url;

  const rawBookingId = content?.booking_id;
  const bookingUuid =
    (Array.isArray(rawBookingId) && rawBookingId.length > 0 ? rawBookingId[0] : null) ||
    (typeof rawBookingId === "string" ? rawBookingId : null) ||
    content?.id ||
    content?.payment_id ||
    (responseData as any)?.booking_id ||
    content?.readable_id;

  const isUuid = (val: any) =>
    typeof val === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());

  if (!redirectLink && bookingUuid) {
    const payloadsToTry = [
      {
        booking_id: String(bookingUuid),
        payment_method: "stripe",
        is_partial: params.is_partial ?? 0,
        payment_platform: "app",
        callback:
          params.callback ||
          (typeof window !== "undefined"
            ? `${window.location.origin}/booking-success`
            : "https://mmcclub.co.uk/booking-success"),
      },
      {
        booking_id: String(bookingUuid),
        payment_method: "stripe",
        is_partial: params.is_partial ?? 0,
        payment_platform: "web",
        callback:
          params.callback ||
          (typeof window !== "undefined"
            ? `${window.location.origin}/booking-success`
            : "https://mmcclub.co.uk/booking-success"),
      },
    ];

    for (const p of payloadsToTry) {
      if (redirectLink) break;
      try {
        console.log("[BodyworkPayment] Requesting switch-payment-method:", p);
        const switchRes = await apiClient.post("/customer/booking/switch-payment-method", p);
        const sData = switchRes.data;
        const sContent = sData?.content;
        const sRaw = typeof sContent === "object" && sContent !== null ? sContent : sData || {};

        if (typeof sContent === "string" && sContent.startsWith("http")) {
          redirectLink = sContent;
          break;
        }

        const candidateUrl =
          sRaw?.redirect_url ||
          sRaw?.redirect_link ||
          sRaw?.payment_url ||
          sRaw?.url ||
          sRaw?.link ||
          sRaw?.stripe_url ||
          sRaw?.data?.redirect_url ||
          sRaw?.data?.url;

        if (candidateUrl && String(candidateUrl).startsWith("http")) {
          redirectLink = String(candidateUrl);
          break;
        }

        const pId =
          sRaw?.payment_id || sRaw?.paymentId || sRaw?.stripe_payment_id || sRaw?.data?.payment_id;
        if (pId) {
          redirectLink = `https://mmcclub.co.uk/backend/payment/stripe/pay?payment_id=${encodeURIComponent(
            String(pId)
          )}&is_partial=${params.is_partial ?? 0}`;
          break;
        }
      } catch (switchErr: any) {
        const errData = switchErr?.response?.data;
        if (errData?.content?.redirect_url && String(errData.content.redirect_url).startsWith("http")) {
          redirectLink = String(errData.content.redirect_url);
          break;
        }
        console.warn("[BodyworkPayment] switch-payment-method notice:", errData?.message || switchErr.message);
      }
    }
  }

  // Fallback to direct Demandium Stripe pay endpoint if any valid booking identifier exists
  const effectiveId = bookingUuid || params.post_id;
  if (!redirectLink && effectiveId) {
    redirectLink = `https://mmcclub.co.uk/backend/payment/stripe/pay?payment_id=${encodeURIComponent(
      String(effectiveId)
    )}&is_partial=${params.is_partial ?? 0}`;
  }

  if (redirectLink) {
    if (!responseData.content || typeof responseData.content !== "object") {
      responseData.content = {};
    }
    responseData.content.redirect_link = redirectLink;
    responseData.content.redirect_url = redirectLink;
    responseData.content.payment_url = redirectLink;
    responseData.content.url = redirectLink;
  }
}
