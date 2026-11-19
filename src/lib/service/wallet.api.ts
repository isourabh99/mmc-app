import apiClient, { getBackendRootUrl } from "@/lib/http/apiClient";

export interface CustomerConfigContent {
  wallet_status?: number;
  add_to_fund_wallet?: number;
  loyalty_point_status?: number;
  loyalty_point_exchange_rate?: number;
  min_loyalty_point_to_transfer?: number;
  loyalty_point_value_per_currency_unit?: number;
  currency_symbol?: string;
  currency_code?: string;
  currency_symbol_position?: string;
  payment_gateways?: any[];
  [key: string]: any;
}

export interface CustomerWalletInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  wallet_balance: number;
  loyalty_point: number;
  ref_code?: string;
  profile_image_full_path?: string | null;
  [key: string]: any;
}

export interface WalletTransactionItem {
  id: string;
  ref_trx_id: string | null;
  booking_id: string | null;
  car_booking_id?: string | null;
  trx_type:
    | "wallet_payment"
    | "loyalty_point_earning"
    | "add_fund"
    | "add_fund_bonus"
    | "booking_refund"
    | "referral_earning"
    | "fund_by_admin"
    | string;
  debit: number;
  credit: number;
  balance: number;
  from_user_id?: string;
  to_user_id?: string;
  created_at: string;
  updated_at?: string;
  from_user_account?: string | null;
  to_user_account?: string | null;
  reference_note?: string | null;
  booking?: {
    id: string;
    readable_id?: number | string;
    booking_status?: string;
    total_booking_amount?: number;
    payment_method?: string;
    service_schedule?: string;
    [key: string]: any;
  } | null;
  from_user?: any;
  to_user?: any;
  [key: string]: any;
}

export interface LoyaltyPointTransactionItem {
  id: string;
  user_id?: string;
  transaction_id?: string | null;
  ref_trx_id?: string | null;
  point?: number | string;
  points?: number | string;
  balance: number | string;
  debit?: number | string;
  credit?: number | string;
  transaction_type?: string;
  point_type?: string;
  trx_type?: string;
  reference?: string | null;
  reference_note?: string | null;
  created_at: string;
  [key: string]: any;
}

export interface BonusItem {
  id: string;
  bonus_title: string;
  short_description?: string;
  bonus_type: string;
  bonus_amount: number;
  min_add_money_amount: number;
  max_bonus_amount?: number;
  start_date?: string;
  end_date?: string;
  is_active?: number;
  [key: string]: any;
}

/**
 * 1. GET /customer/config
 * Retrieves overall wallet and loyalty point configuration status
 */
export async function getCustomerConfig(): Promise<CustomerConfigContent | null> {
  try {
    const res = await apiClient.get("/customer/config");
    return res.data?.content || res.data?.data || res.data;
  } catch (err: any) {
    console.warn("[wallet.api] Failed to fetch customer config:", err?.message || err);
    return null;
  }
}

/**
 * 2. GET /customer/info
 * Retrieves current customer info with real-time wallet_balance & loyalty_point
 */
export async function getCustomerWalletInfo(): Promise<CustomerWalletInfo | null> {
  try {
    const res = await apiClient.get("/customer/info");
    const data = res.data?.content || res.data?.data || res.data;
    if (data && typeof window !== "undefined") {
      try {
        localStorage.setItem("user", JSON.stringify(data));
      } catch {}
    }
    return data;
  } catch (err: any) {
    console.warn("[wallet.api] Failed to fetch customer wallet info:", err?.message || err);
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("user");
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return null;
  }
}

/**
 * 3. GET /customer/wallet-transaction?limit=10&offset=1&type=...
 * Retrieves wallet transactions with optional filter
 * Types:
 * - "wallet_payment" (Paid for Bookings)
 * - "loyalty_point_earning" (Loyalty Points Converted to Wallet)
 * - "add_fund" (Recharge / Top Up)
 * - "add_fund_bonus" (Bonus on Top Up)
 */
export async function getWalletTransactions(params: {
  limit?: number;
  offset?: number;
  type?: string;
}): Promise<{
  wallet_balance: number;
  transactions: WalletTransactionItem[];
  total: number;
  raw?: any;
}> {
  const { limit = 15, offset = 1, type = "" } = params;
  try {
    const queryParams: any = { limit, offset };
    if (type && type.trim() !== "" && type !== "all") {
      queryParams.type = type.trim();
    }

    const res = await apiClient.get("/customer/wallet-transaction", {
      params: queryParams,
    });

    const content = res.data?.content || res.data?.data || {};
    const txObj = content.transactions || content;
    const list = Array.isArray(txObj.data)
      ? txObj.data
      : Array.isArray(txObj)
      ? txObj
      : [];

    return {
      wallet_balance: Number(content.wallet_balance || 0),
      transactions: list,
      total: Number(txObj.total || list.length),
      raw: res.data,
    };
  } catch (err: any) {
    console.warn("[wallet.api] Failed to fetch wallet transactions:", err?.message || err);
    return {
      wallet_balance: 0,
      transactions: [],
      total: 0,
    };
  }
}

