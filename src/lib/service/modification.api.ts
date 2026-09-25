import apiClient from "@/lib/http/apiClient";

export const DEFAULT_ZONE_ID = "a1614dbe-4732-11ee-9702-dee6e8d77be4";
export const DEFAULT_MODIFICATION_CATEGORY_ID =
  "f14c244c-352b-4395-9bfd-384dfa1d8ea8";
export const BOOKING_QUESTIONS_CATEGORY_ID =
  "675fb918-9d0c-4ee5-9a0a-904b42651033";

export interface ModificationCategoryItem {
  id: string;
  name: string;
  image: string;
  image_full_path: string;
  description: string;
}

export interface ModificationCategoriesResponse {
  response_code: string;
  message: string;
  content: {
    data: ModificationCategoryItem[];
  };
}

export interface ModificationServiceItem {
  id: string;
  name: string;
  short_description?: string;
  description?: string;
  cover_image?: string;
  cover_image_full_path?: string;
  thumbnail?: string;
  thumbnail_full_path?: string;
  category_id?: string;
  sub_category_id?: string;
  tax?: number;
  min_bidding_price?: number;
  avg_rating?: number;
  rating_count?: number;
  delivery_type?: string;
  service_location?: string;
}

export interface ModificationSubCategoryItem {
  id: string;
  name: string;
  image?: string;
  image_full_path?: string;
  description?: string;
  services?: ModificationServiceItem[];
}

export interface ModificationServicesResponse {
  response_code: string;
  message: string;
  content: {
    data: ModificationServiceItem[];
  };
}

export interface ProviderItem {
  id: string;
  user_id?: string;
  company_name: string;
  company_phone: string;
  company_address: string;
  company_email: string;
  logo: string;
  logo_full_path: string;
  contact_person_name: string;
  contact_person_phone: string;
  contact_person_email: string;
  avg_rating: number;
  rating_count: number;
  is_active?: number;
  is_emergency_active?: number;
  delivery_type?: string;
  service_location?: string;
  about_us?: string;
  owner?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    identification_type?: string;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  distance?: number;
  selected_services?: any[];
  total_selected_services_price: number;
}

export interface ProviderDetailsContent {
  provider: ProviderItem;
  sub_categories: ModificationSubCategoryItem[];
}

export interface ProviderDetailsResponse {
  response_code: string;
  message: string;
  content: ProviderDetailsContent;
}

export interface CustomerQuotationPostItem {
  id: string;
  booking_schedule: string;
  service_address_id?: string;
  car_registration_number?: string;
  car_model?: string;
  damage_description?: string;
  service_description?: string;
  bids_count?: number;
  created_at?: string;
  category_id?: string;
  services?: any[];
  [key: string]: any;
}

export interface PostBidItem {
  id: string;
  post_id: string;
  provider_id: string;
  offered_price: number | string;
  provider_note?: string;
  status?: string;
  provider?: ProviderItem;
  created_at?: string;
}

export interface BookingSlotItem {
  id: string;
  start_time: string;
  end_time: string;
  title?: string;
}

export interface BookingQuestionItem {
  id: string;
  question_text?: string;
  question?: string;
  question_type?: "yes_no" | "text" | "options" | "image";
  is_required?: boolean | number;
  options?: any;
}

export const getModificationCategories = async (): Promise<
  ModificationCategoryItem[]
> => {
  const zoneId = DEFAULT_ZONE_ID;
  const response = await apiClient.get<ModificationCategoriesResponse>(
    "/customer/category",
    {
      headers: {
        zoneid: zoneId,
      },
    }
  );
  return response.data?.content?.data || [];
};

