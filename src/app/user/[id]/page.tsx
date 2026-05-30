import { notFound } from 'next/navigation';
import { MapPin, Shield, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import AppShell from '@/components/AppShell';
import UserProfilePosts from './UserProfilePosts';

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: profile } = await admin.from('profiles').select('*').eq('id', id).single();
  if (!profile) notFound();

  const supabase = await createClient();
  const { data: { user: me } } = await supabase.auth.getUser();

  const [followingRes, followersRes, submissionsRes] = await Promise.all([
    admin.from('friendships').select('id', { count: 'exact', head: true }).eq('user_id', id),
    admin.from('friendships').select('id', { count: 'exact', head: true }).eq('friend_id', id),
    admin.from('submissions').select('id').eq('user_id', id).eq('is_winner', true),
  ]);

  const followingCount = followingRes.count || 0;
  const followersCount = followersRes.count || 0;
  const wonCount = submissionsRes.data?.length || 0;

  let isFollowing = false;
  if (me && me.id !== id) {
    const { data: fr } = await admin.from('friendships').select('id').eq('user_id', me.id).eq('friend_id', id).maybeSingle();
    isFollowing = !!fr;
  }

  const isMe = me?.id === id;

  return (
    <AppShell>
      {/* Banner */}
      <div className="relative">
        <div className="h-32 w-full" style={{ background: profile.banner_url ? undefined : 'linear-gradient(135deg,#ff6b2b22,#a855f722)' }}>
          {profile.banner_url && <img src={profile.banner_url} className="w-full h-full object-cover" alt="" />}
        </div>
        <div className="absolute -bottom-10 left-4">
          <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden flex items-center justify-center font-black text-2xl text-white"
            style={{ background: 'linear-gradient(135deg,#ff6b2b,#a855f7)' }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
              : profile.username?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 pt-14 pb-4" style={{ borderBottom: '1px solid #eff3f4' }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black" style={{ color: '#0f1419' }}>{profile.full_name || profile.username}</h1>
              {profile.is_admin && <Shield size={16} style={{ color: '#ff6b2b' }} />}
              {profile.is_premium && <Star size={14} style={{ color: '#ff6b2b' }} fill="#ff6b2b" />}
            </div>
            <p className="text-sm" style={{ color: '#536471' }}>@{profile.username}</p>
          </div>
          {!isMe && me && (
            <FollowButton userId={me.id} targetId={id} initialFollowing={isFollowing} />
          )}
        </div>

        {profile.bio && (
          <p className="text-sm mt-2 leading-relaxed" style={{ color: '#0f1419' }}>{profile.bio}</p>
        )}
        {profile.city && (
          <p className="text-xs flex items-center gap-1 mt-1" style={{ color: '#536471' }}>
            <MapPin size={11} />{profile.city}
          </p>
        )}
        <div className="flex gap-5 flex-wrap mt-3">
          <span className="text-sm" style={{ color: '#536471' }}>
            <span className="font-black" style={{ color: '#0f1419' }}>{followingCount}</span> Takip
          </span>
          <span className="text-sm" style={{ color: '#536471' }}>
            <span className="font-black" style={{ color: '#0f1419' }}>{followersCount}</span> Takipçi
          </span>
          <span className="text-sm" style={{ color: '#536471' }}>
            <span className="font-black" style={{ color: '#0f1419' }}>{profile.total_finds || 0}</span> Buldu
          </span>
          <span className="text-sm" style={{ color: '#536471' }}>
            <span className="font-black" style={{ color: '#0f1419' }}>{wonCount}</span> Kazandı
          </span>
        </div>
      </div>

      <UserProfilePosts userId={id} />
    </AppShell>
  );
}

// Inline follow button (client)
import FollowButton from './FollowButton';
