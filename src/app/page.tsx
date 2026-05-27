import Link from 'next/link';
import { Trophy, Search, Map as MapIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/Header';
import QuestCard from '@/components/QuestCard';
import { Quest, Category } from '@/types';
import QuestFilters from '@/components/QuestFilters';

export const revalidate = 0;

async function getQuests(): Promise<Quest[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('quests')
      .select('*, category:categories(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(60);
    return (data as Quest[]) || [];
  } catch {
    return [];
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('categories').select('*');
    return data || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [quests, categories] = await Promise.all([getQuests(), getCategories()]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-14 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <Trophy size={14} />
            Türkiye&apos;nin keşif oyunu
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-3">
            Türkiye&apos;yi keşfet, ödülü kap!
          </h1>
          <p className="text-orange-100 text-lg max-w-2xl mx-auto mb-8">
            Köprüler, camiler, heykeller, gizli noktalar... Fotoğrafa bak, haritada bul,
            git ve çek — puanlar ve nakit ödüller seni bekliyor.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {[
              { icon: <Search size={20} />, num: '1', label: 'Görevi seç' },
              { icon: <MapIcon size={20} />, num: '2', label: 'Konumu bul' },
              { icon: '📸', num: '3', label: 'Fotoğraf çek' },
              { icon: <Trophy size={20} />, num: '4', label: 'Ödülü kap' },
            ].map((step, i) => (
              <div key={i} className="bg-white/15 backdrop-blur rounded-2xl p-4">
                <div className="text-2xl mb-1 flex justify-center items-center h-8">{step.icon}</div>
                <div className="text-xs text-orange-200 font-medium">ADIM {step.num}</div>
                <div className="text-sm font-semibold">{step.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <QuestFilters categories={categories} />

        <div className="flex items-center justify-between mb-6 mt-2">
          <h2 className="text-xl font-bold text-gray-900">
            Aktif Görevler
            <span className="ml-2 bg-orange-100 text-orange-600 text-sm font-semibold px-2.5 py-0.5 rounded-full">
              {quests.length}
            </span>
          </h2>
        </div>

        {quests.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Henüz aktif görev yok</h3>
            <p className="text-gray-400 mb-6">İlk görevi sen ekle!</p>
            <Link
              href="/quest/create"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-3 rounded-xl transition-colors"
            >
              Görev Ekle
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {quests.map((quest) => (
              <QuestCard key={quest.id} quest={quest} />
            ))}
          </div>
        )}
      </main>

      <footer className="mt-12 border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-gray-400 text-sm">
          © 2026 İzi Bul · Türkiye&apos;yi keşfet
        </div>
      </footer>
    </div>
  );
}
