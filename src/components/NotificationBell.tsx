'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';

export default function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const json = await res.json();
          setTimeout(() => setCount(json.counts?.total || 0), 0);
        }
      } catch {}
    };
    fetchCount();
    const i = setInterval(fetchCount, 15000);
    return () => clearInterval(i);
  }, []);

  return (
    <span className="relative flex items-center justify-center" style={{ color: '#0f1419' }}>
      <Bell size={26} />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center text-white"
          style={{ background: '#ff6b2b' }}>
          {count > 9 ? '9+' : count}
        </span>
      )}
    </span>
  );
}
