import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MapPin, Trophy, Users, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/Header';
import QuestCard from '@/components/QuestCard';
import QuestList from '@/components/QuestList';
import { Quest, Category } from '@/types';
import { getCachedQuests, getCachedCategories, getCachedUserCount } from '@/lib/cache';

export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  const [quests, categories, userCount] = await Promise.all([
    getCachedQuests(),
    getCachedCategories(),
    getCachedUserCount(),
  ]);
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
            <Link href="/register" className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-white transition-all hover:opacity-90 hover:scale-105" style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}>
              <MapPin size={18} />
              Hemen Başla
            </Link>
            <Link href="/login" className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold border transition-all hover:bg-gray-50" style={{ color: '#0f1419', borderColor: '#eff3f4' }}>
              Giriş Yap →
            </Link>
          </div>

          {/* APK İndir */}
          <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
            <a
              href="https://github.com/wichlene/izi-bul/releases/latest/download/izibul.apk"
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold border transition-all hover:bg-gray-50 text-sm"
              style={{ color: '#0f1419', borderColor: '#eff3f4', background: '#fff' }}
              download>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 15.3414C17.523 18.5796 14.9482 21.154 11.7103 21.154C8.4724 21.154 5.8976 18.5796 5.8976 15.3414C5.8976 13.8469 6.4908 12.4918 7.4482 11.4868L9.3073 9.6277C10.2647 8.6234 11.1384 7.7497 11.7103 7.1778C12.2822 7.7497 13.1559 8.6234 14.1133 9.6277L15.9724 11.4868C16.9298 12.4918 17.523 13.8469 17.523 15.3414Z"/><path d="M11.7103 3L11.7103 15.3414"/><path d="M8.5 12.1416L11.7103 15.3414L14.9206 12.1416" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
              Android APK İndir
            </a>
            <a
              href="/manifest.json"
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold border transition-all hover:bg-gray-50 text-sm"
              style={{ color: '#536471', borderColor: '#eff3f4', background: '#fff' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>
              PWA Olarak Yükle
            </a>
          </div>

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

      {/* Üye ol banner */}
      <div className="max-w-7xl mx-auto px-4 pt-8">
        <div className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap"
          style={{ background: 'rgba(255,107,43,0.06)', border: '1px solid rgba(255,107,43,0.15)' }}>
          <p className="text-sm font-semibold" style={{ color: '#ff6b2b' }}>
            🔒 Harita, konum, yorum ve beğeni için üye ol — ücretsiz!
          </p>
          <Link href="/register"
            className="px-4 py-2 rounded-full text-sm font-black text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
            Kayıt Ol
          </Link>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 pb-16 pt-6">
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

        {regular.length === 0 && featured.length === 0 ? (
          <div className="text-center py-24 rounded-3xl" style={{ background: '#ffffff', border: '1px solid #eff3f4' }}>
            <div className="text-6xl mb-4">🗺️</div>
            <p className="mb-6" style={{ color: '#536471' }}>Henüz görev yok.</p>
            <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-white" style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}>
              Kayıt Ol
            </Link>
          </div>
        ) : (
          <QuestList quests={regular} categories={categories} />
        )}
      </main>
    </div>
  );
}
