import apiClient from "@/lib/http/apiClient";

export interface CustomerAddressPayload {
  lat: string | number;
  lon: string | number;
  address: string;
  city?: string;
  street?: string;
  zip_code?: string;
  country?: string;
  address_type?: string;
  contact_person_name?: string;
  contact_person_number?: string;
  address_label?: string;
  house?: string;
  floor?: string;
  is_guest?: boolean;
}

export interface SelectedLocationData {
  formattedAddress: string;
  address: string;
  street: string;
  house: string;
  floor: string;
  city: string;
  postcode: string;
  country: string;
  lat: string;
  lon: string;
  contact_person_name: string;
  contact_person_number: string;
  address_label: string;
  service_address_json: string;
  address_id: string;
}

/**
 * Extract clean UK postcode or generic postal code from text
 */
export function extractPostcode(text: string): string {
  if (!text) return "";
  const ukMatch = text.match(/[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}/i);
  if (ukMatch) return ukMatch[0].toUpperCase();

  const digitMatch = text.match(/\b\d{5,6}\b/);
  if (digitMatch) return digitMatch[0];

  return "";
}

/**
 * Format service_address into the EXACT JSON string Demandium expects:
 * "{\"lat\":\"51.5074\",\"lon\":\"-0.1278\",\"address\":\"221B Baker Street\",\"city\":\"London\",\"street\":\"Baker St\",\"zip_code\":\"\",\"country\":\"United Kingdom\",\"contact_person_name\":\"John Doe\",\"contact_person_number\":\"+447123456789\",\"address_label\":\"Home\"}"
 */
export function formatServiceAddressJson(data: Partial<CustomerAddressPayload>): string {
  const cleanPostcode = (data.zip_code && data.zip_code.trim()) || extractPostcode(data.address || "");
  const houseVal =
    data.house !== undefined && data.house !== null && String(data.house).trim()
      ? String(data.house).trim()
      : (typeof window !== "undefined" ? localStorage.getItem("user_house") || localStorage.getItem("house") : null) || "";
  const floorVal =
    data.floor !== undefined && data.floor !== null && String(data.floor).trim()
      ? String(data.floor).trim()
      : (typeof window !== "undefined" ? localStorage.getItem("user_floor") || localStorage.getItem("floor") : null) || "";
  const streetVal =
    data.street !== undefined && data.street !== null && String(data.street).trim()
      ? String(data.street).trim()
      : (typeof window !== "undefined" ? localStorage.getItem("user_street") || localStorage.getItem("street") : null) ||
      (data.address && !data.address.startsWith("{") ? data.address.split(",")[0].trim() : "");

  const rawAddr = (data.address || "").trim();
  let fullAddress = rawAddr;
  const parts: string[] = [];
  if (houseVal && !rawAddr.toLowerCase().includes(houseVal.toLowerCase())) {
    parts.push(houseVal);
  }
  if (floorVal && !rawAddr.toLowerCase().includes(floorVal.toLowerCase())) {
    const floorStr = floorVal.toLowerCase().includes("floor") ? floorVal : `Floor ${floorVal}`;
    parts.push(floorStr);
  }
  if (streetVal && !rawAddr.toLowerCase().includes(streetVal.toLowerCase())) {
    parts.push(streetVal);
  }
  if (parts.length > 0) {
    fullAddress = `${parts.join(", ")}, ${rawAddr}`;
  }

  const payload: Record<string, string> = {
    lat: String(data.lat || "51.5074"),
    lon: String(data.lon || "-0.1278"),
    address: fullAddress,
    city: (data.city || (typeof window !== "undefined" ? localStorage.getItem("user_city") : null) || "").trim(),
    street: streetVal,
    zip_code: cleanPostcode,
    country: (data.country || "").trim(),
    contact_person_name: (data.contact_person_name || (typeof window !== "undefined" ? localStorage.getItem("user_name") : null) || "Customer").trim(),
    contact_person_number: (data.contact_person_number || (typeof window !== "undefined" ? localStorage.getItem("user_phone") : null) || "").trim(),
    address_label: (data.address_label || "Home").trim(),
    house: houseVal,
    floor: floorVal,
  };

  return JSON.stringify(payload);
}

/**
 * Helper to ensure any address string passed to backend is converted to the required JSON format if not already JSON
 */
