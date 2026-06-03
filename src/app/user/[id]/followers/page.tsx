import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import AppShell from '@/components/AppShell';

export default async function FollowersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: profile } = await admin.from('profiles').select('username').eq('id', id).single();
  if (!profile) notFound();

  const { data } = await admin
    .from('friendships')
    .select('follower:profiles!user_id(id, username, full_name, avatar_url, total_finds)')
    .eq('friend_id', id)
    .limit(100);

  const followers = (data || []).map((r) => {
    const f = (r as unknown as { follower: unknown }).follower;
    return Array.isArray(f) ? f[0] : f;
  }).filter(Boolean) as { id: string; username: string; full_name?: string; avatar_url?: string; total_finds: number }[];

  return (
    <AppShell>
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 h-14" style={{ background: '#fff', borderBottom: '1px solid #eff3f4' }}>
        <Link href={`/user/${id}`} className="p-2 -ml-1 rounded-full hover:bg-gray-100" style={{ color: '#0f1419' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <p className="font-black text-sm" style={{ color: '#0f1419' }}>Takipçiler</p>
          <p className="text-xs" style={{ color: '#536471' }}>@{profile.username} · {followers.length}</p>
        </div>
      </div>
      <div>
        {followers.length === 0 ? (
          <div className="p-16 text-center text-sm" style={{ color: '#536471' }}>Henüz takipçi yok.</div>
        ) : followers.map((u) => (
          <Link key={u.id} href={`/user/${u.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid #eff3f4' }}>
            <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-white text-sm"
              style={{ background: 'linear-gradient(135deg,#ff6b2b,#a855f7)' }}>
              {u.avatar_url
                ? <img src={u.avatar_url} className="w-full h-full object-cover" alt="" />
                : u.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: '#0f1419' }}>{u.full_name || u.username}</p>
              <p className="text-xs" style={{ color: '#536471' }}>@{u.username} · {u.total_finds} görev</p>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
