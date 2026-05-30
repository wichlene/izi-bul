import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import AppShell from '@/components/AppShell';
import ChatClient from './ChatClient';

export const revalidate = 0;

interface RawMsg {
  id: string;
  from_user_id: string;
  to_user_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ with?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { with: withUserId } = await searchParams;
  const admin = createAdminClient();

  // Tüm arkadaşlar
  const { data: friendRows } = await admin
    .from('friendships')
    .select('friend:profiles!friendships_friend_id_fkey(id, username)')
    .eq('user_id', user.id);
  const friends = (friendRows || []).map((f) => f.friend as unknown as { id: string; username: string });

  // Son 300 mesaj — konuşma önizlemesi için gruplandırılacak
  const { data: recentMsgs } = await admin
    .from('messages')
    .select('id, from_user_id, to_user_id, content, created_at, is_read')
    .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(300);

  // Her arkadaş için: son mesaj + okunmamış sayı
  type ConvMeta = { lastMsg: string; lastTime: string; unread: number; lastFrom: string };
  const convMap: Record<string, ConvMeta> = {};
  for (const msg of (recentMsgs as RawMsg[]) || []) {
    const partnerId = msg.from_user_id === user.id ? msg.to_user_id : msg.from_user_id;
    if (!convMap[partnerId]) {
      convMap[partnerId] = { lastMsg: msg.content, lastTime: msg.created_at, unread: 0, lastFrom: msg.from_user_id };
    }
    if (!msg.is_read && msg.to_user_id === user.id) convMap[partnerId].unread++;
  }

  // Arkadaşları son mesaja göre sırala
  const sortedFriends = [...friends].sort((a, b) => {
    const ta = convMap[a.id]?.lastTime || '';
    const tb = convMap[b.id]?.lastTime || '';
    return tb.localeCompare(ta);
  });

  // Açık konuşma mesajları
  let initialMessages: RawMsg[] = [];
  let chatWith = null;

  if (withUserId) {
    const { data: msgs } = await admin
      .from('messages')
      .select('*')
      .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${withUserId}),and(from_user_id.eq.${withUserId},to_user_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
      .limit(200);
    initialMessages = (msgs || []) as RawMsg[];

    const { data: withProfile } = await admin.from('profiles').select('id, username').eq('id', withUserId).single();
    chatWith = withProfile;

    await admin.from('messages').update({ is_read: true })
      .eq('from_user_id', withUserId).eq('to_user_id', user.id).eq('is_read', false);

    if (convMap[withUserId]) convMap[withUserId].unread = 0;
  }

  return (
    <AppShell>
      <ChatClient
        key={chatWith?.id ?? 'list'}
        currentUserId={user.id}
        friends={sortedFriends}
        convMap={convMap}
        initialMessages={initialMessages}
        chatWith={chatWith}
      />
    </AppShell>
  );
}
