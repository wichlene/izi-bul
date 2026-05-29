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
    .limit(200);

  const mapped = (liveUsers || []).map((u) => {
    const raw = u as unknown as { user_id: string; latitude: number; longitude: number; profiles: { username: string } | { username: string }[] | null };
    const prof = Array.isArray(raw.profiles) ? raw.profiles[0] : raw.profiles;
    return { user_id: raw.user_id, latitude: raw.latitude, longitude: raw.longitude, username: prof?.username };
  });

  return (
    <div className="h-screen flex flex-col" style={{ background: '#f7f8f8' }}>
      <Header />
      <div className="flex-1 relative">
        <MapView initialQuests={(quests as Quest[]) || []} initialLiveUsers={mapped} userId={user?.id} />

        {/* Overlay info — light card */}
        <div className="absolute top-4 left-4 z-[1000]">
          <div className="rounded-2xl px-4 py-3 shadow-lg" style={{ background: '#ffffff', border: '1px solid #eff3f4' }}>
            <div className="font-bold text-sm mb-1" style={{ color: '#0f1419' }}>🗺️ Türkiye Haritası</div>
            <div className="text-xs" style={{ color: '#536471' }}>{quests?.length || 0} aktif görev</div>
            <div className="text-xs flex items-center gap-1 mt-0.5" style={{ color: '#22c55e' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
              {mapped.length} oyuncu online
            </div>
          </div>
        </div>

        {/* Konum paylaşım uyarısı — eğer kullanıcı giriş yaptıysa */}
        {user && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
            <div className="rounded-full px-4 py-2 text-xs font-medium shadow-lg flex items-center gap-2"
              style={{ background: '#ffffff', border: '1px solid #eff3f4', color: '#536471' }}>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Konumun haritada paylaşılıyor
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
