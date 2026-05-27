import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('quests')
    .select('*, category:categories(*)')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: 'Görev bulunamadı' }, { status: 404 });
  return NextResponse.json(data);
}
