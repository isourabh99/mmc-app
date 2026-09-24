import axios from "axios";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

if (!apiBaseUrl) {
  console.warn(
    "NEXT_PUBLIC_API_URL is not configured. Add it to your .env.local file, for example: http://localhost:8000"
  );
}

const apiClient = axios.create({
  baseURL: apiBaseUrl || undefined,
  timeout: 10000,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    if (!apiBaseUrl) {
      return Promise.reject(
        new Error("NEXT_PUBLIC_API_URL is not configured. Set it in .env.local to your backend base URL.")
      );
    }

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;