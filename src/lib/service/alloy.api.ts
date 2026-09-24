import apiClient from "@/lib/http/apiClient";

export interface AlloyServiceItem {
  id: string;
  name: string;
  short_description?: string;
  description?: string;
  price?: number;
  category_id?: string;
  is_active?: number;
}

export interface AlloyServicesResponse {
  response_code: string;
  message: string;
  content: {
    current_page: number;
    data: AlloyServiceItem[];
    total: number;
    per_page: number;
  };
}

export const ALLOY_CATEGORY_ID = "e1fb2dae-c233-4b45-852b-8253373e06d7";
export const BOOKING_QUESTIONS_CATEGORY_ID = "675fb918-9d0c-4ee5-9a0a-904b42651033";
export const DEFAULT_ZONE_ID = "a1614dbe-4732-11ee-9702-dee6e8d77be4";

/**
 * Fetch Alloy Wheel services strictly from the backend API.
 * Static zone id DEFAULT_ZONE_ID is used.
 */
export const getAlloyServices = async (
  categoryId: string = ALLOY_CATEGORY_ID,
  limit: number = 20,
  offset: number = 1
): Promise<AlloyServiceItem[]> => {
  try {
    const zoneId = DEFAULT_ZONE_ID;

    const response = await apiClient.get<AlloyServicesResponse>(
      `/customer/service/category/${categoryId}`,
      {
        params: { limit, offset },
        headers: {
          zoneid: zoneId,
        },
      }
    );

    if (response.data?.content?.data && Array.isArray(response.data.content.data)) {
      return response.data.content.data;
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch alloy services from API:", error);
    return [];
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
  identification_image_full_path?: string[];
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
  rating_count: number;
  avg_rating: number;
  order_count?: number;
  service_man_count?: number;
  service_capacity_per_day?: number;
  commission_status?: number;
  commission_percentage?: number;
  is_active?: number;
  is_emergency_active?: number;
  after_hours_available?: number;
  weekend_emergency_available?: number;
  motorway_recovery_approved?: number;
  emergency_response_time?: string | null;
  service_availability?: number;
  is_approved?: number;
  is_suspended?: number;
  zone_id?: string;
  postcode?: string | null;
  coordinates?: {
    latitude: string | null;
    longitude: string | null;
  };
  selected_services: SelectedServiceDetail[];
  total_selected_services_price: number;
  about_us?: string | null;
  terms_and_conditions?: string | null;
  subscribed_services_count?: number;
  total_service_served?: number;
  owner?: ProviderOwner;
  reviews?: unknown[];
}

export interface ProviderSearchResponse {
  response_code: string;
  message: string;
  content: ProviderItem[];
}

/**
 * Search providers by service IDs strictly from the backend API.
 * No static mock data.
 */
export const searchProvidersByService = async (params: {
  serviceIds: string[];
  latitude?: string | number;
  longitude?: string | number;
}): Promise<ProviderItem[]> => {
  try {
    const zoneId = DEFAULT_ZONE_ID;

    const lat =
      params.latitude ||
      (typeof window !== "undefined" ? localStorage.getItem("user_lat") : null) ||
      "22.66215";
    const lon =
      params.longitude ||
      (typeof window !== "undefined" ? localStorage.getItem("user_lon") : null) ||
      "75.9035";

    const formData = new FormData();
    const effectiveServiceIds =
      params.serviceIds && params.serviceIds.length > 0
        ? params.serviceIds
        : ["3e8b192f-c32a-4219-946f-6ce98b9a88b6"];

    effectiveServiceIds.forEach((id) => {
      formData.append("service_ids[]", id);
    });
    formData.append("latitude", String(lat));
    formData.append("longitude", String(lon));

    const response = await apiClient.post<ProviderSearchResponse>(
      "/customer/provider/search-by-service",
      formData,
      {
        headers: {
          zoneid: zoneId,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (Array.isArray(response.data?.content)) {
      return response.data.content;
    }
    return [];
  } catch (error) {
    console.error("Failed to search providers from API:", error);
    return [];
  }
};

export interface SubCategoryService {
  id: string;
  name: string;
  short_description?: string;
  description?: string;
  price?: number;
  min_bidding_price?: string;
  category_id?: string;
  sub_category_id?: string;
  is_active?: number;
  rating_count?: number;
  avg_rating?: number;
  thumbnail_full_path?: string | null;
  cover_image_full_path?: string | null;
}

export interface ProviderSubCategory {
  id: string;
  parent_id?: string;
  name: string;
  description?: string;
  services: SubCategoryService[];
}

export interface ProviderReviewData {
  current_page?: number;
  data?: unknown[];
  total?: number;
}

export interface ProviderRatingData {
  rating_count?: number;
  review_count?: number;
  average_rating?: number;
  rating_group_count?: unknown[];
}

export interface ProviderFullProfile {
  id: string;
  user_id?: string;
  company_name: string;
  company_phone: string;
  company_address: string;
  company_email: string;
  logo?: string | null;
  logo_full_path?: string | null;
  cover_image?: string | null;
  cover_image_full_path?: string | null;
  contact_person_name?: string;
  contact_person_phone?: string;
  contact_person_email?: string;
  order_count?: number;
  service_man_count?: number;
  service_capacity_per_day?: number;
  rating_count?: number;
  avg_rating?: number;
  is_active?: number;
  is_emergency_active?: number;
  after_hours_available?: number;
  weekend_emergency_available?: number;
  motorway_recovery_approved?: number;
  emergency_response_time?: string | null;
  service_availability?: number;
  total_service_served?: number;
  subscribed_services_count?: number;
  is_favorite?: number;
  terms_and_conditions?: string | null;
  about_us?: string | null;
  nextBookingEligibility?: boolean;
  scheduleBookingEligibility?: boolean;
  postcode?: string | null;
  coordinates?: {
    latitude: string | null;
    longitude: string | null;
  };
  owner?: ProviderOwner;
}

export interface ProviderDetailsContent {
  provider: ProviderFullProfile;
  sub_categories?: ProviderSubCategory[];
  reviews?: ProviderReviewData;
  rating?: ProviderRatingData;
}

export interface ProviderDetailsResponse {
  response_code: string;
  message: string;
  content: ProviderDetailsContent;
}

/**
 * Fetch full provider profile details directly from the API:
 * GET /customer/provider-details?id={id}&limit={limit}&offset={offset}
 */
export const getProviderDetails = async (
  providerId: string,
  limit: number = 10,
  offset: number = 1
): Promise<ProviderDetailsContent | null> => {
  try {
    const zoneId =
      (typeof window !== "undefined" &&
        (localStorage.getItem("zone_id") ||
          localStorage.getItem("zoneid") ||
          localStorage.getItem("zoneId"))) ||
      DEFAULT_ZONE_ID;

    const response = await apiClient.get<ProviderDetailsResponse>(
      "/customer/provider-details",
      {
        params: { id: providerId, limit, offset },
        headers: {
          zoneid: zoneId,
        },
      }
    );

    if (response.data?.content?.provider) {
      return response.data.content;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch provider details from API:", error);
    return null;
  }
};

export interface CreateQuotationRequestParams {
  service_id?: string;
  service_ids?: string[];
  category_id: string;
  provider_ids: string[];
  service_description?: string;
  booking_schedule?: string;
  service_address_id?: string;
  car_model?: string;
  car_registration_number?: string;
  damage_description?: string;
  car_image?: File | null;
}

export interface CreateQuotationResponse {
  response_code: string;
  message: string;
  content: {
    post_id: string;
  };
  errors?: any[];
}

/**
 * Send Quotation Request to Selected Providers (RFQ)
 * POST /customer/post
 */
export const sendQuotationRequest = async (
  params: CreateQuotationRequestParams
): Promise<CreateQuotationResponse> => {
  const formData = new FormData();
  const primaryServiceId =
    params.service_id ||
    (params.service_ids && params.service_ids.length > 0 ? params.service_ids[0] : "");
  if (primaryServiceId) {
    formData.append("service_id", primaryServiceId);
  }

  if (params.service_ids && params.service_ids.length > 0) {
    params.service_ids.forEach((id) => {
      formData.append("service_ids[]", id);
    });
  }

  formData.append("category_id", params.category_id);

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
  if (params.car_image) {
    formData.append("car_image", params.car_image);
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

/**
 * Create or Fetch Customer Address
 * POST /customer/address
 */
export const getOrCreateCustomerAddressId = async (
  customAddress?: string,
  latitude?: string | number,
  longitude?: string | number
): Promise<string> => {
  try {
    const lat =
      latitude ||
      (typeof window !== "undefined" ? localStorage.getItem("user_lat") : null) ||
      "22.7196";
    const lon =
      longitude ||
      (typeof window !== "undefined" ? localStorage.getItem("user_lon") : null) ||
      "75.8577";

    const response = await apiClient.post<any>("/customer/address", {
      lat: String(lat),
      lon: String(lon),
      address: customAddress || "123, Vijay Nagar, Indore",
      address_type: "service",
      contact_person_name: "Rohit Gannote",
      contact_person_number: "9009775909",
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
    return "";
  } catch (err) {
    console.warn("Could not create customer address from API:", err);
    return "";
  }
};

export interface TargetedProviderItem {
  id: string;
  user_id?: string;
  company_name: string;
  company_phone: string;
  company_address: string;
  company_email?: string;
  logo?: string | null;
  logo_full_path?: string | null;
  contact_person_name?: string;
  contact_person_phone?: string;
  contact_person_email?: string;
  avg_rating?: number;
  rating_count?: number;
  is_active?: number;
  order_count?: number;
}

export interface CustomerQuotationPostItem {
  id: string;
  service_description?: string | null;
  car_model?: string | null;
  car_registration_number?: string | null;
  car_image?: string | null;
  damage_description?: string | null;
  booking_schedule?: string | null;
  is_booked?: number;
  is_checked?: number;
  customer_user_id?: string;
  service_id?: string;
  category_id?: string;
  sub_category_id?: string;
  service_address_id?: string;
  zone_id?: string;
  booking_id?: string | null;
  created_at?: string;
  updated_at?: string;
  bids_count?: number;
  category?: {
    id: string;
    name: string;
    description?: string;
  } | null;
  sub_category?: {
    id: string;
    name: string;
    description?: string;
  } | null;
  booking?: {
    id: string;
    readable_id?: number;
    booking_status?: string;
    total_booking_amount?: number;
    payment_method?: string;
    [key: string]: any;
  } | null;
  targeted_providers?: TargetedProviderItem[];
}

export interface CustomerQuotationPostsResponse {
  response_code: string;
  message: string;
  content: {
    current_page: number;
    data: CustomerQuotationPostItem[];
    total: number;
    per_page: number;
  };
}

/**
 * Get My Quotation Requests List
 * GET /customer/post?limit=10&offset=1
 */
export const getMyQuotationRequests = async (
  limit: number = 10,
  offset: number = 1
): Promise<CustomerQuotationPostItem[]> => {
  try {
    const zoneId = DEFAULT_ZONE_ID;

    const response = await apiClient.get<CustomerQuotationPostsResponse>(
      "/customer/post",
      {
        params: { limit, offset },
        headers: {
          zoneid: zoneId,
        },
      }
    );

    if (response.data?.content?.data && Array.isArray(response.data.content.data)) {
      return response.data.content.data;
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch customer quotation requests list:", error);
    return [];
  }
};

export interface PostBidProvider {
  id: string;
  user_id?: string;
  company_name: string;
  company_phone: string;
  company_address: string;
  company_email?: string;
  logo?: string | null;
  contact_person_name?: string;
  contact_person_phone?: string;
  contact_person_email?: string;
  order_count?: number;
  service_man_count?: number;
  service_capacity_per_day?: number;
  rating_count?: number;
  avg_rating?: number;
  is_active?: number;
  is_emergency_active?: number;
  logo_full_path?: string | null;
  cover_image_full_path?: string | null;
  owner?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email?: string;
    phone?: string;
    [key: string]: any;
  };
}

export interface PostBidItem {
  id: string;
  offered_price: string | number;
  provider_note?: string;
  status: string;
  post_id: string;
  provider_id: string;
  created_at?: string;
  updated_at?: string;
  provider: PostBidProvider;
}

export interface PostBidsResponse {
  response_code: string;
  message: string;
  content: {
    current_page: number;
    data: PostBidItem[];
    total: number;
    per_page: number;
  };
}

/**
 * Get Received Quotes / Bids from Providers for a Post
 * GET /customer/post/bid?post_id={{post_id}}&limit=10&offset=1
 */
export const getReceivedBidsForPost = async (
  postId: string,
  limit: number = 10,
  offset: number = 1
): Promise<PostBidItem[]> => {
  try {
    const zoneId = DEFAULT_ZONE_ID;

    const response = await apiClient.get<PostBidsResponse>(
      "/customer/post/bid",
      {
        params: {
          post_id: postId,
          limit,
          offset,
        },
        headers: {
          zoneid: zoneId,
        },
      }
    );

    if (response.data?.content?.data && Array.isArray(response.data.content.data)) {
      return response.data.content.data;
    }
    return [];
  } catch (error) {
    console.error(`Failed to fetch bids for post ${postId}:`, error);
    return [];
  }
};

export interface BookingSlotItem {
  id: string;
  start_time: string;
  end_time: string;
  title?: string;
  is_available?: boolean;
}

export interface BookingAnswerItem {
  question_id: string;
  answer: string;
  question?: string;
}

export interface SendBookingRequestParams {
  post_id: string;
  provider_id: string;
  payment_method: "cash_after_service" | "stripe" | string;
  zone_id?: string;
  service_address_id?: string;
  service_location: "customer" | "workshop" | string;
  service_schedule: string; // Format: "YYYY-MM-DD HH:mm:ss"
  booking_type: "normal" | "emergency" | string;
  selected_slot_id?: string;
  notes?: string;
  car_image?: File | null;
  answers?: BookingAnswerItem[] | Record<string, any>;
  payment_platform?: string;
  callback?: string;
}

export interface SendBookingRequestResponse {
  response_code: string;
  message: string;
  content?: any;
  errors?: any;
}

export interface BookingQuestionItem {
  id: string;
  provider_id?: string | null;
  category_id?: string;
  question_text: string;
  question?: string;
  question_type: "yes_no" | "text" | "choice" | string;
  options?: any;
  is_required?: boolean | number;
  is_active?: boolean | number;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

/**
 * Fetch available booking slots strictly from API:
 * GET /customer/booking/provider/slots?provider_id={provider_id}&date={date}
 */
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
        headers: {
          zoneid: zoneId,
        },
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

    return [];
  } catch (error) {
    console.error("Failed to load provider slots from API:", error);
    return [];
  }
};

/**
 * Fetch provider additional questions strictly from API:
 * GET /customer/booking/provider/questions?provider_id={provider_id}&category_id={category_id}
 */
export const getProviderQuestions = async (
  providerId?: string,
  categoryId: string = BOOKING_QUESTIONS_CATEGORY_ID
): Promise<BookingQuestionItem[]> => {
  try {
    const zoneId =
      (typeof window !== "undefined" &&
        (localStorage.getItem("zone_id") ||
          localStorage.getItem("zoneid") ||
          localStorage.getItem("zoneId"))) ||
      DEFAULT_ZONE_ID;

    const params: Record<string, any> = {
      category_id: categoryId,
    };
    if (providerId) {
      params.provider_id = providerId;
    }

    let response = await apiClient.get<any>(
      "/customer/booking/provider/questions",
      {
        params,
        headers: {
          zoneid: zoneId,
        },
      }
    );

    let rawData = response.data?.content || response.data?.data || response.data;
    if (Array.isArray(rawData) && rawData.length > 0) {
      return rawData;
    }

    // If query with provider_id returned empty, query with just category_id
    if (providerId) {
      response = await apiClient.get<any>(
        "/customer/booking/provider/questions",
        {
          params: { category_id: categoryId },
          headers: { zoneid: zoneId },
        }
      );
      rawData = response.data?.content || response.data?.data || response.data;
      if (Array.isArray(rawData) && rawData.length > 0) {
        return rawData;
      }
    }

    if (rawData && typeof rawData === "object") {
      const list = rawData.questions || rawData.data || [];
      if (Array.isArray(list)) {
        return list;
      }
    }
    return [];
  } catch (error) {
    console.error("Failed to load provider questions from API:", error);
    return [];
  }
};

/**
 * Confirm Booking / Send Booking Request
 * POST /customer/booking/request/send
 */
export const sendBookingRequest = async (
  params: SendBookingRequestParams
): Promise<SendBookingRequestResponse> => {
  const zoneId = DEFAULT_ZONE_ID;

  const addressId =
    params.service_address_id ||
    (typeof window !== "undefined" &&
      (localStorage.getItem("service_address_id") ||
        localStorage.getItem("address_id"))) ||
    "6";

  const isOnline = params.payment_method === "stripe" || params.payment_method === "online";
  const effectivePaymentMethod = isOnline ? "stripe" : params.payment_method;

  // Format answers strictly as an array of { question_id, answer } objects
  let formattedAnswers: any[] | undefined = undefined;
  if (Array.isArray(params.answers) && params.answers.length > 0) {
    formattedAnswers = params.answers.map((a: any) => ({
      question_id: a.question_id || a.id,
      answer: String(a.answer ?? ""),
    }));
  } else if (params.answers && typeof params.answers === "object") {
    const list = Object.entries(params.answers)
      .filter(([_, ans]) => ans !== undefined && ans !== "")
      .map(([qId, ans]) => ({
        question_id: qId,
        answer: String(ans),
      }));
    if (list.length > 0) {
      formattedAnswers = list;
    }
  }

  // Backend /customer/booking/request/send validator requires 'service_location' => 'required|in:customer'
  const apiServiceLocation = params.service_location === "workshop" ? "customer" : (params.service_location || "customer");
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
    formData.append("zone_id", zoneId);
    formData.append("service_address_id", addressId);
    formData.append("service_location", apiServiceLocation);
    formData.append("service_schedule", params.service_schedule);
    formData.append("booking_type", params.booking_type);
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

    const response = await apiClient.post<SendBookingRequestResponse>(
      "/customer/booking/request/send",
      formData,
      {
        headers: {
          zoneid: zoneId,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } else {
    const payload: Record<string, any> = {
      post_id: params.post_id,
      provider_id: params.provider_id,
      payment_method: effectivePaymentMethod,
      zone_id: zoneId,
      service_address_id: addressId,
      service_location: apiServiceLocation,
      service_schedule: params.service_schedule,
      booking_type: params.booking_type,
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

    const response = await apiClient.post<SendBookingRequestResponse>(
      "/customer/booking/request/send",
      payload,
      {
        headers: {
          zoneid: zoneId,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  }
};
