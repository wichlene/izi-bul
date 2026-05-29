import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import AppShell from '@/components/AppShell';
import ChatClient from './ChatClient';

export const revalidate = 0;

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ with?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { with: withUserId } = await searchParams;

  const admin = createAdminClient();

  const { data: friends } = await admin
    .from('friendships')
    .select('friend:profiles!friendships_friend_id_fkey(id, username)')
    .eq('user_id', user.id);

  let initialMessages: unknown[] = [];
  let chatWith = null;

  if (withUserId) {
    const { data: msgs } = await admin
      .from('messages')
      .select('*')
      .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${withUserId}),and(from_user_id.eq.${withUserId},to_user_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
      .limit(200);
    initialMessages = msgs || [];

    const { data: withProfile } = await admin.from('profiles').select('id, username').eq('id', withUserId).single();
    chatWith = withProfile;

    await admin.from('messages').update({ is_read: true })
      .eq('from_user_id', withUserId).eq('to_user_id', user.id).eq('is_read', false);
  }

  return (
    <AppShell>
      <ChatClient
        currentUserId={user.id}
        friends={(friends || []).map((f) => f.friend as unknown as { id: string; username: string })}
        initialMessages={initialMessages as { id: string; from_user_id: string; to_user_id: string; content: string; created_at: string }[]}
        chatWith={chatWith}
      />
    </AppShell>
  );
}
