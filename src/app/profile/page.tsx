import { redirect } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Calendar, Shield, Eye, EyeOff, Star, CheckCircle, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import AppShell from '@/components/AppShell';
import { Submission, Quest } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import PrivacyToggle from './PrivacyToggle';
import ProfileImageEditor from './ProfileImageEditor';

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
  const submissions = submissionsRes.data;
  const followingCount = followingRes.count || 0;
  const followersCount = followersRes.count || 0;
  const wonCount = submissions?.filter((s) => s.is_winner).length || 0;

  return (
    <AppShell>
      {/* Banner + Avatar — tıklanabilir yükleme */}
      <ProfileImageEditor
        avatarUrl={profile?.avatar_url ?? null}
        bannerUrl={profile?.banner_url ?? null}
        username={profile?.username ?? '?'}
      />

      {/* İsim / kullanıcı adı / stats */}
      <div className="px-4 pb-4" style={{ borderBottom: '1px solid #eff3f4' }}>
        <div className="flex items-center gap-2 mb-0.5">
          <h1 className="text-xl font-black" style={{ color: '#0f1419' }}>{profile?.full_name || profile?.username}</h1>
          {profile?.is_admin && <Shield size={16} style={{ color: '#ff6b2b' }} />}
          {profile?.is_premium && <Star size={14} style={{ color: '#ff6b2b' }} fill="#ff6b2b" />}
        </div>
        <p className="text-sm mb-2" style={{ color: '#536471' }}>@{profile?.username}</p>
        {profile?.city && (
          <p className="text-xs flex items-center gap-1 mb-3" style={{ color: '#536471' }}>
            <MapPin size={11} />{profile.city}
          </p>
        )}
        <div className="flex gap-5 flex-wrap">
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

      {/* Geçmiş */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #eff3f4' }}>
        <h2 className="font-black text-base" style={{ color: '#0f1419' }}>
          <Calendar size={16} className="inline mr-2" style={{ color: '#536471' }} />
          Geçmiş ({submissions?.length || 0})
        </h2>
      </div>

      {!submissions?.length ? (
        <div className="p-16 text-center">
          <p className="mb-4 text-sm" style={{ color: '#536471' }}>Henüz hiç deneme yapmadın.</p>
          <Link href="/" className="inline-block px-5 py-2.5 rounded-full font-bold text-white text-sm" style={{ background: '#ff6b2b' }}>
            Görevlere Bak
          </Link>
        </div>
      ) : (
        (submissions as unknown as (Submission & { quest: Quest & { cash_reward: number } })[]).map((s) => (
          <Link key={s.id} href={`/quest/${s.quest.id}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            style={{ borderBottom: '1px solid #eff3f4' }}>
            <img src={s.quest.photo_url} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" alt="" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: '#0f1419' }}>{s.quest.title}</div>
              <div className="text-xs" style={{ color: '#536471' }}>
                {formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: tr })} · {s.distance_meters}m
              </div>
            </div>
            {s.is_winner ? (
              <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                <CheckCircle size={11} /> Kazandı
              </span>
            ) : s.status === 'pending' ? (
              <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: 'rgba(234,179,8,0.1)', color: '#ca8a04' }}>
                <Clock size={11} /> İnceleniyor
              </span>
            ) : (
              <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: '#f7f8f8', color: '#536471' }}>Uzak</span>
            )}
          </Link>
        ))
      )}
    </AppShell>
  );
}
