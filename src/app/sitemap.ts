import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://izibul.com';

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/dashboard`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/map`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/good-deed`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${base}/leaderboard`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.6 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ];

  try {
    const supabase = await createClient();
    const { data: quests } = await supabase
      .from('quests')
      .select('id, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(200);

    const questPages: MetadataRoute.Sitemap = (quests || []).map((q) => ({
      url: `${base}/quest/${q.id}`,
      lastModified: new Date(q.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    return [...staticPages, ...questPages];
  } catch {
    return staticPages;
  }
}
