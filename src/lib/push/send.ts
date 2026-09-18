import webpush from "web-push";
import {
  listPushSubscriptionsForStaff,
  removePushSubscriptionByEndpoint,
} from "@/lib/data/push-subscriptions";

function isConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function configure() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:info@chailabs.in",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/** Sends a web push notification to every device a staff member has subscribed on. */
export async function notifyStaff(staffId: string, payload: PushPayload): Promise<void> {
  if (!isConfigured()) return;
  configure();

  const subs = await listPushSubscriptionsForStaff(staffId);
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await removePushSubscriptionByEndpoint(sub.endpoint);
        }
      }
    })
  );
}

export async function notifyManyStaff(staffIds: string[], payload: PushPayload): Promise<void> {
  const unique = [...new Set(staffIds.filter(Boolean))];
  await Promise.all(unique.map((id) => notifyStaff(id, payload)));
}
