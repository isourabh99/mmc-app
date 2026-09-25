import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
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

export default apiClient;