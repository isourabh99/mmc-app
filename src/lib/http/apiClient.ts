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
      const skipAuth =
        (config.headers as any)?.skipAuth ||
        (config.headers as any)?.noAuth ||
        (config as any)?.skipAuth;

      if (skipAuth) {
        if (config.headers?.delete) {
          config.headers.delete("Authorization");
          config.headers.delete("authorization");
          config.headers.delete("skipAuth");
          config.headers.delete("noAuth");
        } else {
          delete (config.headers as any).Authorization;
          delete (config.headers as any).authorization;
          delete (config.headers as any).skipAuth;
          delete (config.headers as any).noAuth;
        }
      } else {
        if (token && !(config.headers as any)?.Authorization) {
          if (config.headers?.set) {
            config.headers.set("Authorization", `Bearer ${token}`);
          } else {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      }

      // Clean up duplicate legacy keys from localStorage
      if (localStorage.getItem("zoneid")) localStorage.removeItem("zoneid");
      if (localStorage.getItem("zoneId")) localStorage.removeItem("zoneId");
      if (localStorage.getItem("zone-id")) localStorage.removeItem("zone-id");

      let storedZone = localStorage.getItem("zone_id");

      if (
        !storedZone ||
        storedZone === "undefined" ||
        storedZone === "null" ||
        storedZone === "[object Object]" ||
        storedZone === "a1614dbe-4732-11ee-9702-dee6e8d77be4" ||
        storedZone.trim().length === 0
      ) {
        storedZone = "c5b64f38-90ac-49f3-858c-d8dae5c0a53f";
        localStorage.setItem("zone_id", storedZone);
      }

      const hasZoneHeader =
        (config.headers?.get &&
          (config.headers.get("zoneid") ||
            config.headers.get("zoneId") ||
            config.headers.get("zone-id"))) ||
        config.headers.zoneid ||
        config.headers.ZoneId ||
        config.headers["zone-id"];

      if (!hasZoneHeader) {
        if (config.headers?.set) {
          config.headers.set("zone-id", storedZone);
          config.headers.set("zoneid", storedZone);
        } else {
          config.headers["zone-id"] = storedZone;
          config.headers.zoneid = storedZone;
        }
      }

      const guestId =
        localStorage.getItem("guest_id") ||
        storedZone ||
        "550e8400-e29b-41d4-a716-446655440000";

      if (!token && guestId) {
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

    // Handle 429 Rate Limiting with automatic backoff retry (up to 3 attempts)
    if (error?.response?.status === 429 && config) {
      config._retry429Count = (config._retry429Count || 0) + 1;
      if (config._retry429Count <= 3) {
        const retryAfterHeader = error.response.headers?.["retry-after"];
        const delayMs = retryAfterHeader
          ? Math.min(parseInt(retryAfterHeader, 10) * 1000, 3000)
          : config._retry429Count * 1200;

        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return apiClient(config);
      }
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