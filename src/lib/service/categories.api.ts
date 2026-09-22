import apiClient from "@/lib/http/apiClient";

export interface Category {
  id: string;
  parent_id: string;
  name: string;
  image: string | null;
  position: number;
  description: string | null;
  is_active: number;
  is_featured: number;
  created_at: string;
  updated_at: string;
  image_full_path: string | null;
  zones: CategoryZone[];
}

export interface CategoryZone {
  id: string;
  name: string;
  coordinates: {
    type: string;
    coordinates: unknown[];
  };
}

export interface CategoryResponse {
  response_code: string;
  message: string;
  content: {
    current_page: number;
    data: Category[];
    total: number;
    per_page: number;
  };
}

export const getCategories = async (
  limit: number = 10,
  offset: number = 1
): Promise<CategoryResponse> => {
  const response = await apiClient.get<CategoryResponse>(
    "/customer/category",
    {
      params: {
        limit,
        offset,
      },
    }
  );

  return response.data;
};