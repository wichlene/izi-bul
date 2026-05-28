import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/Header';
import ChatClient from './ChatClient';

export const revalidate = 0;

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ with?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { with: withUserId } = await searchParams;

  const { data: friends } = await supabase
    .from('friendships')
    .select('friend:profiles!friendships_friend_id_fkey(id, username)')
    .eq('user_id', user.id);

  let initialMessages: unknown[] = [];
  let chatWith = null;

  if (withUserId) {
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${withUserId}),and(from_user_id.eq.${withUserId},to_user_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
      .limit(100);
    initialMessages = msgs || [];

    const { data: withProfile } = await supabase.from('profiles').select('id, username').eq('id', withUserId).single();
    chatWith = withProfile;

    await supabase.from('messages').update({ is_read: true })
      .eq('from_user_id', withUserId).eq('to_user_id', user.id).eq('is_read', false);
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      <Header />
      <ChatClient
        currentUserId={user.id}
        friends={(friends || []).map((f) => f.friend as unknown as { id: string; username: string })}
        initialMessages={initialMessages as { id: string; from_user_id: string; to_user_id: string; content: string; created_at: string }[]}
        chatWith={chatWith}
      />
    </div>
  );
}
