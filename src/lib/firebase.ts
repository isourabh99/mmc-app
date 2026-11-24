import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported, type Messaging } from "firebase/messaging";

const cleanFirebaseProjectId = (
  rawId: string = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ""
): string => {
  return rawId
    .replace(/\.firebaseapp\.com$/i, "")
    .replace(/\.firebasestorage\.app$/i, "")
    .trim();
};

const resolvedProjectId = cleanFirebaseProjectId();

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    (resolvedProjectId ? `${resolvedProjectId}.firebaseapp.com` : ""),
  projectId: resolvedProjectId,
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    (resolvedProjectId ? `${resolvedProjectId}.firebasestorage.app` : ""),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

export const FIREBASE_VAPID_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

// Initialize or reuse existing Firebase App
export const app =
  getApps().length > 0
    ? getApp()
    : isFirebaseConfigured
    ? initializeApp(firebaseConfig)
    : null;

/**
 * Ensures Service Worker is registered with correct scope and credentials
 */
export const ensureServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;

  try {
    const swUrl = `/firebase-messaging-sw.js?apiKey=${encodeURIComponent(
      firebaseConfig.apiKey || ""
    )}&projectId=${encodeURIComponent(
      firebaseConfig.projectId || ""
    )}&messagingSenderId=${encodeURIComponent(
      firebaseConfig.messagingSenderId || ""
    )}&appId=${encodeURIComponent(
      firebaseConfig.appId || ""
    )}&authDomain=${encodeURIComponent(
      firebaseConfig.authDomain || ""
    )}&storageBucket=${encodeURIComponent(
      firebaseConfig.storageBucket || ""
    )}`;

    let registration = await navigator.serviceWorker.getRegistration("/");
    if (!registration) {
      registration = await navigator.serviceWorker.register(swUrl, { scope: "/" });
    }
    await navigator.serviceWorker.ready;
    return registration;
  } catch (err) {
    console.warn("[FCM] ServiceWorker registration error:", err);
    return null;
  }
};

/**
 * Request notification permission, register service worker, and generate FCM Device Token.
 * Returns the FCM token string and caches it in localStorage.
 */
export const getFCMToken = async (forceRefresh: boolean = false): Promise<string> => {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return "";
  }

  // If cached token exists and forceRefresh is false, return cached token but still ensure SW is active
  const cachedToken = localStorage.getItem("fcm_token");
  if (cachedToken && !forceRefresh && Notification.permission === "granted") {
    ensureServiceWorkerRegistration().catch(() => {});
    return cachedToken;
  }

  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn("[FCM] Messaging is not supported in this browser environment");
      return "";
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("[FCM] Notification permission not granted:", permission);
      return "";
    }

    // 1. Register Service Worker
    const registration = await ensureServiceWorkerRegistration();
    if (!registration) {
      return "";
    }

    // 2. Obtain FCM Token
    if (!app) {
      console.warn("[FCM] Firebase App is not configured");
      return "";
    }
    const messaging: Messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      localStorage.setItem("fcm_token", token);
      return token;
    }
  } catch (error) {
    console.warn("[FCM] Error obtaining FCM Token:", error);
  }

  return "";
};

/**
 * Listen for incoming push notifications while the website is active in foreground.
 */
export const onForegroundMessage = async (callback: (payload: any) => void) => {
  if (typeof window === "undefined") return () => {};

  try {
    const supported = await isSupported();
    if (!supported || !app) return () => {};

    const messaging: Messaging = getMessaging(app);
    return onMessage(messaging, (payload) => {
      callback(payload);
    });
  } catch (err) {
    return () => {};
  }
};

// Persistent registry of sent push notifications to ensure 1 event = 1 notification only
const PUSH_NOTIF_HISTORY_KEY = "mmc_pushed_notif_registry_v1";

function isAlreadyPushed(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(PUSH_NOTIF_HISTORY_KEY);
    const registry: Record<string, number> = raw ? JSON.parse(raw) : {};
    const now = Date.now();
    // Prune entries older than 48 hours to prevent unbounded growth
    Object.keys(registry).forEach((k) => {
      if (now - registry[k] > 48 * 3600 * 1000) {
        delete registry[k];
      }
    });
    if (registry[key]) {
      return true; // Already pushed once, reject duplicate
    }
    registry[key] = now;
    localStorage.setItem(PUSH_NOTIF_HISTORY_KEY, JSON.stringify(registry));
    return false;
  } catch {
    return false;
  }
}

/**
 * Reliably displays a native device push notification with single-dispatch deduplication.
 * @param bypassDedup Set to true for live admin/server push messages so they are never suppressed
 */
export const triggerDevicePushNotification = async (
  title: string,
  body: string,
  url?: string,
  dedupKey?: string,
  bypassDedup: boolean = false,
  imageUrl?: string | null
) => {
  if (typeof window === "undefined") return;

  // Extract booking reference if present in title, body, or url
  let detectedBookingKey = "";
  const combinedText = `${title} ${body} ${url || ""}`;
  const refMatch = combinedText.match(/(?:#|ref[:\s]*#?|bookingId=|booking_id=)([a-zA-Z0-9_-]{4,})/i);
  if (refMatch && refMatch[1]) {
    detectedBookingKey = `booking_push_${refMatch[1].toLowerCase().trim()}`;
  }

  // Generate unique deduplication key for this event
  const effectiveKey = (
    dedupKey ||
    detectedBookingKey ||
    `${title.trim()}:${body.trim()}`
  ).toLowerCase().replace(/\s+/g, "_");

  // Prevent duplicate notifications for local periodic polling, but allow explicit server pushes
  if (!bypassDedup) {
    if (isAlreadyPushed(effectiveKey)) {
      console.log("[PushNotification] Deduplicated - already pushed once:", effectiveKey);
      return;
    }
    if (detectedBookingKey && effectiveKey !== detectedBookingKey && isAlreadyPushed(detectedBookingKey)) {
      console.log("[PushNotification] Deduplicated by booking ref:", detectedBookingKey);
      return;
    }
  }

  const targetUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const notifTag = (detectedBookingKey || effectiveKey).slice(0, 32);

  // 1. Try Service Worker showNotification first (Reliable across mobile Android Chrome, PWAs, and desktop)
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && "showNotification" in reg) {
        await reg.showNotification(title, {
          body,
          icon: imageUrl || "/mmc-logo.png",
          badge: "/mmc-logo.png",
          image: imageUrl || undefined,
          tag: notifTag,
          renotify: false,
          vibrate: [200, 100, 200],
          data: { url: targetUrl, click_action: targetUrl, image: imageUrl || undefined },
        } as any);
        return;
      }
    } catch {
      // fallback
    }
  }

  // 2. Direct Window Notification API fallback (Desktop browsers)
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      const notif = new Notification(title, {
        body,
        icon: imageUrl || "/mmc-logo.png",
        badge: "/mmc-logo.png",
        image: imageUrl || undefined,
        tag: notifTag,
      } as any);
      notif.onclick = () => {
        window.focus();
        if (targetUrl) window.location.href = targetUrl;
      };
      return;
    } catch (e) {
      // Fallback
    }
  }

  // 3. Proactively request permission if default (not denied)
  if ("Notification" in window && Notification.permission === "default") {
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        const notif = new Notification(title, {
          body,
          icon: imageUrl || "/mmc-logo.png",
          badge: "/mmc-logo.png",
          image: imageUrl || undefined,
        } as any);
        notif.onclick = () => {
          window.focus();
          if (targetUrl) window.location.href = targetUrl;
        };
      }
    } catch {}
  }
};
