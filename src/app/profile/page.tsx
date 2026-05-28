import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Target, MapPin, Calendar, Shield, Flame, Eye, EyeOff, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/Header';
import { Submission, Quest } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import PrivacyToggle from './PrivacyToggle';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/profile');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: submissions } = await supabase
    .from('submissions')
    .select('*, quest:quests(id, title, photo_url, points, category:categories(*))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const wonCount = submissions?.filter((s) => s.is_winner).length || 0;
  const level = Math.floor((profile?.total_points || 0) / 500) + 1;
  const nextLevelPoints = level * 500;
  const progress = Math.min(((profile?.total_points || 0) % 500) / 500 * 100, 100);

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* Profil Hero */}
        <div className="relative rounded-3xl overflow-hidden mb-6 p-6" style={{ background: 'linear-gradient(135deg, rgba(255,107,43,0.15), rgba(168,85,247,0.15))', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 0% 0%, rgba(255,107,43,0.1), transparent 60%)' }} />
          <div className="relative flex items-start gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black" style={{ background: 'linear-gradient(135deg, #ff6b2b, #a855f7)' }}>
                {profile?.username?.charAt(0).toUpperCase()}
              </div>
              {profile?.is_premium && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#a855f7' }}>
                  <Star size={10} className="text-white" fill="white" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-2xl font-black text-white">{profile?.full_name || profile?.username}</h1>
                {profile?.is_admin && <Shield size={16} className="text-purple-400" />}
              </div>
              <p className="text-white/40 text-sm">@{profile?.username}</p>
              {profile?.city && <p className="text-white/30 text-xs flex items-center gap-1 mt-1"><MapPin size={11} />{profile.city}</p>}

              {/* Seviye bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-white/50">Seviye {level}</span>
                  <span className="text-white/30">{profile?.total_points} / {nextLevelPoints} puan</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #ff6b2b, #a855f7)' }} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 hidden sm:grid">
              {[
                { icon: <Flame size={16} />, val: profile?.total_points || 0, label: 'Puan', color: '#ff6b2b' },
                { icon: <Target size={16} />, val: profile?.total_finds || 0, label: 'Çözüm', color: '#22c55e' },
                { icon: <Trophy size={16} />, val: wonCount, label: 'Kazanma', color: '#eab308' },
              ].map((s, i) => (
                <div key={i} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div style={{ color: s.color }} className="flex justify-center mb-1">{s.icon}</div>
                  <div className="text-white font-black">{s.val}</div>
                  <div className="text-white/30 text-xs">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Gizlilik Ayarları */}
          <div className="rounded-2xl p-5 border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <h2 className="font-bold text-white mb-4 flex items-center gap-2">
              <Shield size={16} className="text-purple-400" />
              Gizlilik Ayarları
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">Canlı Konum</p>
                  <p className="text-white/30 text-xs">Görev sırasında haritada görün</p>
                </div>
                <PrivacyToggle
                  userId={user.id}
                  field="location_visible"
                  value={profile?.location_visible !== false}
                  onIcon={<Eye size={14} />}
                  offIcon={<EyeOff size={14} />}
                />
              </div>
            </div>
          </div>

          {/* Rozetler */}
          <div className="rounded-2xl p-5 border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <h2 className="font-bold text-white mb-4 flex items-center gap-2">
              <Trophy size={16} className="text-yellow-400" />
              Rozetler
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile?.total_finds >= 1 && <span className="text-xl" title="İlk Keşif">🎯</span>}
              {profile?.total_finds >= 10 && <span className="text-xl" title="Kâşif">🧭</span>}
              {profile?.total_finds >= 100 && <span className="text-xl" title="Efsane">👑</span>}
              {profile?.is_premium && <span className="text-xl" title="Premium">⭐</span>}
              {profile?.is_admin && <span className="text-xl" title="Admin">🛡️</span>}
              {wonCount === 0 && <span className="text-white/20 text-sm">Henüz rozet yok. Görev çöz!</span>}
            </div>
          </div>
        </div>

        {/* Geçmiş */}
        <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
            <Calendar size={16} className="text-white/40" />
            <h2 className="font-bold text-white">Geçmiş ({submissions?.length || 0})</h2>
          </div>

          {!submissions?.length ? (
            <div className="p-12 text-center">
              <p className="text-white/20 mb-4">Henüz hiç deneme yapmadın.</p>
              <Link href="/" className="inline-block px-5 py-2.5 rounded-xl font-semibold text-white text-sm" style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}>
                Görevlere Bak
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {(submissions as unknown as (Submission & { quest: Quest })[]).map((s) => (
                <Link key={s.id} href={`/quest/${s.quest.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-white/2 transition-colors">
                  <img src={s.quest.photo_url} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 opacity-80" alt="" />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">{s.quest.title}</div>
                    <div className="text-white/30 text-xs">
                      {formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: tr })}
                      {' · '}{s.distance_meters}m uzakta
                    </div>
                  </div>
                  {s.is_winner ? (
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: 'rgba(34,197,94,0.2)', color: '#22c55e' }}>+{s.points_earned}p</span>
                  ) : s.status === 'pending' ? (
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308' }}>İnceleniyor</span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)' }}>Uzak</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
