'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { playNotification } from '@/lib/sounds';
import { createClient } from '@/lib/supabase/client';

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const prevCount = useRef(-1);

  const fetchCount = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const json = await res.json();
      const total = json.counts?.total || 0;
      if (prevCount.current !== -1 && total > prevCount.current) {
        playNotification();
      }
      prevCount.current = total;
      setCount(total);
    } catch {}
  };

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      // İlk yükleme + Realtime kanalı — hepsi async callback içinde
      fetchCount();
      if (!user) return;

      channel = supabase
        .channel('notif-bell')
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, fetchCount)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'messages',
          filter: `to_user_id=eq.${user.id}`,
        }, fetchCount)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'friend_requests',
          filter: `to_user_id=eq.${user.id}`,
        }, fetchCount)
        .subscribe();
    });

    const onFocus = () => fetchCount();
    window.addEventListener('focus', onFocus);

    return () => {
      if (channel) supabase.removeChannel(channel);
      window.removeEventListener('focus', onFocus);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
