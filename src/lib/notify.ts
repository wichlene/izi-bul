import { createAdminClient } from './supabase/admin';
import { sendPushToUser } from './webpush';

type NotifType = 'quest_complete' | 'good_deed' | 'friend_request' | 'friend_accept' | 'message' | 'info';

interface NotifPayload {
  user_ids: string[];
  type: NotifType;
  title: string;
  body?: string;
  actor_id?: string;
  actor_username?: string;
  link?: string;
}

export async function notifyUsers({ user_ids, type, title, body, actor_id, actor_username, link }: NotifPayload) {
  if (!user_ids.length) return;
  const admin = createAdminClient();
  const rows = user_ids.map(uid => ({ user_id: uid, type, title, body, actor_id, actor_username, link }));
  await admin.from('notifications').insert(rows);

  // Push bildirim gönder
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .in('user_id', user_ids);
  if (subs?.length) {
    await sendPushToUser(subs, { title, body: body || '', url: link || '/notifications' });
  }
}

// Kullanıcının tüm arkadaş ID'lerini getir
export async function getFriendIds(userId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin.from('friendships').select('friend_id').eq('user_id', userId);
  return (data || []).map(r => r.friend_id);
}
