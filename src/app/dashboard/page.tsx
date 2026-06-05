import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import AppShell from '@/components/AppShell';
import NearbyUsers from '@/components/NearbyUsers';
import DashboardHome from './DashboardHome';
import { Quest, Category } from '@/types';
import { getCachedQuests, getCachedCategories, getCachedLiveUsers } from '@/lib/cache';

export const revalidate = 30;

async function fetchInitialPosts(userId: string) {
  const admin = createAdminClient();
  const { data: posts } = await admin
    .from('posts')
    .select('*, profiles(username, avatar_url), quests(title, photo_url, cash_reward)')
    .order('created_at', { ascending: false })
    .limit(20);
  if (!posts?.length) return [];
  const ids = posts.map((p: { id: string }) => p.id);
  const [likes, comments, myLikes] = await Promise.all([
    admin.from('post_likes').select('post_id').in('post_id', ids),
    admin.from('post_comments').select('post_id').in('post_id', ids),
    admin.from('post_likes').select('post_id').eq('user_id', userId).in('post_id', ids),
  ]);
  const likeCount: Record<string, number> = {};
  for (const r of likes.data || []) likeCount[r.post_id] = (likeCount[r.post_id] || 0) + 1;
  const commentCount: Record<string, number> = {};
  for (const r of comments.data || []) commentCount[r.post_id] = (commentCount[r.post_id] || 0) + 1;
  const likedSet = new Set((myLikes.data || []).map((r: { post_id: string }) => r.post_id));
  return posts.map((p: { id: string } & Record<string, unknown>) => ({
    ...p,
    like_count: likeCount[p.id] || 0,
    liked_by_me: likedSet.has(p.id),
    comment_count: commentCount[p.id] || 0,
  }));
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/dashboard');

  const [quests, categories, liveUsers, initialPosts] = await Promise.all([
    getCachedQuests(),
    getCachedCategories(),
    getCachedLiveUsers(),
    fetchInitialPosts(user.id),
  ]);

  const aside = (
    <div className="pt-2 space-y-4">
      <NearbyUsers liveUsers={liveUsers} />
    </div>
  );

  return (
    <AppShell aside={aside}>
      <DashboardHome quests={quests as Quest[]} categories={categories as Category[]} initialPosts={initialPosts} />
    </AppShell>
  );
}
