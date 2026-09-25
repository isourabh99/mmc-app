import apiClient from "@/lib/http/apiClient";

export interface RegistrationData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
}

export interface loginData {
  email: string;
  otp: number | string;
  fcm_token?: string;
}

export const registerCustomer = async (data: RegistrationData) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("fcm_token") || "" : "";
  const response = await apiClient.post(
    "/customer/auth/registration",
    {
      ...data,
      fcm_token: token,
      password: "password",
      confirm_password: "password",
    }
  );

  return response.data;
};

export const loginCustomer = async (data: loginData) => {
  const token =
    data.fcm_token ||
    (typeof window !== "undefined" ? localStorage.getItem("fcm_token") || "" : "");

  const response = await apiClient.post(
    "/customer/auth/otp-login",
    {
      ...data,
      fcm_token: token,
    }
  );
  return response.data;
};

export const sendOtp = async (email: string) => {

    const response = await apiClient.post(
        "/customer/auth/otp-login",
        {
            email
        }
    );

    return response.data;
};

/**
 * Sync the active device FCM token to Laravel backend for current logged-in customer.
 */
export const updateFCMTokenToBackend = async (fcmToken?: string) => {
  if (typeof window === "undefined") return;
  const authToken = localStorage.getItem("token");
  const deviceToken = fcmToken || localStorage.getItem("fcm_token");
  if (!authToken || !deviceToken) return;

  try {
    await apiClient.post("/customer/fcm-token", { fcm_token: deviceToken });
  } catch (err1) {
    try {
      await apiClient.post("/customer/update-fcm-token", { fcm_token: deviceToken });
    } catch (err2) {
      try {
        const fd = new FormData();
        fd.append("fcm_token", deviceToken);
        await apiClient.post("/customer/update/profile", fd);
      } catch (err3) {
        // Graceful fallback
      }
    }
  }
};