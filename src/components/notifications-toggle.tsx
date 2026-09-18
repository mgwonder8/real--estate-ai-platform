"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0))).buffer as ArrayBuffer;
}

type Status = "unsupported" | "loading" | "off" | "on" | "denied";

export function NotificationsToggle() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const existing = await registration.pushManager.getSubscription();
        if (cancelled) return;
        if (existing) {
          setStatus("on");
        } else if (Notification.permission === "denied") {
          setStatus("denied");
        } else {
          setStatus("off");
        }
      } catch {
        if (!cancelled) setStatus("unsupported");
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setStatus("unsupported");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus(permission === "denied" ? "denied" : "off");
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON()),
    });

    setStatus("on");
  }

  if (status === "unsupported" || status === "loading") return null;

  if (status === "on") {
    return <span className="text-xs text-slate-300">🔔 Notifications on</span>;
  }

  if (status === "denied") {
    return <span className="text-xs text-slate-400">Notifications blocked</span>;
  }

  return (
    <button
      onClick={enable}
      className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/20 cursor-pointer"
    >
      🔔 Enable notifications
    </button>
  );
}
