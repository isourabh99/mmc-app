import apiClient from "@/lib/http/apiClient";

export interface SubscribeNewsletterResponse {
  response_code: string;
  message: string;
  content: any;
  errors?: Array<{ error_code?: string; message: string }>;
}

/**
 * POST /customer/subscribe-newsletter
 * Body: { "email": "customer@example.com" }
 */
export async function subscribeNewsletter(email: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const res = await apiClient.post<SubscribeNewsletterResponse>(
      "/customer/subscribe-newsletter",
      { email: email.trim().toLowerCase() }
    );

    if (
      res.data?.response_code === "subscribe_newsletter_200" ||
      res.status === 200
    ) {
      return {
        success: true,
        message:
          res.data?.message || "Subscribed to newsletter successfully!",
      };
    }

    return {
      success: false,
      message: res.data?.message || "Failed to subscribe.",
    };
  } catch (err: any) {
    const errorMsg =
      err?.response?.data?.errors?.[0]?.message ||
      err?.response?.data?.message ||
      err?.message ||
      "Unable to subscribe. Please try again.";

    return {
      success: false,
      message: errorMsg,
    };
  }
}
