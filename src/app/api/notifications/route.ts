import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'auth' }, { status: 401 });

  const admin = createAdminClient();

  const [reqRes, msgRes, progressRes, notifRes] = await Promise.all([
    admin.from('friend_requests')
      .select('id, created_at, from_user:profiles!friend_requests_from_user_id_fkey(id, username)')
      .eq('to_user_id', user.id).eq('status', 'pending'),
    admin.from('messages')
      .select('id, content, created_at, from_user:profiles!messages_from_user_id_fkey(id, username)')
      .eq('to_user_id', user.id).eq('is_read', false)
      .order('created_at', { ascending: false }).limit(20),
    admin.from('user_quest_progress')
      .select('id, current_step, quests(id, title)')
      .eq('user_id', user.id).eq('is_completed', false).limit(5),
    admin.from('notifications')
      .select('*')
      .eq('user_id', user.id).eq('is_read', false)
      .order('created_at', { ascending: false }).limit(30),
  ]);

  const friendRequests = reqRes.data || [];
  const unreadMessages = msgRes.data || [];
  const activeQuests = progressRes.data || [];
  const dbNotifs = notifRes.data || [];

  return NextResponse.json({
    counts: {
      friend_requests: friendRequests.length,
      unread_messages: unreadMessages.length,
      active_quests: activeQuests.length,
      db_notifs: dbNotifs.length,
      total: friendRequests.length + unreadMessages.length + dbNotifs.length,
    },
    friend_requests: friendRequests,
    unread_messages: unreadMessages,
    active_quests: activeQuests,
    notifications: dbNotifs,
  });
}

// Mark notifications as read
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'auth' }, { status: 401 });

  const { ids } = await req.json().catch(() => ({ ids: null }));
  const admin = createAdminClient();

  if (ids && Array.isArray(ids)) {
    await admin.from('notifications').update({ is_read: true })
      .in('id', ids).eq('user_id', user.id);
  } else {
    // Hepsini okundu yap
    await admin.from('notifications').update({ is_read: true }).eq('user_id', user.id);
  }

  return NextResponse.json({ ok: true });
}
