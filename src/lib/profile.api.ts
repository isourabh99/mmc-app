
import apiClient from "@/lib/http/apiClient";

export const getCustomerProfile = async () => {
  const response = await apiClient.get(
    "/customer/info"
  );
  
  localStorage.setItem(
  "user",
  JSON.stringify(response.data.content)
);
  return response.data;
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
  const geocodeUrl = new URL(
    process.env.NEXT_PUBLIC_REVERSE_GEOCODE_URL ||
      "https://api.bigdatacloud.net/data/reverse-geocode-client"
  );

  geocodeUrl.searchParams.set("latitude", String(latitude));
  geocodeUrl.searchParams.set("longitude", String(longitude));
  geocodeUrl.searchParams.set("localityLanguage", "en");

  const response = await fetch(
    geocodeUrl.toString()
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message || "Failed to fetch address"
    );
  }

  const address = [
    data.locality,
    data.city,
    data.principalSubdivision,
    data.countryName,
  ]
    .filter(Boolean)
    .join(", ");

  return { address, results: [data] };
};