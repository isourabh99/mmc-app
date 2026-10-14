// Firebase Cloud Messaging Service Worker for MMC App
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js");

const urlParams = new URLSearchParams(self.location.search);

const firebaseConfig = {
  apiKey: urlParams.get("apiKey") || "",
  authDomain: (urlParams.get("projectId") || "") ? `${urlParams.get("projectId")}.firebaseapp.com` : "",
  projectId: urlParams.get("projectId") || "",
  storageBucket: (urlParams.get("projectId") || "") ? `${urlParams.get("projectId")}.firebasestorage.app` : "",
  messagingSenderId: urlParams.get("messagingSenderId") || "",
  appId: urlParams.get("appId") || "",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages when website tab is closed / in background
messaging.onBackgroundMessage((payload) => {

  const notificationTitle =
    payload.notification?.title ||
    payload.data?.title ||
    "MMC Motor Market Connect";

  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || "You have a new notification.",
    icon: payload.notification?.icon || payload.notification?.image || "/mmc-logo.png",
    badge: "/mmc-logo.png",
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const clickUrl =
    event.notification.data?.click_action ||
    event.notification.data?.link ||
    event.notification.data?.url ||
    "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === clickUrl && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(clickUrl);
      }
    })
  );
});