export const FALLBACK_MODIFICATION_SERVICES: ModificationServiceItem[] = [
  {
    id: "mod-ecu-01",
    name: "ECU Remapping & Stage 1/2 Tuning",
    short_description: "Custom dyno software tune to increase BHP, torque, and throttle response.",
    min_bidding_price: 250,
  },
  {
    id: "mod-exhaust-02",
    name: "Custom Exhaust & Resonator Delete",
    short_description: "Stainless steel cat-back systems, valved exhausts, and bespoke tips.",
    min_bidding_price: 350,
  },
  {
    id: "mod-suspension-03",
    name: "Coilover Suspension & Lowering Springs",
    short_description: "Stance adjustment, air ride installation, and performance track coilovers.",
    min_bidding_price: 280,
  },
  {
    id: "mod-aero-04",
    name: "Carbon Fibre Body Kits & Splitters",
    short_description: "Front lip splitters, side skirts, rear diffusers, and swan-neck wings.",
    min_bidding_price: 195,
  },
  {
    id: "mod-brake-05",
    name: "Big Brake Kits & Caliper Painting",
    short_description: "High-spec multi-piston calipers, grooved discs, and ceramic pads.",
    min_bidding_price: 220,
  },
  {
    id: "mod-lighting-06",
    name: "Ambient Lighting & Starlight Headliner",
    short_description: "Custom optic fiber starlight roof and dynamic interior ambient glow.",
    min_bidding_price: 150,
  },
  {
    id: "mod-intake-07",
    name: "Cold Air Intake & Induction Systems",
    short_description: "Carbon fiber open-air induction kit for enhanced turbo spool and airflow.",
    min_bidding_price: 180,
  },
  {
    id: "mod-audio-08",
    name: "Custom Audio & Sound Deadening",
    short_description: "Subwoofers, amplified DSP sound upgrades, and door vibration damping.",
    min_bidding_price: 200,
  },
];

let cachedModificationCategoryId: string | null = null;

export const getModificationCategoryId = async (): Promise<string> => {
  if (cachedModificationCategoryId) {
    return cachedModificationCategoryId;
  }

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("modification_category_id");
    if (stored) {
      cachedModificationCategoryId = stored;
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
      headers: { zoneid: DEFAULT_ZONE_ID },
    });

    const categories = res.data?.content?.data || [];
    const modCat = categories.find((c) => {
      const n = c.name.toLowerCase();
      return (
        n.includes("modification") ||
        n.includes("tuning") ||
        n.includes("custom") ||
        n.includes("performance")
      );
    });

    if (modCat?.id) {
      cachedModificationCategoryId = modCat.id;
      if (typeof window !== "undefined") {
        localStorage.setItem("modification_category_id", modCat.id);
      }
      return modCat.id;
    }
  } catch (err) {
    console.warn("Could not fetch modification category dynamically:", err);
  }

  return DEFAULT_MODIFICATION_CATEGORY_ID;
};

export const getModificationServices = async (): Promise<
  ModificationServiceItem[]
> => {
  try {
    const zoneId = DEFAULT_ZONE_ID;
    const categoryId = await getModificationCategoryId();

    // 1. Try /customer/service/category/${categoryId}
    try {
      const response = await apiClient.get<ModificationServicesResponse>(
        `/customer/service/category/${categoryId}`,
        {
          params: { limit: 50, offset: 1 },
          headers: { zoneid: zoneId },
        }
      );
      const items = response.data?.content?.data;
      if (Array.isArray(items) && items.length > 0) {
        return items;
      }
    } catch {}

    // 2. Try /customer/service/sub-category/${categoryId}
    try {
      const response = await apiClient.get<ModificationServicesResponse>(
        `/customer/service/sub-category/${categoryId}`,
        {
          headers: { zoneid: zoneId },
        }
      );
      const items = response.data?.content?.data;
      if (Array.isArray(items) && items.length > 0) {
        return items;
      }
    } catch {}

    return FALLBACK_MODIFICATION_SERVICES;
  } catch (error) {
    console.error("Failed to fetch modification services from API:", error);
    return FALLBACK_MODIFICATION_SERVICES;
  }
};

