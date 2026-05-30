import { unstable_cache } from 'next/cache';
import { createAdminClient } from './supabase/admin';

// Görevler — 60 saniye cache (tüm kullanıcılar için aynı)
export const getCachedQuests = unstable_cache(
  async () => {
    const admin = createAdminClient();
    const { data } = await admin
      .from('quests')
      .select('*, category:categories(*)')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100);
    return data || [];
  },
  ['quests-active'],
  { revalidate: 60, tags: ['quests'] }
);

// Kategoriler — 5 dakika cache
export const getCachedCategories = unstable_cache(
  async () => {
    const admin = createAdminClient();
    const { data } = await admin.from('categories').select('*');
    return data || [];
  },
  ['categories'],
  { revalidate: 300, tags: ['categories'] }
);

// Toplam kullanıcı sayısı — 5 dakika cache
export const getCachedUserCount = unstable_cache(
  async () => {
    const admin = createAdminClient();
    const { count } = await admin.from('profiles').select('id', { count: 'exact', head: true });
    return count || 0;
  },
  ['user-count'],
  { revalidate: 300, tags: ['user-count'] }
);

// Live locations — 15 saniye cache
export const getCachedLiveUsers = unstable_cache(
  async () => {
    const admin = createAdminClient();
    const { data } = await admin
      .from('live_locations')
      .select('user_id, latitude, longitude, profiles(username)')
      .limit(200);
    return (data || []).map((u) => {
      const raw = u as unknown as { user_id: string; latitude: number; longitude: number; profiles: { username: string } | { username: string }[] | null };
      const prof = Array.isArray(raw.profiles) ? raw.profiles[0] : raw.profiles;
      return { user_id: raw.user_id, latitude: raw.latitude, longitude: raw.longitude, username: prof?.username };
    });
  },
  ['live-locations'],
  { revalidate: 15, tags: ['live-locations'] }
);
