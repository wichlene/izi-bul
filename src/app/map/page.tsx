import { createClient } from '@/lib/supabase/server';
import Header from '@/components/Header';
import MapView from './MapView';
import { Quest } from '@/types';

export const revalidate = 0;

export default async function MapPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: quests } = await supabase
    .from('quests')
    .select('*, category:categories(*)')
    .eq('is_active', true);

  const { data: liveUsers } = await supabase
    .from('live_locations')
    .select('user_id, latitude, longitude, profiles(username)')
    .limit(100);

  const mapped = (liveUsers || []).map((u) => {
    const raw = u as unknown as { user_id: string; latitude: number; longitude: number; profiles: { username: string } | { username: string }[] | null };
    const prof = Array.isArray(raw.profiles) ? raw.profiles[0] : raw.profiles;
    return { user_id: raw.user_id, latitude: raw.latitude, longitude: raw.longitude, username: prof?.username };
  });

  return (
    <div className="h-screen flex flex-col" style={{ background: '#0a0a0f' }}>
      <Header />
      <div className="flex-1 relative">
        <MapView initialQuests={(quests as Quest[]) || []} userId={user?.id} />

        {/* Overlay info */}
        <div className="absolute top-4 left-4 z-[1000]">
          <div className="rounded-2xl px-4 py-3 border border-white/10" style={{ background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(12px)' }}>
            <div className="text-white font-bold text-sm mb-1">🗺️ Türkiye Haritası</div>
            <div className="text-white/40 text-xs">{quests?.length || 0} aktif görev</div>
            <div className="text-green-400 text-xs flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {mapped.length} oyuncu online
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