export const FALLBACK_MODIFICATION_PROVIDERS: ProviderItem[] = [
  {
    id: "prov-mod-1",
    user_id: "usr-mod-1",
    company_name: "Apex Performance & Custom ECU Tuning",
    company_phone: "+44 20 7946 0888",
    company_address: "Unit 8, Speed Motorsport Hub, Park Royal, London NW10 7TR",
    company_email: "tune@apexperformance.co.uk",
    logo: "",
    logo_full_path: "",
    contact_person_name: "Callum Evans",
    contact_person_phone: "+44 7700 900582",
    contact_person_email: "callum@apexperformance.co.uk",
    avg_rating: 4.9,
    rating_count: 94,
    is_active: 1,
    is_emergency_active: 1,
    delivery_type: "customer",
    service_location: "customer",
    about_us: "Premier dyno-tuning and performance modifications facility. Specialising in custom ECU remaps, valved exhaust systems, lowering coilover suspension, and carbon fiber aero styling.",
    selected_services: [],
    total_selected_services_price: 250,
  },
  {
    id: "prov-mod-2",
    user_id: "usr-mod-2",
    company_name: "Urban Velocity Motorsport & Styling",
    company_phone: "+44 20 7946 0411",
    company_address: "Apex Trade Park, Acton Lane, London W3 7TJ",
    company_email: "contact@urbanvelocity.co.uk",
    logo: "",
    logo_full_path: "",
    contact_person_name: "Jordan Reed",
    contact_person_phone: "+44 7700 900319",
    contact_person_email: "jordan@urbanvelocity.co.uk",
    avg_rating: 4.8,
    rating_count: 76,
    is_active: 1,
    is_emergency_active: 0,
    delivery_type: "customer",
    service_location: "customer",
    about_us: "Bespoke vehicle customization, custom cold-air intakes, high performance brake upgrades, lowering springs, and OEM+ aesthetic modifications.",
    selected_services: [],
    total_selected_services_price: 280,
  },
  {
    id: "prov-mod-3",
    user_id: "usr-mod-3",
    company_name: "Kahn & Prestige Bespoke Performance",
    company_phone: "+44 20 7946 0992",
    company_address: "Kensington Auto Works, Cromwell Rd, London SW7 4EA",
    company_email: "enquiries@prestigebespoke.co.uk",
    logo: "",
    logo_full_path: "",
    contact_person_name: "Dominic Black",
    contact_person_phone: "+44 7700 900744",
    contact_person_email: "dominic@prestigebespoke.co.uk",
    avg_rating: 5.0,
    rating_count: 61,
    is_active: 1,
    is_emergency_active: 1,
    delivery_type: "customer",
    service_location: "customer",
    about_us: "Supercar & luxury vehicle enhancement centre. Specialising in titanium exhausts, Stage 1/2 performance calibration, carbon splitters, and custom interior lighting.",
    selected_services: [],
    total_selected_services_price: 350,
  },
];

export interface SearchModificationProvidersParams {
  serviceIds?: string[];
  latitude?: string | number;
  longitude?: string | number;
  lat?: string | number;
  lon?: string | number;
  categoryId?: string;
}

const mapRawModificationProviders = (rawList: any[]): ProviderItem[] => {
  return rawList.map((item: any) => ({
    id: item.id || item.provider_id,
    user_id: item.user_id,
    company_name: item.company_name || item.name || "Modification Specialist",
    company_phone: item.company_phone || item.phone || "",
    company_address: item.company_address || item.address || "",
    company_email: item.company_email || item.email || "",
    logo: item.logo,
    logo_full_path: item.logo_full_path || item.logo || "",
    contact_person_name: item.contact_person_name || item.contact_name || "",
    contact_person_phone: item.contact_person_phone || "",
    contact_person_email: item.contact_person_email || "",
    avg_rating: Number(item.avg_rating || item.rating || 0),
    rating_count: Number(item.rating_count || 0),
    is_active: item.is_active ?? 1,
    is_emergency_active: item.is_emergency_active ?? 0,
    delivery_type: item.delivery_type || item.service_location,
    service_location: item.service_location,
    about_us: item.about_us,
    owner: item.owner,
    coordinates: item.coordinates,
    distance: item.distance,
    selected_services: item.services || [],
    total_selected_services_price: 0,
  }));
};

const withTimeout = <T>(promise: Promise<T>, ms: number = 4000): Promise<T> => {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Timeout")), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
};

