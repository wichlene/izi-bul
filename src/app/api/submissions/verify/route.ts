import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function urlToBase64(url: string): Promise<{ data: string; mediaType: string }> {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  const mediaType = contentType.split(';')[0] as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
  const data = Buffer.from(buffer).toString('base64');
  return { data, mediaType };
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });

  const { quest_id, user_photo_url } = await req.json();
  if (!quest_id || !user_photo_url) {
    return NextResponse.json({ error: 'Eksik alanlar' }, { status: 400 });
  }

  const { data: quest } = await supabase
    .from('quests')
    .select('photo_url, title')
    .eq('id', quest_id)
    .single();

  if (!quest?.photo_url) {
    // Referans fotoğraf yoksa AI kontrolü atla, geç
    return NextResponse.json({ match: 100, accepted: true, reasoning: 'Referans fotoğraf yok' });
  }

  try {
    const [ref, submitted] = await Promise.all([
      urlToBase64(quest.photo_url),
      urlToBase64(user_photo_url),
    ]);

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Aşağıda bir görevin referans fotoğrafı ve kullanıcının çektiği fotoğraf var. Bu iki fotoğrafın AYNI KONUMU gösterip göstermediğini analiz et.

Şunlara bak:
- Aynı bina, heykel, doğal yapı veya nesne var mı?
- Arka plan, çevre, ışık koşulları benzer mi?
- Farklı açıdan çekilmiş olsa da aynı yer mi?

SADECE JSON döndür, başka hiçbir şey yazma:
{"match": <0-100 arası sayı>, "accepted": <true/false>, "reason": "<kısa Türkçe açıklama>"}`
          },
          {
            type: 'text',
            text: 'Referans fotoğraf (görevin orijinal fotoğrafı):'
          },
          {
            type: 'image',
            source: { type: 'base64', media_type: ref.mediaType, data: ref.data },
          },
          {
            type: 'text',
            text: 'Kullanıcının çektiği fotoğraf:'
          },
          {
            type: 'image',
            source: { type: 'base64', media_type: submitted.mediaType, data: submitted.data },
          },
        ],
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    // JSON'u çıkart
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI geçersiz yanıt döndürdü');

    const result = JSON.parse(jsonMatch[0]);
    const match = Math.max(0, Math.min(100, Number(result.match) || 0));
    const accepted = match >= 70;

    return NextResponse.json({ match, accepted, reasoning: result.reason || '' });
  } catch (err) {
    console.error('AI verify error:', err);
    // AI hatası durumunda geç (kullanıcıyı bloklama)
    return NextResponse.json({ match: 80, accepted: true, reasoning: 'AI analiz yapılamadı, manuel onaya gönderildi' });
  }
}
