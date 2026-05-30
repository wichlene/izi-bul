import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AppShell from '@/components/AppShell';
import NearbyUsers from '@/components/NearbyUsers';
import DashboardHome from './DashboardHome';
import { Quest, Category } from '@/types';
import { getCachedQuests, getCachedCategories, getCachedLiveUsers } from '@/lib/cache';

export const revalidate = 30;

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/dashboard');

  const [quests, categories, liveUsers] = await Promise.all([
    getCachedQuests(),
    getCachedCategories(),
    getCachedLiveUsers(),
  ]);

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
