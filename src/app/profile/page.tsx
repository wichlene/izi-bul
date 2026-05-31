import { redirect } from 'next/navigation';
import { MapPin, Shield, Eye, EyeOff, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import AppShell from '@/components/AppShell';
import { Submission, Quest } from '@/types';
import PrivacyToggle from './PrivacyToggle';
import ProfileImageEditor from './ProfileImageEditor';
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
      {/* Banner + Avatar */}
      <ProfileImageEditor
        avatarUrl={profile?.avatar_url ?? null}
        bannerUrl={profile?.banner_url ?? null}
        username={profile?.username ?? '?'}
      />

      {/* İsim / stats */}
      <div className="px-4 pb-4" style={{ borderBottom: '1px solid #eff3f4' }}>
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black" style={{ color: '#0f1419' }}>{profile?.full_name || profile?.username}</h1>
              {profile?.is_admin && <Shield size={16} style={{ color: '#ff6b2b' }} />}
              {profile?.is_premium && <Star size={14} style={{ color: '#ff6b2b' }} fill="#ff6b2b" />}
            </div>
            <p className="text-sm" style={{ color: '#536471' }}>@{profile?.username}</p>
          </div>
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

        {profile?.bio && (
          <p className="text-sm mt-2 mb-1 leading-relaxed" style={{ color: '#0f1419' }}>{profile.bio}</p>
        )}
        {profile?.city && (
          <p className="text-xs flex items-center gap-1 mt-1 mb-3" style={{ color: '#536471' }}>
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
            <span className="font-black" style={{ color: '#0f1419' }}>{profile?.total_finds || 0}</span> Buldu
          </span>
          <span className="text-sm" style={{ color: '#536471' }}>
            <span className="font-black" style={{ color: '#0f1419' }}>{wonCount}</span> Kazandı
          </span>
        </div>
      </div>

      {/* Gizlilik */}
      <div className="px-4 py-4" style={{ borderBottom: '1px solid #eff3f4' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm" style={{ color: '#0f1419' }}>Canlı Konum Paylaşımı</p>
            <p className="text-xs" style={{ color: '#536471' }}>Haritada diğer oyuncular seni görebilir</p>
          </div>
          <PrivacyToggle userId={user.id} field="location_visible" value={profile?.location_visible !== false}
            onIcon={<Eye size={14} />} offIcon={<EyeOff size={14} />} />
        </div>
      </div>

      {/* Streak + Rozetler */}
      <StreakBadges userId={user.id} />

      {/* Arkadaş davet kutusu */}
      <ReferralBox userId={user.id} />

      {/* Paylaşımlar + Geçmiş sekmeleri */}
      <ProfilePosts userId={user.id} submissions={submissions} />
    </AppShell>
  );
}
