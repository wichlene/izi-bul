import { redirect } from 'next/navigation';
import { MapPin, Shield, Star, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import AppShell from '@/components/AppShell';
import { Submission, Quest } from '@/types';
import PrivacyToggle from './PrivacyToggle';
import ProfileAvatar from './ProfileImageEditor';
import ProfileEditModal from './ProfileEditModal';
import LogoutButton from './LogoutButton';
import ProfilePosts from './ProfilePosts';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/profile');

  const [profileRes, submissionsRes, followingRes, followersRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('submissions')
      .select('*, quest:quests(id,title,photo_url,cash_reward,category:categories(*))')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('friendships').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('friendships').select('id', { count: 'exact', head: true }).eq('friend_id', user.id),
  ]);

  const profile = profileRes.data;
  const submissions = (submissionsRes.data || []) as unknown as (Submission & { quest: Quest & { cash_reward: number } })[];
  const followingCount = followingRes.count || 0;
  const followersCount = followersRes.count || 0;
  const wonCount = submissions.filter((s) => s.is_winner).length;

  const stats = [
    { val: followingCount, label: 'Takip' },
    { val: followersCount, label: 'Takipçi' },
    { val: profile?.total_finds || 0, label: 'Buldu' },
    { val: wonCount, label: 'Kazandı' },
  ];

  return (
    <AppShell>
      {/* ── HEADER ── */}
      <div style={{ padding: '16px 16px 0', borderBottom: '1px solid #eff3f4' }}>

        {/* Üst satır: başlık + butonlar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#0f1419' }}>Profil</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <ProfileEditModal
              userId={user.id}
              initialData={{
                full_name: profile?.full_name ?? null,
                username: profile?.username ?? null,
                city: profile?.city ?? null,
                bio: profile?.bio ?? null,
                location_visible: profile?.location_visible !== false,
                show_activity: profile?.show_activity !== false,
                profile_public: profile?.profile_public !== false,
              }}
            />
            <LogoutButton />
          </div>
        </div>

        {/* Avatar + İsim yan yana */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <ProfileAvatar avatarUrl={profile?.avatar_url ?? null} username={profile?.username ?? '?'} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#0f1419' }}>
                {profile?.full_name || profile?.username}
              </span>
              {profile?.is_admin && <Shield size={14} color="#ff6b2b" />}
              {profile?.is_premium && <Star size={13} color="#ff6b2b" fill="#ff6b2b" />}
            </div>
            <p style={{ fontSize: 13, color: '#536471', marginTop: 1 }}>@{profile?.username}</p>
            {profile?.city && (
              <p style={{ fontSize: 11, color: '#8e9aab', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                <MapPin size={10} /> {profile.city}
              </p>
            )}
            {profile?.bio && (
              <p style={{ fontSize: 13, color: '#0f1419', marginTop: 6, lineHeight: 1.45 }}>{profile.bio}</p>
            )}
          </div>
        </div>

        {/* 4 stat kutusu */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
          {stats.map(({ val, label }) => {
            const href = label === 'Takip' ? `/user/${user.id}/following` : label === 'Takipçi' ? `/user/${user.id}/followers` : null;
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

        {/* Puan */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(255,107,43,0.06)', border: '1px solid rgba(255,107,43,0.12)',
          borderRadius: 12, padding: '10px 14px', marginBottom: 16,
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#ff6b2b' }}>Toplam Puan</span>
          <span style={{ fontSize: 15, fontWeight: 900, color: '#ff6b2b' }}>
            {(profile?.total_points || 0).toLocaleString('tr-TR')} p
          </span>
        </div>
      </div>

      {/* Konum gizliliği */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eff3f4' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0f1419' }}>Canlı Konum</p>
          <p style={{ fontSize: 11, color: '#8e9aab', marginTop: 2 }}>Haritada görünürlük</p>
        </div>
        <PrivacyToggle
          userId={user.id}
          field="location_visible"
          value={profile?.location_visible !== false}
          onIcon={<Eye size={14} />}
          offIcon={<EyeOff size={14} />}
        />
      </div>

      <ProfilePosts userId={user.id} submissions={submissions} />
    </AppShell>
  );
}
