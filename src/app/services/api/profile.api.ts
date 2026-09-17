
import apiClient from "../http/apiClient";

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
  console.log(data);
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
  const response = await fetch(
    `/api/reverse-geocode?lat=${encodeURIComponent(
      latitude
    )}&lon=${encodeURIComponent(longitude)}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message || "Failed to fetch address"
    );
  }

  return data;
};