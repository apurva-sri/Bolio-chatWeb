// Reads VAPID public key from import.meta.env — injected by vite.config.js
// which reads it from Server/.env at build time. No client .env file needed.
import { useEffect } from "react";
import API from "../utils/api";

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
};

const usePushNotifications = (user) => {
  useEffect(() => {
    if (!user?._id) return;

    // Completely skip if browser doesn't support push — no errors thrown
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("Push not supported in this browser — skipping");
      return;
    }

    const vapidKey = import.meta.env?.VITE_VAPID_PUBLIC_KEY;

    // Skip silently if key not configured — app still works normally
    if (!vapidKey) {
      console.log(
        "VAPID key not configured — in-app socket reminders still work",
      );
      return;
    }

    const setup = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");

        // Only ask for permission — don't force or throw if denied
        const permission = Notification.permission === "granted"
          ? "granted"
          : await Notification.requestPermission();

        if (permission !== "granted") {
          console.log("Push notification permission denied");
          return;
        }

        // Check if already subscribed to avoid re-subscribing on every login
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          // Already subscribed — just re-save to server in case it was lost
          await API.post("/user/push-subscription", {
            subscription: existing,
          }).catch(() => {});
          return;
        }

        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly:      true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        await API.post("/user/push-subscription", { subscription });
        console.log("✅ Push notifications enabled");
      } catch (err) {
        // Don't let push errors break the rest of the app
        console.warn("Push setup failed (non-critical):", err.message);
      }
    };

    setup();
  }, [user?._id]);
};

export default usePushNotifications;