/**
 * 4. GET /customer/loyalty-point-transaction?limit=10&offset=1
 * Retrieves loyalty point transaction history & exchange values
 */
export async function getLoyaltyPointTransactions(params: {
  limit?: number;
  offset?: number;
}): Promise<{
  loyalty_point: number;
  loyalty_point_value_per_currency_unit: number;
  min_loyalty_point_to_transfer: number;
  transactions: LoyaltyPointTransactionItem[];
  total: number;
  raw?: any;
}> {
  const { limit = 15, offset = 1 } = params;
  try {
    const res = await apiClient.get("/customer/loyalty-point-transaction", {
      params: { limit, offset },
    });

    const content = res.data?.content || res.data?.data || {};
    const txObj = content.transactions || content;
    const list = Array.isArray(txObj.data)
      ? txObj.data
      : Array.isArray(txObj)
      ? txObj
      : [];

    return {
      loyalty_point: Number(content.loyalty_point || 0),
      loyalty_point_value_per_currency_unit: Number(
        content.loyalty_point_value_per_currency_unit || 0
      ),
      min_loyalty_point_to_transfer: Number(
        content.min_loyalty_point_to_transfer || 0
      ),
      transactions: list,
      total: Number(txObj.total || list.length),
      raw: res.data,
    };
  } catch (err: any) {
    console.warn("[wallet.api] Failed to fetch loyalty point transactions:", err?.message || err);
    return {
      loyalty_point: 0,
      loyalty_point_value_per_currency_unit: 0,
      min_loyalty_point_to_transfer: 0,
      transactions: [],
      total: 0,
    };
  }
}

/**
 * 5. POST /customer/loyalty-point/wallet-transfer
 * Body: { "point": 50 }
 * Converts loyalty points into customer wallet balance
 */
export async function transferLoyaltyPointsToWallet(points: number): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  try {
    const res = await apiClient.post("/customer/loyalty-point/wallet-transfer", {
      point: points,
    });
    return {
      success: true,
      message: res.data?.message || "Loyalty points transferred to wallet successfully!",
      data: res.data?.content || res.data?.data || res.data,
    };
  } catch (err: any) {
    const errMsg =
      err?.response?.data?.message ||
      err?.response?.data?.errors?.[0]?.message ||
      err?.message ||
      "Failed to transfer loyalty points to wallet.";
    return {
      success: false,
      message: errMsg,
    };
  }
}

/**
 * 6. GET /customer/bonus-list?limit=10&offset=1
 * Retrieves current active add-fund bonus offers
 */
export async function getAddFundBonusList(params: {
  limit?: number;
  offset?: number;
} = {}): Promise<BonusItem[]> {
  const { limit = 10, offset = 1 } = params;
  try {
    const res = await apiClient.get("/customer/bonus-list", {
      params: { limit, offset },
    });
    const content = res.data?.content || res.data?.data || {};
    const list = Array.isArray(content.data)
      ? content.data
      : Array.isArray(content)
      ? content
      : [];
    return list;
  } catch (err: any) {
    console.warn("[wallet.api] Failed to fetch bonus list:", err?.message || err);
    return [];
  }
}

/**
 * 7. Constructs Add Fund Payment Gateway URL (Stripe on Web Platform)
 * e.g. https://mmcclub.co.uk/backend/payment?access_token=...&amount=500&is_add_fund=1&payment_method=stripe&payment_platform=web&callback=...
 */
export function buildAddFundPaymentUrl(
  amount: number,
  customerId?: string,
  customCallback?: string
): string {
  const root = getBackendRootUrl();

  // Retrieve Customer UUID
  let targetId = customerId || "";
  if (!targetId && typeof window !== "undefined") {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const u = JSON.parse(storedUser);
        targetId = u.id || u.user_id || u.customer_id || "";
      }
    } catch {}
  }

  if (!targetId && typeof window !== "undefined") {
    try {
      const token = localStorage.getItem("token") || "";
      if (token && token.includes(".")) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        targetId = payload.sub || "";
      }
    } catch {}
  }

  // Base64 encode customer id as required by backend payment gateway
  let encodedAccessToken = "";
  if (targetId) {
    encodedAccessToken =
      typeof window !== "undefined"
        ? btoa(targetId)
        : Buffer.from(targetId).toString("base64");
  }

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://mmcclub.co.uk";
  const callback =
    customCallback ||
    `${origin}/account?tab=wallet&status=success&amount=${amount}`;

  return `${root}/payment?access_token=${encodeURIComponent(
    encodedAccessToken
  )}&amount=${amount}&is_add_fund=1&payment_method=stripe&payment_platform=web&callback=${encodeURIComponent(
    callback
  )}`;
}
