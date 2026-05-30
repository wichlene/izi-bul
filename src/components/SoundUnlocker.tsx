'use client';

import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { unlockAudio } from '@/lib/sounds';

export default function SoundUnlocker() {
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  return (
    <button
      onClick={() => { unlockAudio(); setHidden(true); }}
      className="fixed bottom-20 right-4 z-[9999] flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-white shadow-lg md:bottom-6"
      style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
      <Volume2 size={13} /> Sesleri Aç
    </button>
  );
}
