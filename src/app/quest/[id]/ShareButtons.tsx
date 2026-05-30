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

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(questUrl)}&size=200x200&bgcolor=111111&color=ffffff&margin=10`;

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
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p className="text-white/30 text-xs font-medium mb-3 uppercase tracking-wider">Paylaş</p>
      <div className="flex gap-2 flex-wrap">
        <button onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: 'rgba(255,107,43,0.15)', color: '#ff6b2b', border: '1px solid rgba(255,107,43,0.25)' }}>
          <Share2 size={14} /> Paylaş
        </button>

        <button onClick={copyLink}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'rgba(255,255,255,0.06)', color: copied ? '#22c55e' : 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {copied ? <><Check size={14} /> Kopyalandı</> : <><Copy size={14} /> Link Kopyala</>}
        </button>

        <button onClick={() => setShowQr(!showQr)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: showQr ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.06)', color: showQr ? '#a855f7' : 'rgba(255,255,255,0.6)', border: `1px solid ${showQr ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
          <QrCode size={14} /> QR Kod
        </button>
      </div>

      {showQr && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <div className="rounded-xl overflow-hidden p-2" style={{ background: '#111' }}>
            <img src={qrUrl} width={160} height={160} alt="QR Kod" />
          </div>
          <p className="text-white/20 text-xs">Telefona bastır veya ekran görüntüsü al</p>
        </div>
      )}
    </div>
  );
}
