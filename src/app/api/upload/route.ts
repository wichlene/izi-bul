import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });

  // Rate limit: kullanıcı başına 20 upload / saat
  if (!checkRateLimit(`upload:${user.id}`, 20, 60 * 60_000)) {
    return NextResponse.json({ error: 'Çok fazla yükleme. Bir saat bekle.' }, { status: 429 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) return NextResponse.json({ error: 'Dosya yok' }, { status: 400 });

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Sadece JPG, PNG veya WebP yüklenebilir' }, { status: 400 });
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'Dosya 10MB\'dan büyük olamaz' }, { status: 400 });
  }

  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage
    .from('quest-photos')
    .upload(fileName, file, { contentType: file.type });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage
    .from('quest-photos')
    .getPublicUrl(data.path);

  return NextResponse.json({ url: publicUrl });
}
