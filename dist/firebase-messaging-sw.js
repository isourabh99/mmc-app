// Firebase Cloud Messaging Service Worker for MMC App
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js");

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

const urlParams = new URLSearchParams(self.location.search);

const defaultProjectId = "motor-market-connect-a2eff";
const rawProjectId = urlParams.get("projectId") || defaultProjectId;
const cleanProjectId = rawProjectId
  .replace(/\.firebaseapp\.com$/i, "")
  .replace(/\.firebasestorage\.app$/i, "")
  .trim();

const firebaseConfig = {
  apiKey: urlParams.get("apiKey") || "AIzaSyCGoZ-coUFTMUoUcAat5aQUzAu7mj8g26g",
  authDomain: `${cleanProjectId}.firebaseapp.com`,
  projectId: cleanProjectId,
  storageBucket: `${cleanProjectId}.firebasestorage.app`,
  messagingSenderId: urlParams.get("messagingSenderId") || "361839663402",
  appId: urlParams.get("appId") || "1:361839663402:web:7ad55d5dac8adcb1e96653",
};

// Initialize Firebase App only once
if (!firebase.apps.length) {
  try {
    firebase.initializeApp(firebaseConfig);
  } catch (err) {
    console.error("[FCM SW] firebase.initializeApp error:", err);
  }
}

let messaging = null;
try {
  messaging = firebase.messaging();
} catch (err) {
  console.warn("[FCM SW] firebase.messaging() init error:", err);
}

/**
 * Extracts and resolves complete image URL from FCM notification or data payload
 */
function extractImageUrlFromPayload(payload) {
  if (!payload) return null;

  const data = payload.data || {};
  const notification = payload.notification || {};

  const candidates = [
    notification.image,
    data.image_full_path,
    data.cover_image_full_path,
    data.image,
    data.cover_image,
    data.notification_image,
    data.attachment,
    data.attachment_full_path,
    data.banner,
    data.banner_full_path,
    notification.icon,
    data.icon,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length > 0) {
      const trimmed = c.trim();
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
        return trimmed;
      }
      if (trimmed.startsWith("/")) {
        return `https://mmcclub.co.uk${trimmed}`;
      }
      if (trimmed.startsWith("storage/")) {
        return `https://mmcclub.co.uk/backend/${trimmed}`;
      }
      if (trimmed.endsWith(".png") || trimmed.endsWith(".jpg") || trimmed.endsWith(".jpeg") || trimmed.endsWith(".webp")) {
        if (trimmed.includes("push-notification")) {
          return `https://mmcclub.co.uk/backend/storage/app/public/push-notification/${trimmed.split("/").pop()}`;
        }
        return `https://mmcclub.co.uk/backend/storage/app/public/notification/${trimmed.split("/").pop()}`;
      }
    }
  }

  return null;
}

// Handle background messages when website tab is closed / in background
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log("[FCM SW] Background push received:", payload);

    const notificationTitle =
      payload?.notification?.title ||
      payload?.data?.title ||
      payload?.data?.notification_title ||
      "Motor Market Club Notification";

    const notificationBody =
      payload?.notification?.body ||
      payload?.data?.body ||
      payload?.data?.notification_body ||
      payload?.data?.message ||
      "You have a new update.";

    const targetUrl =
      payload?.data?.click_action ||
      payload?.data?.link ||
      payload?.data?.url ||
      payload?.data?.targetUrl ||
      "/account?tab=bookings";

    const imageUrl = extractImageUrlFromPayload(payload);

    const notificationOptions = {
      body: notificationBody,
      icon: imageUrl || "/mmc-logo.png",
      badge: "/mmc-logo.png",
      image: imageUrl || undefined, // Displays rich full image banner in push notification
      tag: `fcm_${Date.now()}`,
      renotify: true,
      vibrate: [200, 100, 200],
      data: {
        ...(payload?.data || {}),
        image: imageUrl || undefined,
        url: targetUrl,
        click_action: targetUrl,
      },
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Handle standard push events if sent as raw Web Push
self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title =
      data.notification?.title ||
      data.title ||
      data.data?.title ||
      data.data?.notification_title;
    const body =
      data.notification?.body ||
      data.body ||
      data.data?.body ||
      data.data?.message;

    if (title || body) {
      const clickAction =
        data.data?.click_action ||
        data.data?.url ||
        data.data?.link ||
        data.click_action ||
        "/account?tab=bookings";

      const imageUrl = extractImageUrlFromPayload(data);

      event.waitUntil(
        self.registration.showNotification(title || "Motor Market Club", {
          body: body || "",
          icon: imageUrl || "/mmc-logo.png",
          badge: "/mmc-logo.png",
          image: imageUrl || undefined,
          tag: `push_${Date.now()}`,
          renotify: true,
          vibrate: [200, 100, 200],
          data: { url: clickAction, click_action: clickAction, image: imageUrl || undefined },
        })
      );
    }
  } catch (e) {
    // text fallback
    const text = event.data.text();
    if (text) {
      event.waitUntil(
        self.registration.showNotification("Motor Market Club", {
          body: text,
          icon: "/mmc-logo.png",
          badge: "/mmc-logo.png",
          data: { url: "/account?tab=bookings" },
        })
      );
    }
  }
});

// Handle notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const clickUrl =
    event.notification.data?.click_action ||
    event.notification.data?.link ||
    event.notification.data?.url ||
    "/account?tab=bookings";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) {
          if (client.url.includes(clickUrl) || clickUrl === "/") {
            return client.focus();
          }
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(clickUrl);
      }
    })
  );
});
