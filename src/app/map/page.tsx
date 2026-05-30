import Header from '@/components/Header';
import MapView from './MapView';
import { Quest } from '@/types';
import { getCachedQuests, getCachedLiveUsers } from '@/lib/cache';

export const revalidate = 10;

export default async function MapPage() {
  const [quests, mapped] = await Promise.all([
    getCachedQuests(),
    getCachedLiveUsers(),
  ]);

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 relative overflow-hidden">
        <MapView
          initialQuests={quests as Quest[]}
          initialLiveUsers={mapped}
          questCount={quests.length}
        />

        {/* Konum paylaşım pill — alt orta */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="rounded-full px-4 py-2 text-xs font-medium shadow-lg flex items-center gap-2"
            style={{ background: '#ffffff', border: '1px solid #eff3f4', color: '#536471' }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Konumun haritada paylaşılıyor
          </div>
        </div>
      </div>
    </div>
  );
}
