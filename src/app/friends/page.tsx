import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import AppShell from '@/components/AppShell';
import FriendsClient from './FriendsClient';

export const revalidate = 0;

export default async function FriendsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [reqRes, friendRes] = await Promise.all([
    supabase.from('friend_requests')
      .select('*, from_user:profiles!friend_requests_from_user_id_fkey(id, username, total_finds)')
      .eq('to_user_id', user.id)
      .eq('status', 'pending'),
    supabase.from('friendships')
      .select('*, friend:profiles!friendships_friend_id_fkey(id, username, total_finds)')
      .eq('user_id', user.id),
  ]);

  return (
    <AppShell>
      <div className="px-4 py-4" style={{ borderBottom: '1px solid #eff3f4' }}>
        <h1 className="text-xl font-black" style={{ color: '#0f1419' }}>Arkadaşlar</h1>
      </div>
      <div className="px-4 py-4">
        <Suspense fallback={<div className="p-8 text-center" style={{ color: '#536471' }}>Yükleniyor...</div>}>
          <FriendsClient
            initialRequests={reqRes.data || []}
            initialFriends={friendRes.data || []}
            currentUserId={user.id}
          />
        </Suspense>
      </div>
    </AppShell>
  );
}
