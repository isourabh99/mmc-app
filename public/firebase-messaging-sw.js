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

const rawProjectId = urlParams.get("projectId") || "";
const cleanProjectId = rawProjectId
  .replace(/\.firebaseapp\.com$/i, "")
  .replace(/\.firebasestorage\.app$/i, "")
  .trim();

const firebaseConfig = {
  apiKey: urlParams.get("apiKey") || "",
  authDomain: urlParams.get("authDomain") || (cleanProjectId ? `${cleanProjectId}.firebaseapp.com` : ""),
  projectId: cleanProjectId,
  storageBucket: urlParams.get("storageBucket") || (cleanProjectId ? `${cleanProjectId}.firebasestorage.app` : ""),
  messagingSenderId: urlParams.get("messagingSenderId") || "",
  appId: urlParams.get("appId") || "",
};

// Initialize Firebase App only once when valid configuration exists
if (!firebase.apps.length && firebaseConfig.apiKey && firebaseConfig.projectId) {
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

// Track recently shown notifications to prevent any duplicates within 60 seconds
const seenSwNotificationKeys = new Set();
function hasRecentlyShown(tag) {
  if (!tag) return false;
  if (seenSwNotificationKeys.has(tag)) return true;
  seenSwNotificationKeys.add(tag);
  setTimeout(() => seenSwNotificationKeys.delete(tag), 60000);
  return false;
}

function getStableTag(data, title, body) {
  const idPart =
    data?.notification_id ||
    data?.id ||
    data?.estimate_id ||
    data?.post_id ||
    data?.booking_id;
  if (idPart) return `tag_${idPart}`.slice(0, 32);
  const text = `${title || ""}_${body || ""}`;
  return `tag_${text.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 28)}`;
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

    const notifTag = getStableTag(payload?.data, notificationTitle, notificationBody);
    if (hasRecentlyShown(notifTag)) {
      console.log("[FCM SW] Duplicate suppressed by tag:", notifTag);
      return;
    }

    let targetUrl =
      payload?.data?.click_action ||
      payload?.data?.link ||
      payload?.data?.url ||
      payload?.data?.targetUrl ||
      "";

    if (!targetUrl) {
      const lower = `${notificationTitle} ${notificationBody} ${payload?.data?.type || ""}`.toLowerCase();
      if (lower.includes("estimate") || lower.includes("quotation")) {
        const estId = payload?.data?.estimate_id || payload?.data?.id;
        targetUrl = estId ? `/account?tab=estimates&estimateId=${encodeURIComponent(String(estId))}` : "/account?tab=estimates";
      } else if (lower.includes("quote") || lower.includes("bid") || lower.includes("question") || lower.includes("inquiry")) {
        targetUrl = "/account?tab=quotes";
      } else {
        targetUrl = "/account?tab=bookings";
      }
    }

    const imageUrl = extractImageUrlFromPayload(payload);

    const notificationOptions = {
      body: notificationBody,
      icon: imageUrl || "/mmc-logo.png",
      badge: "/mmc-logo.png",
      image: imageUrl || undefined,
      tag: notifTag,
      renotify: false,
      vibrate: [200, 100, 200],
      data: {
        ...(payload?.data || {}),
        image: imageUrl || undefined,
        url: targetUrl,
        click_action: targetUrl,
      },
    };

    // Broadcast message to active tabs
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: "FCM_BACKGROUND_PUSH",
          payload: {
            ...payload,
            data: {
              ...(payload?.data || {}),
              targetUrl,
            },
          },
        });
      });
    }).catch(() => {});

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Handle standard push events if sent as raw Web Push (fallback only)
self.addEventListener("push", (event) => {
  if (!event.data) return;
  // If Firebase messaging is active, onBackgroundMessage already processes FCM pushes
  if (messaging) {
    return;
  }

  try {
    const data = event.data.json();
    const title =
      data.notification?.title ||
      data.title ||
      data.data?.title ||
      data.data?.notification_title ||
      "Motor Market Club Notification";
    const body =
      data.notification?.body ||
      data.body ||
      data.data?.body ||
      data.data?.message ||
      "";

    const notifTag = getStableTag(data.data, title, body);
    if (hasRecentlyShown(notifTag)) {
      return;
    }

    let clickAction =
      data.data?.click_action ||
      data.data?.url ||
      data.data?.link ||
      data.click_action ||
      "/account?tab=bookings";

    const imageUrl = extractImageUrlFromPayload(data);

    event.waitUntil(
      self.registration.showNotification(title, {
        body: body || "",
        icon: imageUrl || "/mmc-logo.png",
        badge: "/mmc-logo.png",
        image: imageUrl || undefined,
        tag: notifTag,
        renotify: false,
        vibrate: [200, 100, 200],
        data: { url: clickAction, click_action: clickAction, image: imageUrl || undefined },
      })
    );
  } catch (e) {
    // text fallback
    const text = event.data.text();
    if (text) {
      const notifTag = `tag_raw_${text.slice(0, 20)}`;
      if (hasRecentlyShown(notifTag)) return;
      event.waitUntil(
        self.registration.showNotification("Motor Market Club", {
          body: text,
          icon: "/mmc-logo.png",
          badge: "/mmc-logo.png",
          tag: notifTag,
          renotify: false,
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
