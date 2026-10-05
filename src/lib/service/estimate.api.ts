import apiClient, { getBackendRootUrl } from "@/lib/http/apiClient";

export interface EstimateItem {
  id?: string;
  readable_id?: string | number;
  module_type?: string;
  provider_id?: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  service_id?: string;
  category_id?: string;
  sub_category_id?: string | null;
  zone_id?: string;
  car_id?: string | null;
  car_model?: string;
  car_registration_number?: string | null;
  damage_description?: string;
  service_schedule?: string;
  service_type?: string;
  price?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount?: number;
  notes?: string;
  status?: "pending" | "accepted" | "rejected" | "expired" | "paid" | string;
  booking_id?: string | null;
  link_token?: string;
  expired_at?: string;
  created_at?: string;
  updated_at?: string;
  deep_link_url?: string;
  web_url?: string;
  car_image_full_path?: string | null;
  car_images_full_path?: string[];
  category?: {
    id?: string;
    name?: string;
    description?: string;
    image_full_path?: string | null;
    is_quotation_based?: boolean;
  };
  provider?: {
    id?: string;
    company_name?: string;
    company_phone?: string;
    company_address?: string;
    company_email?: string;
    contact_person_name?: string;
    contact_person_phone?: string;
    contact_person_email?: string;
    logo_full_path?: string | null;
    avg_rating?: number;
    rating_count?: number;
  };
  // Fallbacks for generic quotation line items
  service_description?: string;
  estimate_number?: string;
  subtotal?: number;
  vat_amount?: number;
  grand_total?: number;
  total_cost?: number;
  payment_method?: string;
  line_items?: Array<{
    id?: string | number;
    description: string;
    quantity?: number;
    unit_price?: number;
    total_price: number;
  }>;
  car?: {
    make?: string;
    model?: string;
    year?: string | number;
    registration_number?: string;
    color?: string;
  };
  customer?: {
    id?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    email?: string;
  };
}

export function normalizeEstimateImageUrl(url?: string | null): string {
  if (!url) return "";
  const backendRoot = getBackendRootUrl();
  if (url.includes("storage/app/public/")) {
    const relativePath = url.split("storage/app/public/")[1];
    return `${backendRoot}/storage/app/public/${relativePath}`;
  }
  return url;
}

export interface EstimateListResponse {
  response_code?: string;
  message?: string;
  content?: EstimateItem[] | {
    data?: EstimateItem[];
    current_page?: number;
    last_page?: number;
    total?: number;
  };
  data?: EstimateItem[];
}

/**
 * Fetch list of estimates for the authenticated customer
 * GET /customer/estimate/list
 */
export async function getCustomerEstimates(limit = 50, offset = 1): Promise<EstimateItem[]> {
  try {
    const response = await apiClient.get<EstimateListResponse>("/customer/estimate/list", {
      params: { limit, offset, page: offset },
    });

    const body = response.data;
    if (Array.isArray(body?.content)) {
      return body.content;
    }
    if (body?.content && Array.isArray((body.content as any).data)) {
      return (body.content as any).data;
    }
    if (Array.isArray(body?.data)) {
      return body.data;
    }
    return [];
  } catch (err: any) {
    if (err?.response?.status === 404) {
      return [];
    }
    console.warn("[estimate.api] Failed to fetch customer estimates:", err?.message);
    throw err;
  }
}

/**
 * Fetch detailed estimate by link token or UUID/ID
 * GET /customer/estimate/{tokenOrId}
 */
export async function getEstimateDetails(tokenOrId: string): Promise<EstimateItem | null> {
  if (!tokenOrId) return null;
  const cleanToken = encodeURIComponent(tokenOrId.trim());

  try {
    const response = await apiClient.get<any>(`/customer/estimate/${cleanToken}`);
    const body = response.data;
    if (body?.content && typeof body.content === "object" && !Array.isArray(body.content)) {
      return body.content;
    }
    if (body?.data && typeof body.data === "object" && !Array.isArray(body.data)) {
      return body.data;
    }
    if (body && typeof body === "object" && !body.response_code) {
      return body;
    }
    return body?.content || body?.data || null;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      return null;
    }
    console.warn(`[estimate.api] Failed to fetch estimate details for ${tokenOrId}:`, err?.message);
    throw err;
  }
}

/**
 * Accept customer estimate
 * POST /customer/estimate/accept
 * Body: { link_token: string, payment_method: string }
 */
export async function acceptCustomerEstimate(
  linkToken: string,
  paymentMethod: string = "cash_after_service"
): Promise<{ success: boolean; message?: string; redirect_url?: string; data?: any }> {
  try {
    const response = await apiClient.post("/customer/estimate/accept", {
      link_token: linkToken,
      payment_method: paymentMethod,
    });

    const data = response.data;
    return {
      success: true,
      message: data?.message || "Estimate accepted successfully!",
      redirect_url: data?.content?.redirect_url || data?.redirect_url,
      data: data?.content || data?.data || data,
    };
  } catch (err: any) {
    console.error("[estimate.api] Accept estimate failed:", err?.response?.data || err?.message);
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.errors?.[0]?.message ||
      "Failed to accept estimate. Please try again.";
    throw new Error(msg);
  }
}
