import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('quests')
    .select('id, title, photo_url, difficulty, points, cash_reward, total_solved, region')
    .eq('is_featured', true)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) return NextResponse.json(null);
  return NextResponse.json(data);
}