export function ensureServiceAddressJson(
  rawAddress?: string,
  extraParams?: Partial<CustomerAddressPayload>
): string {
  const fallbackHouse =
    (extraParams?.house && String(extraParams.house).trim()) ||
    (typeof window !== "undefined" ? localStorage.getItem("user_house") || localStorage.getItem("house") : null) ||
    "";
  const fallbackFloor =
    (extraParams?.floor && String(extraParams.floor).trim()) ||
    (typeof window !== "undefined" ? localStorage.getItem("user_floor") || localStorage.getItem("floor") : null) ||
    "";
  const fallbackStreet =
    (extraParams?.street && String(extraParams.street).trim()) ||
    (typeof window !== "undefined" ? localStorage.getItem("user_street") || localStorage.getItem("street") : null) ||
    "";

  // 1. If rawAddress itself is already valid JSON string containing coordinates
  if (rawAddress && typeof rawAddress === "string" && rawAddress.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(rawAddress);
      if (parsed.lat && parsed.lon) {
        if (fallbackHouse && (!parsed.house || !String(parsed.house).trim())) {
          parsed.house = fallbackHouse;
        }
        if (fallbackFloor && (!parsed.floor || !String(parsed.floor).trim())) {
          parsed.floor = fallbackFloor;
        }
        if (fallbackStreet && (!parsed.street || !String(parsed.street).trim())) {
          parsed.street = fallbackStreet;
        }
        const parts: string[] = [];
        if (parsed.house && parsed.address && !parsed.address.toLowerCase().includes(String(parsed.house).toLowerCase())) {
          parts.push(String(parsed.house));
        }
        if (parsed.floor && parsed.address && !parsed.address.toLowerCase().includes(String(parsed.floor).toLowerCase())) {
          const floorStr = String(parsed.floor).toLowerCase().includes("floor") ? String(parsed.floor) : `Floor ${parsed.floor}`;
          parts.push(floorStr);
        }
        if (parsed.street && parsed.address && !parsed.address.toLowerCase().includes(String(parsed.street).toLowerCase())) {
          parts.push(String(parsed.street));
        }
        if (parts.length > 0) {
          parsed.address = `${parts.join(", ")}, ${parsed.address}`;
        }
        return JSON.stringify(parsed);
      }
    } catch { }
  }

  // 2. If stored in localStorage, retrieve saved JSON
  if (typeof window !== "undefined") {
    const storedJson =
      localStorage.getItem("service_address_json") ||
      localStorage.getItem("customer_service_address") ||
      localStorage.getItem("service_address");
    if (storedJson && typeof storedJson === "string" && storedJson.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(storedJson);
        if (parsed.lat && parsed.lon) {
          if (!parsed.house || !String(parsed.house).trim()) {
            parsed.house = fallbackHouse;
          }
          if (!parsed.floor || !String(parsed.floor).trim()) {
            parsed.floor = fallbackFloor;
          }
          if (!parsed.street || !String(parsed.street).trim()) {
            parsed.street = fallbackStreet;
          }
          const parts: string[] = [];
          if (parsed.house && parsed.address && !parsed.address.toLowerCase().includes(String(parsed.house).toLowerCase())) {
            parts.push(String(parsed.house));
          }
          if (parsed.floor && parsed.address && !parsed.address.toLowerCase().includes(String(parsed.floor).toLowerCase())) {
            const floorStr = String(parsed.floor).toLowerCase().includes("floor") ? String(parsed.floor) : `Floor ${parsed.floor}`;
            parts.push(floorStr);
          }
          if (parsed.street && parsed.address && !parsed.address.toLowerCase().includes(String(parsed.street).toLowerCase())) {
            parts.push(String(parsed.street));
          }
          if (parts.length > 0) {
            parsed.address = `${parts.join(", ")}, ${parsed.address}`;
          }
          if (!rawAddress || rawAddress === parsed.address || rawAddress.includes(parsed.street || "")) {
            return JSON.stringify(parsed);
          }
        }
      } catch { }
    }
  }

  // 3. Otherwise construct and format JSON
  return formatServiceAddressJson({
    address: rawAddress || extraParams?.address || (typeof window !== "undefined" ? localStorage.getItem("user_address") : null) || "",
    lat: extraParams?.lat || (typeof window !== "undefined" ? localStorage.getItem("user_lat") : null) || "51.5074",
    lon: extraParams?.lon || (typeof window !== "undefined" ? localStorage.getItem("user_lon") : null) || "-0.1278",
    city: extraParams?.city || (typeof window !== "undefined" ? localStorage.getItem("user_city") : null) || "",
    street: extraParams?.street || fallbackStreet,
    zip_code: extraParams?.zip_code || (typeof window !== "undefined" ? localStorage.getItem("user_postcode") || localStorage.getItem("postcode") : null) || extractPostcode(rawAddress || ""),
    country: extraParams?.country || "",
    contact_person_name: extraParams?.contact_person_name || (typeof window !== "undefined" ? localStorage.getItem("user_name") : null) || "Customer",
    contact_person_number: extraParams?.contact_person_number || (typeof window !== "undefined" ? localStorage.getItem("user_phone") : null) || "",
    address_label: extraParams?.address_label || "Home",
    house: fallbackHouse,
    floor: fallbackFloor,
  });
}