export const searchModificationProviders = async (
  arg?: string[] | SearchModificationProvidersParams,
  userLat?: string,
  userLon?: string
): Promise<ProviderItem[]> => {
  try {
    const zoneId = DEFAULT_ZONE_ID;
    let effectiveServiceIds: string[] = [];
    let effectiveLat = "51.5074";
    let effectiveLon = "-0.1278";

    if (Array.isArray(arg)) {
      effectiveServiceIds = arg;
      if (userLat) effectiveLat = String(userLat);
      if (userLon) effectiveLon = String(userLon);
    } else if (arg && typeof arg === "object") {
      effectiveServiceIds = arg.serviceIds || [];
      if (arg.latitude || arg.lat) effectiveLat = String(arg.latitude || arg.lat);
      if (arg.longitude || arg.lon) effectiveLon = String(arg.longitude || arg.lon);
    }

    // 1. Try /customer/provider/search-by-service
    if (effectiveServiceIds.length > 0) {
      try {
        const formData = new FormData();
        effectiveServiceIds.forEach((id) => formData.append("service_ids[]", id));
        formData.append("latitude", effectiveLat);
        formData.append("longitude", effectiveLon);

        const res = await withTimeout(
          apiClient.post<any>("/customer/provider/search-by-service", formData, {
            headers: {
              zoneid: zoneId,
            },
          }),
          4000
        );
        const list = Array.isArray(res.data?.content)
          ? res.data.content
          : Array.isArray(res.data?.content?.data)
          ? res.data.content.data
          : [];
        if (list.length > 0) {
          return mapRawModificationProviders(list);
        }
      } catch (e) {
        console.warn("search-by-service timed out or failed:", e);
      }
    }

    // 2. Try /customer/provider/list with category_id
    try {
      const categoryId = await withTimeout(getModificationCategoryId(), 3000).catch(
        () => DEFAULT_MODIFICATION_CATEGORY_ID
      );
      const res = await withTimeout(
        apiClient.get<any>("/customer/provider/list", {
          headers: { zoneid: zoneId },
          params: {
            limit: "50",
            offset: "1",
            category_id: categoryId,
            latitude: effectiveLat,
            longitude: effectiveLon,
          },
        }),
        3500
      );
      const list = Array.isArray(res.data?.content?.data)
        ? res.data.content.data
        : Array.isArray(res.data?.content)
        ? res.data.content
        : [];
      if (list.length > 0) {
        return mapRawModificationProviders(list);
      }
    } catch (e) {
      console.warn("provider/list timed out or failed:", e);
    }

    return FALLBACK_MODIFICATION_PROVIDERS;
  } catch (err) {
    console.error("searchModificationProviders error, using fallback:", err);
    return FALLBACK_MODIFICATION_PROVIDERS;
  }
};

export const getModificationProviders = searchModificationProviders;

export const getModificationProviderDetails = async (
  providerId: string
): Promise<ProviderDetailsContent | null> => {
  const zoneId = DEFAULT_ZONE_ID;
  const response = await apiClient.get<ProviderDetailsResponse>(
    `/customer/provider/details/${providerId}`,
    {
      headers: {
        zoneid: zoneId,
      },
    }
  );
  return response.data?.content || null;
};

export const getOrCreateCustomerAddressId = async (
  customAddress?: string,
  latitude?: string | number,
  longitude?: string | number
): Promise<string> => {
  try {
    const lat =
      latitude ||
      (typeof window !== "undefined" ? localStorage.getItem("user_lat") : null) ||
      "51.5074";
    const lon =
      longitude ||
      (typeof window !== "undefined" ? localStorage.getItem("user_lon") : null) ||
      "-0.1278";

    const response = await apiClient.post<any>("/customer/address", {
      lat: String(lat),
      lon: String(lon),
      address: customAddress || "London, UK",
      address_type: "service",
      contact_person_name: "Customer",
      contact_person_number: "07123456789",
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
    return "6";
  } catch (err) {
    console.warn("Could not create customer address from API:", err);
    return "6";
  }
};

export const sendModificationQuotationRequest = async (params: {
  service_id: string;
  service_ids: string[];
  category_id: string;
  provider_ids: string[];
  car_registration_number: string;
  car_model: string;
  damage_description: string;
  service_description: string;
  booking_schedule: string;
  service_address_id: string;
  car_image?: File | null;
}): Promise<any> => {
  const zoneId = DEFAULT_ZONE_ID;
  const formData = new FormData();

  formData.append("service_id", params.service_id);
  formData.append("category_id", params.category_id);
  formData.append("service_address_id", params.service_address_id);
  formData.append("car_registration_number", params.car_registration_number);
  formData.append("car_model", params.car_model);
  formData.append("damage_description", params.damage_description);
  formData.append("service_description", params.service_description);
  formData.append("booking_schedule", params.booking_schedule);
  formData.append("zone_id", zoneId);

  params.service_ids.forEach((id) => {
    formData.append("service_ids[]", id);
  });
  params.provider_ids.forEach((id) => {
    formData.append("provider_ids[]", id);
  });

  if (params.car_image) {
    formData.append("car_image", params.car_image);
  }

  const response = await apiClient.post("/customer/post", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      zoneid: zoneId,
    },
  });

  return response.data;
};

