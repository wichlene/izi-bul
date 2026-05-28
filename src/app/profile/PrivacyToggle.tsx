'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  userId: string;
  field: string;
  value: boolean;
  onIcon: React.ReactNode;
  offIcon: React.ReactNode;
}

export default function PrivacyToggle({ userId, field, value, onIcon, offIcon }: Props) {
  const [enabled, setEnabled] = useState(value);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    const next = !enabled;
    setEnabled(next);
    const supabase = createClient();
    await supabase.from('profiles').update({ [field]: next }).eq('id', userId);
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
      style={enabled
        ? { background: 'rgba(255,107,43,0.2)', color: '#ff6b2b' }
        : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }
      }
    >
      {enabled ? onIcon : offIcon}
      {enabled ? 'Açık' : 'Kapalı'}
    </button>
  );
}
