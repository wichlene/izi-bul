import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AppShell from '@/components/AppShell';
import NearbyUsers from '@/components/NearbyUsers';
import DashboardHome from './DashboardHome';
import { Quest, Category } from '@/types';

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/dashboard');

  const [questsRes, catsRes, liveRes] = await Promise.all([
    supabase.from('quests')
      .select('*, category:categories(*)')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('categories').select('*'),
    supabase.from('live_locations')
      .select('user_id, latitude, longitude, profiles(username)')
      .limit(200),
  ]);

  const quests = (questsRes.data as Quest[]) || [];
  const categories = (catsRes.data as Category[]) || [];
  const liveUsers = (liveRes.data || []).map((u) => {
    const raw = u as unknown as { user_id: string; latitude: number; longitude: number; profiles: { username: string } | { username: string }[] | null };
    const prof = Array.isArray(raw.profiles) ? raw.profiles[0] : raw.profiles;
    return { user_id: raw.user_id, latitude: raw.latitude, longitude: raw.longitude, username: prof?.username };
  });

  const aside = (
    <div className="pt-2 space-y-4">
      <NearbyUsers liveUsers={liveUsers} />
    </div>
  );

  return (
    <AppShell aside={aside}>
      <DashboardHome quests={quests} categories={categories} />
    </AppShell>
  );
}
