import { createClient } from '@/lib/supabase/server';
import Header from '@/components/Header';
import MapView from './MapView';
import { Quest } from '@/types';

export const revalidate = 0;

export default async function MapPage() {
  const supabase = await createClient();

  const { data: quests } = await supabase
    .from('quests')
    .select('*, category:categories(*)')
    .eq('is_active', true);

  const { data: liveUsers } = await supabase
    .from('live_locations')
    .select('user_id, latitude, longitude, profiles(username)')
    .limit(200);

  const mapped = (liveUsers || []).map((u) => {
    const raw = u as unknown as { user_id: string; latitude: number; longitude: number; profiles: { username: string } | { username: string }[] | null };
    const prof = Array.isArray(raw.profiles) ? raw.profiles[0] : raw.profiles;
    return { user_id: raw.user_id, latitude: raw.latitude, longitude: raw.longitude, username: prof?.username };
  });

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 relative overflow-hidden">
        <MapView
          initialQuests={(quests as Quest[]) || []}
          initialLiveUsers={mapped}
          questCount={quests?.length || 0}
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