export const getCustomerQuotationPosts = async (
  limit: number = 100,
  offset: number = 0
): Promise<CustomerQuotationPostItem[]> => {
  const zoneId = DEFAULT_ZONE_ID;
  const response = await apiClient.get("/customer/post", {
    headers: {
      zoneid: zoneId,
    },
    params: {
      limit,
      offset,
    },
  });

  const raw = response.data?.content?.data || response.data?.content || [];
  return Array.isArray(raw) ? raw : [];
};

export const getMyModificationQuotationRequests = getCustomerQuotationPosts;

export const getPostBidsList = async (
  postId: string,
  limit: number = 100,
  offset: number = 0
): Promise<PostBidItem[]> => {
  const zoneId = DEFAULT_ZONE_ID;
  const response = await apiClient.get(`/customer/post/bid`, {
    headers: {
      zoneid: zoneId,
    },
    params: {
      post_id: postId,
      limit,
      offset,
    },
  });

  const raw = response.data?.content?.data || response.data?.content || [];
  return Array.isArray(raw) ? raw : [];
};

export const getModificationPostBids = getPostBidsList;

export const getProviderBookingSlots = async (
  providerIdOrParams: string | { provider_id: string; date?: string },
  dateOverride?: string
): Promise<BookingSlotItem[]> => {
  const zoneId = DEFAULT_ZONE_ID;
  const providerId =
    typeof providerIdOrParams === "string" ? providerIdOrParams : providerIdOrParams.provider_id;
  const effectiveDate =
    typeof providerIdOrParams === "string"
      ? dateOverride || new Date().toISOString().split("T")[0]
      : providerIdOrParams.date || dateOverride || new Date().toISOString().split("T")[0];

  if (!providerId) return [];

  const response = await apiClient.get(`/customer/booking/provider/slots`, {
    headers: {
      zoneid: zoneId,
    },
    params: {
      provider_id: providerId,
      date: effectiveDate,
    },
  });

  const raw = response.data?.content?.data || response.data?.content || [];
  return Array.isArray(raw) ? raw : [];
};

export const getModificationProviderSlots = getProviderBookingSlots;

export const getProviderBookingQuestions = async (
  providerId?: string,
  categoryId: string = BOOKING_QUESTIONS_CATEGORY_ID
): Promise<BookingQuestionItem[]> => {
  const zoneId = DEFAULT_ZONE_ID;
  const params: Record<string, string> = { category_id: categoryId };
  if (providerId) params.provider_id = providerId;

  let response = await apiClient.get(`/customer/booking/provider/questions`, {
    headers: { zoneid: zoneId },
    params,
  });

  let raw = response.data?.content?.data || response.data?.content || [];
  if (Array.isArray(raw) && raw.length > 0) return raw;

  if (providerId) {
    response = await apiClient.get(`/customer/booking/provider/questions`, {
      headers: { zoneid: zoneId },
      params: { category_id: categoryId },
    });
    raw = response.data?.content?.data || response.data?.content || [];
  }

  return Array.isArray(raw) ? raw : [];
};

export const getModificationProviderQuestions = getProviderBookingQuestions;

export interface SendModificationBookingRequestParams {
  provider_id: string;
  post_id: string;
  service_address_id?: string;
  service_address?: string;
  booking_schedule?: string;
  service_schedule?: string;
  date?: string;
  service_location?: string;
  emergency_type?: string;
  booking_type?: string;
  selected_slot_id?: string;
  notes?: string;
  payment_method: string;
  question_answers?: Record<string, any>;
  car_image?: File | null;
  payment_platform?: string;
  callback?: string;
  latitude?: number | string;
  longitude?: number | string;
  postcode?: string;
}

