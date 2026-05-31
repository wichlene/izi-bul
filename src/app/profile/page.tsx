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
import ReferralBox from './ReferralBox';
import StreakBadges from './StreakBadges';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/profile');

  const [profileRes, submissionsRes, followingRes, followersRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('submissions').select('*, quest:quests(id, title, photo_url, cash_reward, category:categories(*))').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('friendships').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('friendships').select('id', { count: 'exact', head: true }).eq('friend_id', user.id),
  ]);

  const profile = profileRes.data;
  const submissions = (submissionsRes.data || []) as unknown as (Submission & { quest: Quest & { cash_reward: number } })[];
  const followingCount = followingRes.count || 0;
  const followersCount = followersRes.count || 0;
  const wonCount = submissions.filter((s) => s.is_winner).length;

  return (
    <AppShell>
      {/* ── HEADER ── */}
      <div className="px-4 pt-5 pb-4" style={{ borderBottom: '1px solid #eff3f4' }}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-black" style={{ color: '#0f1419' }}>Profil</h1>
          <div className="flex items-center gap-2">
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

        {/* Avatar + isim yan yana */}
        <div className="flex items-center gap-4">
          <ProfileAvatar avatarUrl={profile?.avatar_url ?? null} username={profile?.username ?? '?'} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-base font-black truncate" style={{ color: '#0f1419' }}>
                {profile?.full_name || profile?.username}
              </span>
              {profile?.is_admin && <Shield size={14} style={{ color: '#ff6b2b' }} />}
              {profile?.is_premium && <Star size={13} style={{ color: '#ff6b2b' }} fill="#ff6b2b" />}
            </div>
            <p className="text-sm" style={{ color: '#536471' }}>@{profile?.username}</p>
            {profile?.city && (
              <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: '#8e9aab' }}>
                <MapPin size={10} />{profile.city}
              </p>
            )}
          </div>
        </div>

        {profile?.bio && (
          <p className="text-sm mt-3 leading-relaxed" style={{ color: '#0f1419' }}>{profile.bio}</p>
        )}

        {/* Sayaçlar */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { val: followingCount, label: 'Takip' },
            { val: followersCount, label: 'Takipçi' },
            { val: profile?.total_finds || 0, label: 'Buldu' },
            { val: wonCount, label: 'Kazandı' },
          ].map(({ val, label }) => (
            <div key={label} className="rounded-xl py-2.5 text-center" style={{ background: '#f7f8f8' }}>
              <p className="text-base font-black leading-none" style={{ color: '#0f1419' }}>{val}</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#536471' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Puan */}
        <div className="mt-3 rounded-xl px-4 py-2.5 flex items-center justify-between"
          style={{ background: 'rgba(255,107,43,0.06)', border: '1px solid rgba(255,107,43,0.12)' }}>
          <span className="text-sm font-semibold" style={{ color: '#ff6b2b' }}>Toplam Puan</span>
          <span className="text-base font-black" style={{ color: '#ff6b2b' }}>
            {(profile?.total_points || 0).toLocaleString('tr-TR')} p
          </span>
        </div>
      </div>

      {/* Konum gizliliği */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #eff3f4' }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#0f1419' }}>Canlı Konum</p>
          <p className="text-xs" style={{ color: '#8e9aab' }}>Haritada görünürlük</p>
        </div>
        <PrivacyToggle
          userId={user.id}
          field="location_visible"
          value={profile?.location_visible !== false}
          onIcon={<Eye size={14} />}
          offIcon={<EyeOff size={14} />}
        />
      </div>

      {/* Streak + Rozetler */}
      <StreakBadges userId={user.id} />

      {/* Davet */}
      <ReferralBox userId={user.id} />

      {/* Paylaşımlar + Geçmiş */}
      <ProfilePosts userId={user.id} submissions={submissions} />
    </AppShell>
  );
}
