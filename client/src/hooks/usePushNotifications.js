// Reads VAPID public key from import.meta.env — injected by vite.config.js
// which reads it from Server/.env at build time. No client .env file needed.
import { useEffect } from "react";
import API from "../utils/api";

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
};

const usePushNotifications = (user) => {
  useEffect(() => {
    if (!user?._id) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const setup = async () => {
      try {
        const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          console.warn(
            "VAPID_PUBLIC_KEY not found — push notifications disabled",
          );
          return;
        }

        // Register service worker
        const reg = await navigator.serviceWorker.register("/sw.js");

        // Ask permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        // Subscribe
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        // Save to server
        await API.post("/user/push-subscription", { subscription });
        console.log("✅ Push notifications enabled");
      } catch (err) {
        console.error("Push setup error:", err.message);
      }
    };

    setup();
  }, [user?._id]);
};

export default usePushNotifications;
