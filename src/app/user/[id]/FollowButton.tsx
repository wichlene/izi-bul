'use client';

import { useState } from 'react';
import { UserPlus, UserCheck } from 'lucide-react';

interface Props { userId: string; targetId: string; initialFollowing: boolean }

export default function FollowButton({ userId, targetId, initialFollowing }: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    if (following) {
      await fetch('/api/friends', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friend_id: targetId }),
      });
      setFollowing(false);
    } else {
      await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friend_id: targetId }),
      });
      setFollowing(true);
    }
    setBusy(false);
  };

  return (
    <button onClick={toggle} disabled={busy}
      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all disabled:opacity-50"
      style={following
        ? { background: '#f7f8f8', color: '#536471', border: '1px solid #eff3f4' }
        : { background: '#ff6b2b', color: '#fff' }}>
      {following ? <><UserCheck size={15} /> Takip Ediliyor</> : <><UserPlus size={15} /> Takip Et</>}
    </button>
  );
}
