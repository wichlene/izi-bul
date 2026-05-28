import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/Header';
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
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-white mb-6">Arkadaşlar</h1>
        <Suspense fallback={<div className="text-white/30">Yükleniyor...</div>}>
          <FriendsClient
            initialRequests={reqRes.data || []}
            initialFriends={friendRes.data || []}
            currentUserId={user.id}
          />
        </Suspense>
      </main>
    </div>
  );
}
