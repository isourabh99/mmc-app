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
    let servicesCount = 0;

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
      servicesCount = res.data?.content?.available_services_count ?? 1;
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
      servicesCount = liveRes.data?.content?.available_services_count ?? 1;
    }

    // If the detected zone has 0 available services (e.g. indore Zone), fallback to universal zone with all 114 services
    if (servicesCount === 0 || !zoneId) {
      zoneId = DEFAULT_FALLBACK_ZONE_ID;
    }

    if (zoneId && zoneId.trim().length > 0) {
      if (typeof window !== "undefined") {
        localStorage.setItem("zone_id", zoneId);
        localStorage.removeItem("zoneid");
        localStorage.removeItem("zoneId");
        localStorage.removeItem("zone-id");
      }
      return zoneId;
    }
  } catch (error) {
    console.warn("[Zone Service] Failed to fetch zone id from backend API:", error);
  }

  // Fallback to cached value in localStorage
  if (typeof window !== "undefined") {
    localStorage.removeItem("zoneid");
    localStorage.removeItem("zoneId");
    localStorage.removeItem("zone-id");

    const cached = localStorage.getItem("zone_id");
    if (
      cached &&
      cached !== "undefined" &&
      cached !== "null" &&
      cached.trim().length > 0 &&
      cached !== "c5b64f38-90ac-49f3-858c-d8dae5c0a53f" // c5b64f38 has 0 services in Demandium
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
 */
export async function getActiveZoneId(): Promise<string> {
  if (typeof window !== "undefined") {
    localStorage.removeItem("zoneid");
    localStorage.removeItem("zoneId");
    localStorage.removeItem("zone-id");

    const cached = localStorage.getItem("zone_id");
    if (
      cached &&
      cached !== "undefined" &&
      cached !== "null" &&
      cached.trim().length > 0 &&
      cached !== "c5b64f38-90ac-49f3-858c-d8dae5c0a53f" // c5b64f38 has 0 services in Demandium
    ) {
      return cached;
    }

    return DEFAULT_FALLBACK_ZONE_ID;
  }

  return DEFAULT_FALLBACK_ZONE_ID;
}

/**
 * Synchronous helper to get current zone ID for headers and requests.
 * Reads directly from localStorage.
 */
export function getStoredZoneId(fallback: string = DEFAULT_FALLBACK_ZONE_ID): string {
  if (typeof window !== "undefined") {
    localStorage.removeItem("zoneid");
    localStorage.removeItem("zoneId");
    localStorage.removeItem("zone-id");

    const stored = localStorage.getItem("zone_id");
    if (
      stored &&
      stored !== "undefined" &&
      stored !== "null" &&
      stored.trim().length > 0 &&
      stored !== "c5b64f38-90ac-49f3-858c-d8dae5c0a53f" // c5b64f38 has 0 services in Demandium
    ) {
      return stored;
    }
  }

  return fallback;
}