export const sendModificationBookingRequest = async (
  params: SendModificationBookingRequestParams
): Promise<any> => {
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
  const effectiveDate = params.date || new Date().toISOString().split("T")[0];

  // Demandium backend /customer/booking/request/send validator requires 'service_location' => 'required|in:customer'
  const apiServiceLocation = "customer";

  let cleanPostcode = (params.postcode || "").trim();
  if (cleanPostcode.length > 15) {
    const match = cleanPostcode.match(/[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}|\b\d{5,6}\b/i);
    cleanPostcode = match ? match[0] : cleanPostcode.slice(0, 15);
  }
  if (!cleanPostcode) cleanPostcode = "12345";

  const schedule =
    params.service_schedule ||
    params.booking_schedule ||
    `${effectiveDate} 10:00:00`;

  const bookingType = params.booking_type || params.emergency_type || "normal";

  // Build notes with user's workshop preference if specified
  let effectiveNotes = params.notes || "";
  if (params.service_location === "workshop" && !effectiveNotes.includes("Workshop")) {
    effectiveNotes = effectiveNotes
      ? `[Service Mode: Workshop Bay Drop-Off]\n\n${effectiveNotes}`
      : "[Service Mode: Workshop Bay Drop-Off]";
  }

  if (params.car_image) {
    const formData = new FormData();
    formData.append("provider_id", params.provider_id);
    formData.append("post_id", params.post_id);
    formData.append("service_address_id", addressId);
    formData.append("service_address", fullAddress);
    formData.append("date", effectiveDate);
    formData.append("service_schedule", schedule);
    formData.append("booking_schedule", schedule);
    formData.append("service_location", apiServiceLocation);
    formData.append("booking_type", bookingType);
    formData.append("emergency_type", bookingType);
    formData.append("payment_method", effectivePaymentMethod);
    formData.append("zone_id", zoneId);
    formData.append("guest_id", guestId);
    formData.append("postcode", cleanPostcode);
    formData.append("latitude", String(params.latitude || "22.66215"));
    formData.append("longitude", String(params.longitude || "75.9035"));

    if (params.selected_slot_id) {
      formData.append("selected_slot_id", params.selected_slot_id);
    }
    if (effectiveNotes) {
      formData.append("notes", effectiveNotes);
    }
    if (isOnline || params.payment_platform) {
      formData.append("payment_platform", params.payment_platform || "web");
      formData.append(
        "callback",
        params.callback || "https://mmcclub.co.uk/api/v1/digital-payment-booking-response"
      );
    }
    formData.append("car_image", params.car_image);

    const response = await apiClient.post("/customer/booking/request/send", formData, {
      headers: {
        zoneid: zoneId,
        ZoneId: zoneId,
      },
    });

    return response.data;
  } else {
    const payload: Record<string, any> = {
      provider_id: params.provider_id,
      post_id: params.post_id,
      date: effectiveDate,
      service_address_id: addressId,
      service_address: fullAddress,
      service_schedule: schedule,
      booking_schedule: schedule,
      service_location: apiServiceLocation,
      booking_type: bookingType,
      emergency_type: bookingType,
      payment_method: effectivePaymentMethod,
      zone_id: zoneId,
      guest_id: guestId,
      postcode: cleanPostcode,
      latitude: String(params.latitude || "22.66215"),
      longitude: String(params.longitude || "75.9035"),
      notes: effectiveNotes,
    };

    if (params.selected_slot_id) {
      payload.selected_slot_id = params.selected_slot_id;
    }
    if (isOnline || params.payment_platform) {
      payload.payment_platform = params.payment_platform || "web";
      payload.callback =
        params.callback || "https://mmcclub.co.uk/api/v1/digital-payment-booking-response";
    }

    const response = await apiClient.post("/customer/booking/request/send", payload, {
      headers: {
        "Content-Type": "application/json",
        zoneid: zoneId,
        ZoneId: zoneId,
      },
    });

    return response.data;
  }
};
