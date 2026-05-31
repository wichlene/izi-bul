import { notFound } from 'next/navigation';
import { MapPin, Shield, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import AppShell from '@/components/AppShell';
import FollowButton from './FollowButton';
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
      {/* ── HEADER ── */}
      <div className="px-4 pt-5 pb-4" style={{ borderBottom: '1px solid #eff3f4' }}>
        <div className="flex items-center gap-4 mb-4">
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center text-2xl font-black text-white flex-shrink-0 border-2"
            style={{ background: 'linear-gradient(135deg,#ff6b2b,#a855f7)', borderColor: '#eff3f4' }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
              : profile.username?.charAt(0).toUpperCase()}
          </div>

          {/* İsim */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-base font-black truncate" style={{ color: '#0f1419' }}>
                {profile.full_name || profile.username}
              </span>
              {profile.is_admin && <Shield size={14} style={{ color: '#ff6b2b' }} />}
              {profile.is_premium && <Star size={13} style={{ color: '#ff6b2b' }} fill="#ff6b2b" />}
            </div>
            <p className="text-sm" style={{ color: '#536471' }}>@{profile.username}</p>
            {profile.city && (
              <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: '#8e9aab' }}>
                <MapPin size={10} />{profile.city}
              </p>
            )}
          </div>

          {/* Takip butonu */}
          {!isMe && me && (
            <FollowButton userId={me.id} targetId={id} initialFollowing={isFollowing} />
          )}
        </div>

        {profile.bio && (
          <p className="text-sm mb-3 leading-relaxed" style={{ color: '#0f1419' }}>{profile.bio}</p>
        )}

        {/* Sayaçlar */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { val: followingCount, label: 'Takip' },
            { val: followersCount, label: 'Takipçi' },
            { val: profile.total_finds || 0, label: 'Buldu' },
            { val: wonCount, label: 'Kazandı' },
          ].map(({ val, label }) => (
            <div key={label} className="rounded-xl py-2.5 text-center" style={{ background: '#f7f8f8' }}>
              <p className="text-base font-black leading-none" style={{ color: '#0f1419' }}>{val}</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#536471' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      <UserProfilePosts userId={id} />
    </AppShell>
  );
}
