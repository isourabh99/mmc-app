"use client";

import { useEffect } from "react";
import {
  getFCMToken,
  onForegroundMessage,
  triggerDevicePushNotification,
} from "@/lib/firebase";
import { useToast } from "@/components/ToastProvider";
import { updateFCMTokenToBackend } from "@/lib/auth.api";

export default function FirebaseNotificationListener() {
  const { showToast } = useToast();

  useEffect(() => {
    getFCMToken()
      .then((token) => {
        if (token) {
          updateFCMTokenToBackend(token).catch(() => {});
        }
      })
      .catch(() => {});

    // 2. Listen for foreground push messages while the tab is active
    let unsubscribe: (() => void) | undefined = undefined;

    onForegroundMessage((payload) => {
      const title =
        payload?.notification?.title || payload?.data?.title || "MMC Notification";
      const body =
        payload?.notification?.body || payload?.data?.body || "";
      const targetUrl =
        payload?.data?.targetUrl || payload?.data?.url || "/account?tab=quotes";

      showToast(body ? `${title}: ${body}` : title, "info");
      triggerDevicePushNotification(title, body, targetUrl);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("mmc-notifications-updated"));
      }
    }).then((unsub) => {
      if (typeof unsub === "function") {
        unsubscribe = unsub;
      }
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [showToast]);

  return null;
}
