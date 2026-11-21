"use client";

import { useEffect, useCallback } from "react";
import {
  getFCMToken,
  onForegroundMessage,
  triggerDevicePushNotification,
} from "@/lib/firebase";
import { useToast } from "@/components/ToastProvider";
import { updateFCMTokenToBackend } from "@/lib/auth.api";

export default function FirebaseNotificationListener() {
  const { showToast } = useToast();

  const syncToken = useCallback(async (force = false) => {
    try {
      const token = await getFCMToken(force);
      if (token) {
        const authToken =
          typeof window !== "undefined"
            ? localStorage.getItem("token") || localStorage.getItem("auth_token")
            : null;
        if (authToken) {
          await updateFCMTokenToBackend(token);
        }
      }
    } catch (e) {
      console.warn("[FCM] Token sync warning:", e);
    }
  }, []);

  useEffect(() => {
    // 1. Initial sync on mount
    syncToken();

    // 2. Sync whenever auth state changes (e.g. user logs in)
    const handleAuthChange = () => {
      syncToken(true);
    };

    window.addEventListener("auth-change", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    window.addEventListener("focus", handleAuthChange);

    // 3. Listen for foreground push messages while the website is active
    let unsubscribe: (() => void) | undefined = undefined;

    onForegroundMessage((payload) => {
      console.log("[FCM] Foreground push message received:", payload);
      const title =
        payload?.notification?.title ||
        payload?.data?.title ||
        payload?.data?.notification_title ||
        "Motor Market Club Notification";

      const body =
        payload?.notification?.body ||
        payload?.data?.body ||
        payload?.data?.notification_body ||
        payload?.data?.message ||
        "";

      const targetUrl =
        payload?.data?.targetUrl ||
        payload?.data?.url ||
        payload?.data?.click_action ||
        payload?.data?.link ||
        "/account?tab=bookings";

      // Extract image URL from notification or data payload
      const rawImage: string | null =
        payload?.notification?.image ||
        payload?.data?.image_full_path ||
        payload?.data?.cover_image_full_path ||
        payload?.data?.image ||
        payload?.data?.cover_image ||
        payload?.data?.notification_image ||
        payload?.data?.attachment ||
        payload?.data?.attachment_full_path ||
        payload?.data?.banner ||
        payload?.data?.banner_full_path ||
        payload?.notification?.icon ||
        payload?.data?.icon ||
        null;

      let resolvedImageUrl: string | null = null;
      if (rawImage && typeof rawImage === "string" && rawImage.trim().length > 0) {
        const trimmed = rawImage.trim();
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
          resolvedImageUrl = trimmed;
        } else if (trimmed.startsWith("/")) {
          resolvedImageUrl = `https://mmcclub.co.uk${trimmed}`;
        } else if (trimmed.startsWith("storage/")) {
          resolvedImageUrl = `https://mmcclub.co.uk/backend/${trimmed}`;
        } else if (
          trimmed.endsWith(".png") ||
          trimmed.endsWith(".jpg") ||
          trimmed.endsWith(".jpeg") ||
          trimmed.endsWith(".webp")
        ) {
          if (trimmed.includes("push-notification")) {
            resolvedImageUrl = `https://mmcclub.co.uk/backend/storage/app/public/push-notification/${trimmed.split("/").pop()}`;
          } else {
            resolvedImageUrl = `https://mmcclub.co.uk/backend/storage/app/public/notification/${trimmed.split("/").pop()}`;
          }
        }
      }

      showToast(body ? `${title}: ${body}` : title, "info", resolvedImageUrl);
      triggerDevicePushNotification(title, body, targetUrl, undefined, true, resolvedImageUrl);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("mmc-notifications-updated"));
        window.dispatchEvent(new CustomEvent("mmc-bookings-updated"));
      }
    }).then((unsub) => {
      if (typeof unsub === "function") {
        unsubscribe = unsub;
      }
    });

    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("focus", handleAuthChange);
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [showToast, syncToken]);

  return null;
}
