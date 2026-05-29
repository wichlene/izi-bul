import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MapPin, Trophy, Users, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/Header';
import QuestCard from '@/components/QuestCard';
import QuestList from '@/components/QuestList';
import { Quest, Category } from '@/types';

export const revalidate = 0;

async function getData() {
  try {
    const supabase = await createClient();
    const [questsRes, catsRes, statsRes] = await Promise.all([
      supabase.from('quests').select('*, category:categories(*)').eq('is_active', true).order('is_featured', { ascending: false }).order('created_at', { ascending: false }).limit(60),
      supabase.from('categories').select('*'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ]);
    return {
      quests: (questsRes.data as Quest[]) || [],
      categories: (catsRes.data as Category[]) || [],
      userCount: statsRes.count || 0,
    };
  } catch {
    return { quests: [], categories: [], userCount: 0 };
  }
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  const { quests, categories, userCount } = await getData();
  const featured = quests.filter((q) => q.is_featured);
  const regular = quests.filter((q) => !q.is_featured);

  return (
    <div className="min-h-screen" style={{ background: '#f7f8f8' }}>
      <Header />

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: '#ffffff', borderBottom: '1px solid #eff3f4' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,107,43,0.08) 0%, transparent 70%)' }} />

        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border" style={{ background: 'rgba(255,107,43,0.08)', color: '#ff6b2b', borderColor: 'rgba(255,107,43,0.2)' }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {quests.length} aktif görev · {userCount.toLocaleString('tr-TR')} oyuncu
          </div>

          <h1 className="text-5xl sm:text-7xl font-black mb-4 tracking-tight leading-none" style={{ color: '#0f1419' }}>
            Türkiye&apos;yi<br />
            <span style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Keşfet
            </span>
          </h1>
          <p className="text-xl max-w-2xl mx-auto mb-10" style={{ color: '#536471' }}>
            Fotoğrafa bak, konumu haritada bul, oraya git — nakit ödüller seni bekliyor.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/map" className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-white transition-all hover:opacity-90 hover:scale-105" style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}>
              <MapPin size={18} />
              Haritayı Aç
            </Link>
            <Link href="/register" className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold border transition-all hover:bg-gray-50" style={{ color: '#0f1419', borderColor: '#eff3f4' }}>
              Hemen Başla →
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-14">
            {[
              { icon: <MapPin size={18} />, val: quests.length + '+', label: 'Görev' },
              { icon: <Users size={18} />, val: userCount + '+', label: 'Oyuncu' },
              { icon: <Trophy size={18} />, val: '₺1000+', label: 'Ödül' },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl p-4 text-center" style={{ background: '#ffffff', border: '1px solid #eff3f4' }}>
                <div style={{ color: '#ff6b2b' }} className="flex justify-center mb-1">{s.icon}</div>
                <div className="text-xl font-black" style={{ color: '#0f1419' }}>{s.val}</div>
                <div className="text-xs" style={{ color: '#536471' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 pb-16 pt-10">

        {/* Öne Çıkan */}
        {featured.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <Star size={18} className="text-yellow-400" fill="currentColor" />
              <h2 className="text-lg font-bold" style={{ color: '#0f1419' }}>Öne Çıkan Görevler</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map((q) => <QuestCard key={q.id} quest={q} />)}
            </div>
          </section>
        )}

        {/* Filtreli görev listesi */}
        {regular.length === 0 && featured.length === 0 ? (
          <div className="text-center py-24 rounded-3xl" style={{ background: '#ffffff', border: '1px solid #eff3f4' }}>
            <div className="text-6xl mb-4">🗺️</div>
            <p className="mb-6" style={{ color: '#536471' }}>Henüz görev yok. İlk görevi sen ekle!</p>
            <Link href="/quest/create" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-white" style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}>
              Görev Ekle
            </Link>
          </div>
        ) : (
          <QuestList quests={regular} categories={categories} />
        )}
      </main>
    </div>
  );
}
