import webpush from 'web-push';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY!;
const VAPID_EMAIL = process.env.ADMIN_EMAIL || 'mailto:admin@izi-bul.vercel.app';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(`mailto:${VAPID_EMAIL.replace('mailto:', '')}`, VAPID_PUBLIC, VAPID_PRIVATE);
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

interface Subscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function sendPushToUser(subscriptions: Subscription[], payload: PushPayload) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;

  await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
        { TTL: 3600 }
      )
    )
  );
}
