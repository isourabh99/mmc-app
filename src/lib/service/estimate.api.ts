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
  const raw = tokenOrId.trim();
  const cleanToken = encodeURIComponent(raw);

  // 0. Instant Cache Check (sessionStorage)
  if (typeof window !== "undefined") {
    try {
      const selectedStr = sessionStorage.getItem("mmc_selected_estimate");
      if (selectedStr) {
        const item: EstimateItem = JSON.parse(selectedStr);
        const link = String(item.link_token || "").toLowerCase();
        const id = String(item.id || "").toLowerCase();
        const readId = String(item.readable_id || "").toLowerCase();
        const target = raw.toLowerCase();
        if (link === target || id === target || readId === target || target.includes(link) || link.includes(target)) {
          return item;
        }
      }

      const listStr = sessionStorage.getItem("mmc_customer_estimates");
      if (listStr) {
        const list: EstimateItem[] = JSON.parse(listStr);
        if (Array.isArray(list)) {
          const matched = list.find((item) => {
            const link = String(item.link_token || "").toLowerCase();
            const id = String(item.id || "").toLowerCase();
            const readId = String(item.readable_id || "").toLowerCase();
            const target = raw.toLowerCase();
            return link === target || id === target || readId === target || target.includes(link) || link.includes(target);
          });
          if (matched) return matched;
        }
      }
    } catch {}
  }

  // 1. Try direct estimate detail endpoint with a 5s timeout
  const probeEndpoints = [
    `/customer/estimate/${cleanToken}`,
    `/customer/estimate?token=${cleanToken}`,
    `/customer/estimate?link_token=${cleanToken}`,
    `/customer/estimate/details/${cleanToken}`,
    `/customer/estimate/details?token=${cleanToken}`,
    `/customer/estimate/details?link_token=${cleanToken}`,
    `/customer/estimate/show/${cleanToken}`,
    `/customer/estimate/view/${cleanToken}`,
    `/estimate/${cleanToken}`,
    `/estimate/details/${cleanToken}`,
  ];

  for (const url of probeEndpoints) {
    try {
      const response = await apiClient.get<any>(url, { timeout: 4000 });
      const body = response.data;
      const result =
        body?.content && typeof body.content === "object" && !Array.isArray(body.content)
          ? body.content
          : body?.data && typeof body.data === "object" && !Array.isArray(body.data)
          ? body.data
          : body && typeof body === "object" && !body.response_code
          ? body
          : body?.content || body?.data || null;

      if (result && (result.id || result.readable_id || result.link_token || result.service_description || result.price)) {
        return result;
      }
    } catch {
      // Continue to next probe
    }
  }

  // 2. Fallback: Search inside live customer's estimates list
  try {
    const list = await getCustomerEstimates(100, 1);
    const matched = list.find((item) => {
      const link = String(item.link_token || "").toLowerCase();
      const id = String(item.id || "").toLowerCase();
      const readId = String(item.readable_id || "").toLowerCase();
      const target = raw.toLowerCase();
      return link === target || id === target || readId === target || target.includes(link) || link.includes(target);
    });

    if (matched) {
      return matched;
    }
  } catch (err: any) {
    console.warn("[estimate.api] List search fallback failed:", err?.message);
  }

  return null;
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
