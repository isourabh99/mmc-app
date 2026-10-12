
import apiClient from "@/lib/http/apiClient";

export const getCustomerProfile = async () => {
  try {
    const response = await apiClient.get(
      "/customer/info"
    );
    
    if (response?.data?.content && typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "user",
          JSON.stringify(response.data.content)
        );
      } catch {}
    }
    return response.data;
  } catch (err) {
    console.warn("getCustomerProfile: could not load profile, using fallback:", err);
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          return { content: JSON.parse(stored) };
        } catch {}
      }
    }
    return null;
  }
};

export const updateCustomerProfile = async (
  data: FormData
) => {
  const response = await apiClient.post(
    "/customer/update/profile",
    data,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const saveCustomerAddress = async (
  data: {
    lat: string;
    lon: string;
    address: string;
    address_type: string;
    contact_person_name: string;
    contact_person_number: string;
    address_label: string;
  }
) => {
  const response = await apiClient.post(
    "/customer/address",
    data
  );

  return response.data;
};

export const getAddressFromCoordinates = async (
  latitude: number,
  longitude: number
) => {
  try {
    const geocodeUrl = new URL(
      process.env.NEXT_PUBLIC_REVERSE_GEOCODE_URL ||
        "https://api.bigdatacloud.net/data/reverse-geocode-client"
    );

    geocodeUrl.searchParams.set("latitude", String(latitude));
    geocodeUrl.searchParams.set("longitude", String(longitude));
    geocodeUrl.searchParams.set("localityLanguage", "en");

    const response = await fetch(geocodeUrl.toString());
    const text = await response.text();
    if (!text || !text.trim()) {
      return { address: "London, UK", results: [] };
    }
    const data = JSON.parse(text);

    const address = [
      data.locality,
      data.city,
      data.principalSubdivision,
      data.countryName,
    ]
      .filter(Boolean)
      .join(", ");

    return { address: address || "London, UK", results: [data] };
  } catch {
    return { address: "London, UK", results: [] };
  }
};