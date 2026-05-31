'use client';

import { useState } from 'react';
import { Copy, Share2, Check } from 'lucide-react';

export default function ReferralBox({ userId }: { userId: string }) {
  const code = userId.slice(0, 8);
  const link = `https://izibul.com/register?ref=${code}`;
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const text = `İzi Bul'u dene! Gizli konumları bul, ödül kazan 🗺️🎁\n${link}`;
    if (navigator.share) {
      await navigator.share({ title: 'İzi Bul\'a katıl', text, url: link }).catch(() => null);
    } else {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-4 my-4 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg,rgba(255,107,43,0.06),rgba(168,85,247,0.06))', border: '1px solid rgba(255,107,43,0.15)' }}>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🎁</span>
          <p className="font-black text-sm" style={{ color: '#0f1419' }}>Arkadaşını Davet Et</p>
        </div>
        <p className="text-xs mb-3" style={{ color: '#536471' }}>
          Arkadaşın bu linkle kayıt olursa ikisi de <span className="font-bold" style={{ color: '#ff6b2b' }}>+50 puan</span> kazanır!
        </p>

        {/* Link kutusu */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3" style={{ background: '#fff', border: '1px solid #eff3f4' }}>
          <p className="text-xs flex-1 truncate font-mono" style={{ color: '#536471' }}>{link}</p>
          <button onClick={copy} className="flex-shrink-0 p-1 rounded-lg transition-colors hover:bg-gray-100" style={{ color: copied ? '#22c55e' : '#536471' }}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>

        {/* Paylaş butonu */}
        <button
          onClick={share}
          className="w-full py-2.5 rounded-xl font-black text-white text-sm flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}
        >
          <Share2 size={15} /> Arkadaşlarına Gönder
        </button>
      </div>
    </div>
  );
}