/**
 * Save Customer Address to backend
 * POST /customer/address
 */
export async function saveCustomerAddressToBackend(
  data: CustomerAddressPayload
): Promise<{ success: boolean; address_id: string; message: string; raw?: any }> {
  try {
    const houseVal =
      data.house !== undefined && data.house !== null && String(data.house).trim()
        ? String(data.house).trim()
        : (typeof window !== "undefined" ? localStorage.getItem("user_house") || localStorage.getItem("house") : null) || "";
    const floorVal =
      data.floor !== undefined && data.floor !== null && String(data.floor).trim()
        ? String(data.floor).trim()
        : (typeof window !== "undefined" ? localStorage.getItem("user_floor") || localStorage.getItem("floor") : null) || "";
    const streetVal =
      data.street !== undefined && data.street !== null && String(data.street).trim()
        ? String(data.street).trim()
        : (typeof window !== "undefined" ? localStorage.getItem("user_street") || localStorage.getItem("street") : null) ||
        (data.address && !data.address.startsWith("{") ? data.address.split(",")[0].trim() : "");

    const rawAddr = (data.address || "").trim();
    let fullAddress = rawAddr;
    const parts: string[] = [];
    if (houseVal && !rawAddr.toLowerCase().includes(houseVal.toLowerCase())) {
      parts.push(houseVal);
    }
    if (floorVal && !rawAddr.toLowerCase().includes(floorVal.toLowerCase())) {
      const floorStr = floorVal.toLowerCase().includes("floor") ? floorVal : `Floor ${floorVal}`;
      parts.push(floorStr);
    }
    if (streetVal && !rawAddr.toLowerCase().includes(streetVal.toLowerCase())) {
      parts.push(streetVal);
    }
    if (parts.length > 0) {
      fullAddress = `${parts.join(", ")}, ${rawAddr}`;
    }

    const payload = {
      lat: String(data.lat || "51.5074"),
      lon: String(data.lon || "-0.1278"),
      address: fullAddress,
      city: data.city || (typeof window !== "undefined" ? localStorage.getItem("user_city") : null) || "",
      street: streetVal,
      zip_code: data.zip_code || extractPostcode(data.address || ""),
      country: data.country || "",
      address_type: data.address_type || "service",
      contact_person_name: data.contact_person_name || (typeof window !== "undefined" ? localStorage.getItem("user_name") : null) || "Customer",
      contact_person_number: data.contact_person_number || (typeof window !== "undefined" ? localStorage.getItem("user_phone") : null) || "",
      address_label: data.address_label || "Home",
      house: houseVal,
      floor: floorVal,
    };

    const res = await apiClient.post<any>("/customer/address", payload);
    const content = res.data?.content || res.data;
    const addressId =
      content?.id ||
      content?.data?.id ||
      res.data?.id ||
      "9";

    const serviceAddressJson = formatServiceAddressJson(payload);

    if (typeof window !== "undefined") {
      localStorage.setItem("service_address", serviceAddressJson);
      localStorage.setItem("service_address_json", serviceAddressJson);
      localStorage.setItem("customer_service_address", serviceAddressJson);
      localStorage.setItem("postcode", payload.zip_code);
      localStorage.setItem("user_postcode", payload.zip_code);
      localStorage.setItem("service_address_id", String(addressId));
      localStorage.setItem("address_id", String(addressId));
      localStorage.setItem("user_lat", String(payload.lat));
      localStorage.setItem("user_lon", String(payload.lon));
      localStorage.setItem("user_address", payload.address);
      localStorage.setItem("user_city", payload.city);
      localStorage.setItem("user_street", payload.street);
      if (payload.house) {
        localStorage.setItem("user_house", payload.house);
        localStorage.setItem("house", payload.house);
      }
      if (payload.floor) {
        localStorage.setItem("user_floor", payload.floor);
        localStorage.setItem("floor", payload.floor);
      }
    }

    return {
      success: true,
      address_id: String(addressId),
      message: res.data?.message || "Address saved successfully",
      raw: res.data,
    };
  } catch (err: any) {
    console.warn("saveCustomerAddressToBackend warning:", err?.response?.data || err?.message);
    const fallbackId = (typeof window !== "undefined" && localStorage.getItem("service_address_id")) || "9";
    return {
      success: false,
      address_id: String(fallbackId),
      message: err?.response?.data?.message || err?.message || "Failed to save address",
    };
  }
}
