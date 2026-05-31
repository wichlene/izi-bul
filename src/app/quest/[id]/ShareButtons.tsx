'use client';

import { useState } from 'react';
import { Share2, QrCode, Copy, Check } from 'lucide-react';

interface Props {
  questTitle: string;
  questUrl: string;
  questDescription?: string;
}

export default function ShareButtons({ questTitle, questUrl, questDescription }: Props) {
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareText = `🗺️ "${questTitle}" — İzi Bul'da bu gizemi çözebilir misin?\n${questDescription ? questDescription + '\n' : ''}Görevi kabul et: ${questUrl}`;

  // QR kodu beyaz arka plan, koyu metin (okunabilir)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(questUrl)}&size=200x200&bgcolor=ffffff&color=0f1419&margin=10`;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: questTitle, text: shareText, url: questUrl });
    } else {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(questUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid #eff3f4' }}>
      <p className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: '#536471' }}>Paylaş</p>
      <div className="flex gap-2 flex-wrap">
        <button onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
          style={{ background: 'rgba(255,107,43,0.1)', color: '#ff6b2b', border: '1px solid rgba(255,107,43,0.2)' }}>
          <Share2 size={14} /> Paylaş
        </button>

        <button onClick={copyLink}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: '#f7f8f8', color: copied ? '#22c55e' : '#536471', border: '1px solid #eff3f4' }}>
          {copied ? <><Check size={14} /> Kopyalandı</> : <><Copy size={14} /> Link Kopyala</>}
        </button>

        <button onClick={() => setShowQr(!showQr)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: showQr ? 'rgba(168,85,247,0.1)' : '#f7f8f8',
            color: showQr ? '#a855f7' : '#536471',
            border: `1px solid ${showQr ? 'rgba(168,85,247,0.2)' : '#eff3f4'}`,
          }}>
          <QrCode size={14} /> QR Kod
        </button>
      </div>

      {showQr && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <div className="rounded-xl overflow-hidden p-3" style={{ background: '#f7f8f8', border: '1px solid #eff3f4' }}>
            <img src={qrUrl} width={160} height={160} alt="QR Kod" />
          </div>
          <p className="text-xs" style={{ color: '#8e8e8e' }}>Ekran görüntüsü al veya bastır</p>
        </div>
      )}
    </div>
  );
}
