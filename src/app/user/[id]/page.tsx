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

  const stats = [
    { val: followingCount, label: 'Takip' },
    { val: followersCount, label: 'Takipçi' },
    { val: profile.total_finds || 0, label: 'Buldu' },
    { val: wonCount, label: 'Kazandı' },
  ];

  return (
    <AppShell>
      <div style={{ padding: '16px 16px 0', borderBottom: '1px solid #eff3f4' }}>

        {/* Avatar + İsim + Takip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          {/* Avatar */}
          <div style={{
            width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
            background: 'linear-gradient(135deg,#ff6b2b,#a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 900, color: '#fff',
            border: '2px solid #eff3f4',
          }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              : profile.username?.charAt(0).toUpperCase()}
          </div>

          {/* İsim */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#0f1419' }}>
                {profile.full_name || profile.username}
              </span>
              {profile.is_admin && <Shield size={14} color="#ff6b2b" />}
              {profile.is_premium && <Star size={13} color="#ff6b2b" fill="#ff6b2b" />}
            </div>
            <p style={{ fontSize: 13, color: '#536471', marginTop: 1 }}>@{profile.username}</p>
            {profile.city && (
              <p style={{ fontSize: 11, color: '#8e9aab', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                <MapPin size={10} /> {profile.city}
              </p>
            )}
          </div>

          {!isMe && me && (
            <FollowButton userId={me.id} targetId={id} initialFollowing={isFollowing} />
          )}
        </div>

        {profile.bio && (
          <p style={{ fontSize: 13, color: '#0f1419', lineHeight: 1.45, marginBottom: 12 }}>{profile.bio}</p>
        )}

        {/* 4 stat */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
          {stats.map(({ val, label }) => {
            const href = label === 'Takip' ? `/user/${id}/following` : label === 'Takipçi' ? `/user/${id}/followers` : null;
            const inner = (
              <>
                <p style={{ fontSize: 17, fontWeight: 900, color: '#0f1419', lineHeight: 1 }}>{val}</p>
                <p style={{ fontSize: 11, color: href ? '#ff6b2b' : '#536471', marginTop: 3 }}>{label}</p>
              </>
            );
            return href ? (
              <a key={label} href={href} style={{ background: '#f7f8f8', borderRadius: 12, padding: '10px 4px', textAlign: 'center', display: 'block', textDecoration: 'none' }}>
                {inner}
              </a>
            ) : (
              <div key={label} style={{ background: '#f7f8f8', borderRadius: 12, padding: '10px 4px', textAlign: 'center' }}>
                {inner}
              </div>
            );
          })}
        </div>
      </div>

      <UserProfilePosts userId={id} />
    </AppShell>
  );
}
