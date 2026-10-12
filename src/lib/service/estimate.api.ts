import apiClient, { getApiBaseUrl, getBackendRootUrl } from "@/lib/http/apiClient";

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
    console.warn("[estimate.api] Failed to fetch customer estimates:", err?.message);
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("mmc_customer_estimates");
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return [];
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

  // 1. Try direct estimate detail endpoints in parallel
  const probeEndpoints = [
    `/customer/estimate/${cleanToken}`,
    `/customer/estimate?token=${cleanToken}`,
    `/customer/estimate?link_token=${cleanToken}`,
    `/customer/estimate/details/${cleanToken}`,
    `/customer/estimate/details?token=${cleanToken}`,
    `/customer/estimate/details?link_token=${cleanToken}`,
    `/customer/estimate/show/${cleanToken}`,
    `/customer/estimate/view/${cleanToken}`,
    `/customer/estimate/link/${cleanToken}`,
    `/customer/estimate/link?token=${cleanToken}`,
    `/customer/estimate/link?link_token=${cleanToken}`,
    `/customer/estimate/token/${cleanToken}`,
    `/customer/estimate/public/${cleanToken}`,
    `/customer/estimate/public?token=${cleanToken}`,
    `/customer/estimate/public?link_token=${cleanToken}`,
    `/estimate/${cleanToken}`,
    `/estimate/details/${cleanToken}`,
    `/estimate/view/${cleanToken}`,
    `/estimate/token/${cleanToken}`,
    `/estimate/show/${cleanToken}`,
    `/estimate/public/${cleanToken}`,
  ];

  // Try fetching in parallel for instant response
  const probePromises = probeEndpoints.map(async (url) => {
    try {
      const response = await apiClient.get<any>(url, { timeout: 6000 });
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
      return null;
    } catch {
      return null;
    }
  });

  const results = await Promise.all(probePromises);
  const found = results.find((r) => r !== null);
  if (found) {
    return found;
  }

  // 2. Fallback: Search inside live customer's estimates list if user is logged in
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
 * Body: { link_token: string, payment_method: string, is_partial: number, callback?: string }
 */
export async function acceptCustomerEstimate(
  estimateOrToken: string | EstimateItem,
  paymentMethod: string = "stripe",
  isPartial: number = 1
): Promise<{ success: boolean; message?: string; redirect_url?: string; data?: any }> {
  const isPartialNum = isPartial ? 1 : 0;
  const callbackUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/booking-success`
      : `${getBackendRootUrl()}/booking-success`;

  const tokenCandidates: string[] = [];
  if (typeof estimateOrToken === "object" && estimateOrToken !== null) {
    if (estimateOrToken.readable_id) {
      tokenCandidates.push(`EST-${estimateOrToken.readable_id}`);
      tokenCandidates.push(String(estimateOrToken.readable_id));
    }
    if (estimateOrToken.link_token) {
      tokenCandidates.push(String(estimateOrToken.link_token).trim());
    }
    if (estimateOrToken.id) {
      tokenCandidates.push(String(estimateOrToken.id).trim());
    }
  } else if (typeof estimateOrToken === "string") {
    const clean = estimateOrToken.trim();
    if (clean) {
      if (/^\d+$/.test(clean)) {
        tokenCandidates.push(`EST-${clean}`);
        tokenCandidates.push(clean);
      } else if (clean.startsWith("EST-")) {
        tokenCandidates.push(clean);
        tokenCandidates.push(clean.replace(/^EST-/, ""));
      } else {
        tokenCandidates.push(clean);
        tokenCandidates.push(`EST-${clean}`);
      }
    }
  }

  const uniqueTokens = Array.from(new Set(tokenCandidates)).filter(Boolean);

  // Candidate payment methods to try if backend rejects specific string
  const methodCandidates =
    paymentMethod === "cash_after_service"
      ? ["cash_after_service", "cash_on_delivery", "offline"]
      : [paymentMethod, "stripe", "digital_payment", "online", "card"];

  const uniqueMethods = Array.from(new Set(methodCandidates));

  let lastError: any = null;

  for (const t of uniqueTokens) {
    for (const method of uniqueMethods) {
      try {
        const payload: Record<string, any> = {
          link_token: t,
          payment_method: method,
          is_partial: isPartialNum,
          callback: callbackUrl,
        };

        const response = await apiClient.post("/customer/estimate/accept", payload);
        const data = response.data;

        const redirectUrl =
          data?.content?.redirect_url ||
          data?.content?.url ||
          data?.content?.payment_url ||
          data?.content?.redirect_link ||
          data?.redirect_url ||
          data?.url ||
          (data?.content?.payment_id || data?.content?.id || data?.content?.booking_id
            ? `${getBackendRootUrl()}/payment/stripe/pay?payment_id=${encodeURIComponent(
                String(data?.content?.payment_id || data?.content?.id || data?.content?.booking_id)
              )}&is_partial=${isPartialNum}&callback=${encodeURIComponent(callbackUrl)}`
            : undefined);

        return {
          success: true,
          message: data?.message || "Estimate accepted successfully!",
          redirect_url: redirectUrl,
          data: data?.content || data?.data || data,
        };
      } catch (err: any) {
        lastError = err;
        const errErrors = err?.response?.data?.errors;
        const isPaymentMethodError =
          Array.isArray(errErrors) &&
          errErrors.some(
            (e: any) =>
              e.error_code === "payment_method" ||
              String(e.message || "").toLowerCase().includes("payment method")
          );

        // If error is specifically about payment_method, continue to next method candidate
        if (isPaymentMethodError) {
          continue;
        }
        // If error is quotation not found or something else, try next token candidate
        break;
      }
    }
  }

  console.error("[estimate.api] Accept estimate failed:", lastError?.response?.data || lastError?.message);
  const msg =
    lastError?.response?.data?.message ||
    lastError?.response?.data?.errors?.[0]?.message ||
    "Failed to accept estimate. Please check the estimate details and try again.";
  throw new Error(msg);
}
