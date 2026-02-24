//  Service Worker for Web Push notifications

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Bolio", body: event.data.text() };
  }

  const options = {
    body:  data.body  || "",
    icon:  data.icon  || "/icon-192.png",
    badge: "/icon-192.png",
    data:  { url: data.url || "/chat" },
    vibrate: [200, 100, 200],
    actions: [
      { action: "open",    title: "Open" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Bolio", options)
  );
});

/* Click on notification → open the app */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/chat";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
