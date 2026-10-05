import axios from "axios";

export const getApiBaseUrl = (): string => {
  return (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/+$/, "");
};

export const getBackendRootUrl = (): string => {
  return getApiBaseUrl().replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "");
};

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
      return Promise.reject(
        new Error("NEXT_PUBLIC_API_URL is not configured. Set it in .env to your backend base URL.")
      );
    }
    config.baseURL = baseUrl;

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const zoneId =
        localStorage.getItem("zone_id") ||
        localStorage.getItem("zoneid") ||
        localStorage.getItem("zoneId") ||
        "a1614dbe-4732-11ee-9702-dee6e8d77be4";

      if (zoneId) {
        if (!config.headers.zoneid) config.headers.zoneid = zoneId;
        if (!config.headers.ZoneId) config.headers.ZoneId = zoneId;
        if (!config.headers["zone-id"]) config.headers["zone-id"] = zoneId;
      }

      const guestId =
        localStorage.getItem("guest_id") ||
        zoneId ||
        "550e8400-e29b-41d4-a716-446655440000";

      if (guestId) {
        if (!config.headers["guest-id"]) config.headers["guest-id"] = guestId;
        if (!config.headers.guest_id) config.headers.guest_id = guestId;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with automatic retry on 429 Too Many Requests
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Handle 429 Rate Limiting with automatic backoff retry
    if (error?.response?.status === 429 && config && !config._retry429) {
      config._retry429 = true;
      const retryAfterHeader = error.response.headers?.["retry-after"];
      const delayMs = retryAfterHeader ? Math.min(parseInt(retryAfterHeader, 10) * 1000, 3000) : 1500;

      console.warn(`[apiClient] Rate limited (429). Retrying request in ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return apiClient(config);
    }

    // Friendly message for 429 if retry also failed
    if (error?.response?.status === 429) {
      if (error.response.data && typeof error.response.data === "object") {
        error.response.data.message = error.response.data.message || "Too many requests sent. Please wait a few moments and try again.";
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;