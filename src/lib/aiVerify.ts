import Groq from 'groq-sdk';

export interface AIVerifyResult {
  match: number;      // 0-100
  accepted: boolean;  // match >= 70
  reasoning: string;
}

async function urlToBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

export async function verifyPhotoMatch(
  referencePhotoUrl: string,
  userPhotoUrl: string,
): Promise<AIVerifyResult> {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const [refB64, userB64] = await Promise.all([
      urlToBase64(referencePhotoUrl),
      urlToBase64(userPhotoUrl),
    ]);

    const response = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      max_tokens: 200,
      messages: [{
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
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${refB64}` } },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${userB64}` } },
        ],
      }],
    });

    const text = response.choices[0]?.message?.content?.trim() || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI geçersiz yanıt');

    const result = JSON.parse(jsonMatch[0]);
    const match = Math.max(0, Math.min(100, Number(result.match) || 0));

    return { match, accepted: match >= 70, reasoning: result.reason || '' };
  } catch {
    return { match: 0, accepted: false, reasoning: 'AI analizi başarısız, manuel incelemeye gönderildi' };
  }
}
