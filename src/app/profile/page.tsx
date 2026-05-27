import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Target, Award, MapPin, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/Header';
import { Quest, Submission } from '@/types';
import { formatDistance } from '@/lib/distance';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

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
    .select('*, quest:quests(id, title, photo_url, category:categories(*))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const wonCount = submissions?.filter((s) => s.is_winner).length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Profil kartı */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 text-white mb-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
              {profile?.username?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {profile?.full_name || profile?.username}
              </h1>
              <p className="text-orange-100">@{profile?.username}</p>
              {profile?.city && (
                <p className="text-orange-200 text-sm flex items-center gap-1 mt-1">
                  <MapPin size={12} /> {profile.city}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-white/15 rounded-2xl p-3 text-center backdrop-blur">
              <Trophy size={20} className="mx-auto mb-1" />
              <div className="text-2xl font-bold">{profile?.total_points || 0}</div>
              <div className="text-xs text-orange-100">Puan</div>
            </div>
            <div className="bg-white/15 rounded-2xl p-3 text-center backdrop-blur">
              <Target size={20} className="mx-auto mb-1" />
              <div className="text-2xl font-bold">{profile?.total_finds || 0}</div>
              <div className="text-xs text-orange-100">Çözülen</div>
            </div>
            <div className="bg-white/15 rounded-2xl p-3 text-center backdrop-blur">
              <Award size={20} className="mx-auto mb-1" />
              <div className="text-2xl font-bold">Lv {profile?.level || 1}</div>
              <div className="text-xs text-orange-100">Seviye</div>
            </div>
          </div>
        </div>

        {/* Submission geçmişi */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={18} />
            Geçmiş ({submissions?.length || 0})
          </h2>

          {!submissions || submissions.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="mb-3">Henüz hiç görev denemedin.</p>
              <Link
                href="/"
                className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
              >
                Görevlere Göz At
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {(submissions as unknown as (Submission & { quest: Quest })[]).map((s) => (
                <Link
                  key={s.id}
                  href={`/quest/${s.quest.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <img
                    src={s.quest.photo_url}
                    alt={s.quest.title}
                    className="w-14 h-14 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{s.quest.title}</div>
                    <div className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: tr })}
                      {' · '}
                      {formatDistance(s.distance_meters)} uzakta
                    </div>
                  </div>
                  <div>
                    {s.is_winner ? (
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                        +{s.points_earned}p
                      </span>
                    ) : s.status === 'pending' ? (
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
                        İnceleniyor
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-full">
                        Uzak
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {wonCount > 0 && (
          <p className="text-center text-gray-400 text-sm mt-4">
            Toplam {wonCount} görevi başarıyla çözdün 🎉
          </p>
        )}
      </main>
    </div>
  );
}
