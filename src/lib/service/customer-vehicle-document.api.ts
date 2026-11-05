import apiClient from "@/lib/http/apiClient";

export interface CustomerCarItem {
  id: string | number;
  car_brand?: string;
  brand?: string;
  car_model?: string;
  model?: string;
  manufacture_year?: string | number;
  year?: string | number;
  registration_number?: string;
  reg_no?: string;
  car_images?: string[] | string;
  car_images_full_path?: string[] | string;
  image?: string;
  image_full_path?: string;
  created_at?: string;
  updated_at?: string;
  is_primary?: boolean | number;
  [key: string]: any;
}

export interface CustomerCarInput {
  car_brand: string;
  car_model: string;
  manufacture_year: string;
  registration_number: string;
  car_images?: File[];
}

export interface CustomerDocumentTypeItem {
  id: string | number;
  title?: string;
  name?: string;
  description?: string;
  is_required?: boolean | number;
  [key: string]: any;
}

export interface CustomerDocumentItem {
  id: string | number;
  customer_id?: string;
  document_type_id: string | number;
  document_type?: CustomerDocumentTypeItem;
  type_name?: string;
  title?: string;
  file?: string;
  file_full_path?: string;
  status?: string;
  is_verified?: boolean | number;
  created_at?: string;
  [key: string]: any;
}

// =============================================================================
// CUSTOMER CAR APIS
// =============================================================================

/**
 * Fetch all customer registered vehicles: GET /customer/car/list
 */
export const fetchCustomerCars = async (): Promise<CustomerCarItem[]> => {
  try {
    const res = await apiClient.get("/customer/car/list");
    const content = res.data?.content || res.data?.data || res.data;
    if (Array.isArray(content)) {
      return content;
    }
    if (content?.data && Array.isArray(content.data)) {
      return content.data;
    }
    return [];
  } catch (err: any) {
    console.error("Error fetching customer cars:", err);
    throw err;
  }
};

/**
 * Create a new customer vehicle: POST /customer/car/create
 */
export const createCustomerCar = async (data: CustomerCarInput | FormData): Promise<any> => {
  try {
    let payload: FormData;
    if (data instanceof FormData) {
      payload = data;
    } else {
      payload = new FormData();
      payload.append("car_brand", data.car_brand.trim());
      payload.append("car_model", data.car_model.trim());
      payload.append("manufacture_year", String(data.manufacture_year).trim());
      payload.append("registration_number", data.registration_number.trim().toUpperCase());

      if (data.car_images && data.car_images.length > 0) {
        data.car_images.forEach((file) => {
          payload.append("car_images[]", file);
        });
      }
    }

    const res = await apiClient.post("/customer/car/create", payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (err: any) {
    console.error("Error creating customer car:", err);
    throw err;
  }
};

/**
 * Update an existing customer vehicle: POST /customer/car/update/{id}
 */
export const updateCustomerCar = async (
  carId: string | number,
  data: Partial<CustomerCarInput> | FormData
): Promise<any> => {
  try {
    let payload: FormData;
    if (data instanceof FormData) {
      payload = data;
    } else {
      payload = new FormData();
      if (data.car_brand) payload.append("car_brand", data.car_brand.trim());
      if (data.car_model) payload.append("car_model", data.car_model.trim());
      if (data.manufacture_year) payload.append("manufacture_year", String(data.manufacture_year).trim());
      if (data.registration_number)
        payload.append("registration_number", data.registration_number.trim().toUpperCase());

      if (data.car_images && data.car_images.length > 0) {
        data.car_images.forEach((file) => {
          payload.append("car_images[]", file);
        });
      }
    }

    const res = await apiClient.post(`/customer/car/update/${carId}`, payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (err: any) {
    console.error(`Error updating customer car ${carId}:`, err);
    throw err;
  }
};

/**
 * Delete a customer vehicle: DELETE /customer/car/delete/{id}
 */
export const deleteCustomerCar = async (carId: string | number): Promise<any> => {
  try {
    const res = await apiClient.delete(`/customer/car/delete/${carId}`);
    return res.data;
  } catch (err: any) {
    console.error(`Error deleting customer car ${carId}:`, err);
    throw err;
  }
};

// =============================================================================
// CUSTOMER DOCUMENT APIS
// =============================================================================

/**
 * Fetch available document types: GET /customer/document/list
 */
export const fetchDocumentTypes = async (): Promise<CustomerDocumentTypeItem[]> => {
  try {
    const res = await apiClient.get("/customer/document/list");
    const content = res.data?.content || res.data?.data || res.data;
    if (Array.isArray(content)) {
      return content;
    }
    if (content?.data && Array.isArray(content.data)) {
      return content.data;
    }
    // Fallback default UK document types if endpoint returns empty array
    return [
      { id: "1", name: "Driving License", title: "Driving License", description: "Photocard driving licence (Front & Back)" },
      { id: "2", name: "MOT Certificate", title: "MOT Certificate", description: "Current valid vehicle MOT pass certificate" },
      { id: "3", name: "Vehicle Insurance", title: "Vehicle Insurance", description: "Valid policy certificate or cover note" },
      { id: "4", name: "V5C Logbook", title: "V5C Logbook", description: "Vehicle Registration Document (V5C)" },
    ];
  } catch (err: any) {
    console.warn("Could not fetch document types from API, using defaults:", err);
    return [
      { id: "1", name: "Driving License", title: "Driving License", description: "Photocard driving licence (Front & Back)" },
      { id: "2", name: "MOT Certificate", title: "MOT Certificate", description: "Current valid vehicle MOT pass certificate" },
      { id: "3", name: "Vehicle Insurance", title: "Vehicle Insurance", description: "Valid policy certificate or cover note" },
      { id: "4", name: "V5C Logbook", title: "V5C Logbook", description: "Vehicle Registration Document (V5C)" },
    ];
  }
};

/**
 * Fetch all customer uploaded documents: GET /customer/document/my-documents
 */
export const fetchMyDocuments = async (): Promise<CustomerDocumentItem[]> => {
  try {
    const res = await apiClient.get("/customer/document/my-documents");
    const content = res.data?.content || res.data?.data || res.data;
    if (Array.isArray(content)) {
      return content;
    }
    if (content?.data && Array.isArray(content.data)) {
      return content.data;
    }
    return [];
  } catch (err: any) {
    console.error("Error fetching customer documents:", err);
    throw err;
  }
};

/**
 * Upload a customer document: POST /customer/document/upload
 */
export const uploadCustomerDocument = async (
  documentTypeId: string | number,
  file: File,
  title?: string
): Promise<any> => {
  try {
    const payload = new FormData();
    payload.append("document_type_id", String(documentTypeId));
    payload.append("file", file);
    if (title) {
      payload.append("title", title.trim());
    }

    const res = await apiClient.post("/customer/document/upload", payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (err: any) {
    console.error("Error uploading customer document:", err);
    throw err;
  }
};

/**
 * Delete a customer document: DELETE /customer/document/delete/{id}
 */
export const deleteCustomerDocument = async (documentId: string | number): Promise<any> => {
  try {
    const res = await apiClient.delete(`/customer/document/delete/${documentId}`);
    return res.data;
  } catch (err: any) {
    console.error(`Error deleting customer document ${documentId}:`, err);
    throw err;
  }
};
