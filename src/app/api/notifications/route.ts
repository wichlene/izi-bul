import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'auth' }, { status: 401 });

  const [reqRes, msgRes, progressRes] = await Promise.all([
    supabase.from('friend_requests')
      .select('id, created_at, from_user:profiles!friend_requests_from_user_id_fkey(username)')
      .eq('to_user_id', user.id).eq('status', 'pending'),
    supabase.from('messages')
      .select('id, content, created_at, from_user:profiles!messages_from_user_id_fkey(id, username)')
      .eq('to_user_id', user.id).eq('is_read', false)
      .order('created_at', { ascending: false }).limit(10),
    supabase.from('user_quest_progress')
      .select('id, current_step, quests(id, title)')
      .eq('user_id', user.id).eq('is_completed', false).limit(5),
  ]);

  const friendRequests = reqRes.data || [];
  const unreadMessages = msgRes.data || [];
  const activeQuests = progressRes.data || [];

  return NextResponse.json({
    counts: {
      friend_requests: friendRequests.length,
      unread_messages: unreadMessages.length,
      active_quests: activeQuests.length,
      total: friendRequests.length + unreadMessages.length,
    },
    friend_requests: friendRequests,
    unread_messages: unreadMessages,
    active_quests: activeQuests,
  });
}
