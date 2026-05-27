import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: 'Challenge bulunamadı' }, { status: 404 });
  return NextResponse.json(data);
}
