import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported, type Messaging } from "firebase/messaging";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

export const FIREBASE_VAPID_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";

// Initialize or reuse existing Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

/**
 * Request notification permission, register service worker, and generate FCM Device Token.
 * Returns the FCM token string and caches it in localStorage.
 */
export const getFCMToken = async (): Promise<string> => {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return "";
  }

  // Return existing token from cache if available
  const cachedToken = localStorage.getItem("fcm_token");
  if (cachedToken) {
    return cachedToken;
  }

  try {
    const supported = await isSupported();
    if (!supported) {
      return "";
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return "";
    }

    // 2. Register Service Worker with dynamic config
    const swUrl = `/firebase-messaging-sw.js?apiKey=${encodeURIComponent(
      firebaseConfig.apiKey
    )}&projectId=${encodeURIComponent(
      firebaseConfig.projectId
    )}&messagingSenderId=${encodeURIComponent(
      firebaseConfig.messagingSenderId
    )}&appId=${encodeURIComponent(firebaseConfig.appId)}`;

    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: "/",
    });
    await navigator.serviceWorker.ready;

    // 3. Obtain FCM Token
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
    // Suppress console output
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
    if (!supported) return () => {};

    const messaging: Messaging = getMessaging(app);
    return onMessage(messaging, (payload) => {
      callback(payload);
    });
  } catch (err) {
    return () => {};
  }
};

/**
 * Reliably displays a native device push notification using Service Worker or Notification API.
 */
export const triggerDevicePushNotification = async (title: string, body: string) => {
  if (typeof window === "undefined") return;

  // 1. Try Service Worker showNotification first (Standard for PWA / Web Push)
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && "showNotification" in reg) {
        await reg.showNotification(title, {
          body,
          icon: "/mmc-logo.png",
          badge: "/mmc-logo.png",
          vibrate: [200, 100, 200],
          data: { url: window.location.href },
        } as any);
        return;
      }
    } catch {
      // fallback
    }
  }

  // 2. Direct Window Notification API
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: "/mmc-logo.png",
          badge: "/mmc-logo.png",
        });
      } catch {}
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          try {
            new Notification(title, {
              body,
              icon: "/mmc-logo.png",
              badge: "/mmc-logo.png",
            });
          } catch {}
        }
      });
    }
  }
};
