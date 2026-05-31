'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function ReferralBox({ userId }: { userId: string }) {
  const code = userId.slice(0, 8);
  const link = `https://izibul.com/register?ref=${code}`;
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding: '10px 16px', borderBottom: '1px solid #eff3f4', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>🎁</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#0f1419', marginBottom: 1 }}>Arkadaşını davet et, ikisi de +50p</p>
        <p style={{ fontSize: 11, color: '#8e9aab', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link}</p>
      </div>
      <button onClick={copy} style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 8, background: '#f3f4f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: copied ? '#22c55e' : '#536471' }}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  );
}
