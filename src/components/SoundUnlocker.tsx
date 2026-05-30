'use client';

import { useEffect } from 'react';
import { unlockAudio } from '@/lib/sounds';

export default function SoundUnlocker() {
  useEffect(() => {
    const unlock = () => unlockAudio();
    document.addEventListener('click', unlock, { once: true, passive: true });
    document.addEventListener('touchstart', unlock, { once: true, passive: true });
    document.addEventListener('keydown', unlock, { once: true, passive: true });
    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('keydown', unlock);
    };
  }, []);

  return null;
}
