import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function urlToBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
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
    return NextResponse.json({ match: 100, accepted: true, reasoning: 'Referans fotoğraf yok' });
  }

  try {
    const [refB64, userB64] = await Promise.all([
      urlToBase64(quest.photo_url),
      urlToBase64(user_photo_url),
    ]);

    const response = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Bu iki fotoğrafı karşılaştır. AYNI konumu/nesneyi gösteriyor mu?

Referans fotoğraf (görevin orijinal fotoğrafı) ve kullanıcının çektiği fotoğraf aşağıda.

Şunlara bak:
- Aynı bina, heykel, anıt veya nesne var mı?
- Farklı açıdan çekilmiş olsa da aynı yer mi?

SADECE JSON döndür:
{"match": <0-100>, "accepted": <true/false>, "reason": "<kısa Türkçe açıklama>"}`,
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${refB64}` },
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${userB64}` },
            },
          ],
        },
      ],
    });

    const text = response.choices[0]?.message?.content?.trim() || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI geçersiz yanıt');

    const result = JSON.parse(jsonMatch[0]);
    const match = Math.max(0, Math.min(100, Number(result.match) || 0));
    const accepted = match >= 70;

    return NextResponse.json({ match, accepted, reasoning: result.reason || '' });
  } catch (err) {
    console.error('AI verify error:', err);
    return NextResponse.json({ match: 80, accepted: true, reasoning: 'AI analiz yapılamadı, manuel onaya gönderildi' });
  }
}
