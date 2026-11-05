import apiClient, { getApiBaseUrl } from "@/lib/http/apiClient";
import axios from "axios";

export interface ZoneConfigResponse {
  response_code: string;
  message: string;
  content?: {
    zone?: {
      id: string;
      name?: string;
      is_active?: number;
      coordinates?: any;
    };
    zone_id?: string;
    available_services_count?: number;
  };
}

export const DEFAULT_FALLBACK_ZONE_ID = "a1614dbe-4732-11ee-9702-dee6e8d77be4";

/**
 * Fetch zone ID dynamically from the live backend API using coordinates.
 * GET https://mmcclub.co.uk/backend/api/v1/customer/config/get-zone-id?lat={lat}&lng={lng}
 */
export async function fetchZoneIdFromCoordinates(
  lat: number | string = 51.5074,
  lng: number | string = -0.1278
): Promise<string> {
  const numericLat = Number(lat) || 51.5074;
  const numericLng = Number(lng) || -0.1278;

  try {
    let zoneId = "";
    let zoneName = "";

    try {
      const res = await apiClient.get<ZoneConfigResponse>(
        `/customer/config/get-zone-id?lat=${numericLat}&lng=${numericLng}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );
      zoneId =
        res.data?.content?.zone?.id ||
        res.data?.content?.zone_id ||
        (res.data as any)?.zone?.id ||
        "";
      zoneName = res.data?.content?.zone?.name || "";
    } catch (clientErr) {
      // Direct axios fallback to live domain if apiClient encountered an interceptor issue
      const baseUrl = getApiBaseUrl() || "https://mmcclub.co.uk/backend/api/v1";
      const liveRes = await axios.get<ZoneConfigResponse>(
        `${baseUrl}/customer/config/get-zone-id?lat=${numericLat}&lng=${numericLng}`,
        {
          headers: {
            Accept: "application/json",
          },
          timeout: 10000,
        }
      );
      zoneId =
        liveRes.data?.content?.zone?.id ||
        liveRes.data?.content?.zone_id ||
        (liveRes.data as any)?.zone?.id ||
        "";
      zoneName = liveRes.data?.content?.zone?.name || "";
    }

    if (zoneId && zoneId.trim().length > 0) {
      if (typeof window !== "undefined") {
        localStorage.setItem("zone_id", zoneId);
        localStorage.setItem("zoneid", zoneId);
        localStorage.setItem("zoneId", zoneId);
        if (zoneName) {
          localStorage.setItem("zone_name", zoneName);
        }
        localStorage.setItem("zone_last_fetched", String(Date.now()));
      }
      return zoneId;
    }
  } catch (error) {
    console.warn("[Zone Service] Failed to fetch zone id from backend API:", error);
  }

  // Fallback to cached value in localStorage
  if (typeof window !== "undefined") {
    const cached =
      localStorage.getItem("zone_id") ||
      localStorage.getItem("zoneid") ||
      localStorage.getItem("zoneId");
    if (
      cached &&
      cached !== "undefined" &&
      cached !== "null" &&
      cached.trim().length > 0
    ) {
      return cached;
    }
  }

  return DEFAULT_FALLBACK_ZONE_ID;
}

// Backwards-compatible alias
export const getZoneIdFromCoordinates = fetchZoneIdFromCoordinates;

/**
 * Get active zone ID asynchronously.
 * If not yet cached or if cache is older than 2 hours, triggers dynamic API fetch.
 */
export async function getActiveZoneId(): Promise<string> {
  if (typeof window !== "undefined") {
    const cached =
      localStorage.getItem("zone_id") ||
      localStorage.getItem("zoneid") ||
      localStorage.getItem("zoneId");

    const lastFetched = Number(localStorage.getItem("zone_last_fetched") || 0);
    const isStale = Date.now() - lastFetched > 1000 * 60 * 60 * 2; // 2 hours

    if (
      cached &&
      cached !== "undefined" &&
      cached !== "null" &&
      cached.trim().length > 0 &&
      !isStale
    ) {
      return cached;
    }

    const lat = localStorage.getItem("user_lat") || "51.5074";
    const lng =
      localStorage.getItem("user_lon") ||
      localStorage.getItem("user_lng") ||
      "-0.1278";

    return fetchZoneIdFromCoordinates(lat, lng);
  }

  return DEFAULT_FALLBACK_ZONE_ID;
}

/**
 * Synchronous helper to get current zone ID for headers and requests.
 * Reads directly from localStorage; if empty, kicks off dynamic fetch in the background.
 */
export function getStoredZoneId(fallback: string = DEFAULT_FALLBACK_ZONE_ID): string {
  if (typeof window !== "undefined") {
    const stored =
      localStorage.getItem("zone_id") ||
      localStorage.getItem("zoneid") ||
      localStorage.getItem("zoneId");

    if (
      stored &&
      stored !== "undefined" &&
      stored !== "null" &&
      stored.trim().length > 0
    ) {
      return stored;
    }

    // Trigger dynamic fetch in background so subsequent calls will have the updated zone
    const lat = localStorage.getItem("user_lat") || "51.5074";
    const lng =
      localStorage.getItem("user_lon") ||
      localStorage.getItem("user_lng") ||
      "-0.1278";
    fetchZoneIdFromCoordinates(lat, lng).catch(() => {});
  }

  return fallback;
}
