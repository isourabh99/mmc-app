import apiClient from "@/lib/http/apiClient";

export interface RegistrationData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender?: string;
  password?: string;
  confirm_password?: string;
  profile_image?: File | null;
  date_of_birth?: string;
}

export interface VerifyOtpData {
  email: string;
  otp: string | number;
}

// Check if current client session has a valid token
export const isAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem("token"));
};

// Backwards-compatible alias for existing imports
export type loginData = VerifyOtpData;

/**
 * Customer Registration API
 * POST /customer/auth/registration (multipart/form-data)
 */
export const registerCustomer = async (data: RegistrationData | FormData) => {
  let payload: FormData;

  if (data instanceof FormData) {
    payload = data;
  } else {
    payload = new FormData();
    payload.append("first_name", data.first_name || "");
    payload.append("last_name", data.last_name || "");
    payload.append("email", data.email || "");
    payload.append("phone", data.phone || "");
    payload.append("password", data.password || "password123");
    payload.append("confirm_password", data.confirm_password || data.password || "password123");
    if (data.gender) {
      payload.append("gender", data.gender);
    }
    if (data.profile_image instanceof File) {
      payload.append("profile_image", data.profile_image);
    }
    if (data.date_of_birth) {
      payload.append("date_of_birth", data.date_of_birth);
    }
  }

  const response = await apiClient.post("/customer/auth/registration", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

/**
 * Registration Verify OTP API
 * POST /customer/auth/verify-otp
 */
export const verifyOtp = async (data: VerifyOtpData) => {
  const response = await apiClient.post("/customer/auth/verify-otp", {
    email: data.email,
    otp: String(data.otp),
  });
  return response.data;
};

/**
 * Registration Resend OTP API
 * POST /customer/auth/resend-otp
 */
export const resendOtp = async (email: string) => {
  const response = await apiClient.post("/customer/auth/resend-otp", {
    email,
  });
  return response.data;
};

/**
 * Send Login OTP API
 * POST /customer/auth/otp-login
 * Body: { "email": "..." }
 */
export const sendLoginOtp = async (email: string) => {
  const response = await apiClient.post("/customer/auth/otp-login", {
    email: email.trim(),
  });
  return response.data;
};

/**
 * Verify Login OTP API
 * POST /customer/auth/otp-login
 * Body: { "email": "...", "otp": 3344 }
 */
export const verifyLoginOtp = async (data: { email: string; otp: string | number }) => {
  const otpValue =
    typeof data.otp === "string" && !isNaN(Number(data.otp))
      ? Number(data.otp)
      : data.otp;

  const response = await apiClient.post("/customer/auth/otp-login", {
    email: data.email.trim(),
    otp: otpValue,
  });
  return response.data;
};

// Aliases for seamless backwards compatibility
export const loginCustomer = verifyLoginOtp;
export const sendOtp = sendLoginOtp;