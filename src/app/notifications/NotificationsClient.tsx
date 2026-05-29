'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, UserPlus, MessageCircle, Trophy, Heart, Target, Check } from 'lucide-react';


interface DBNotif {
  id: string;
  type: string;
  title: string;
  body?: string;
  actor_username?: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}
interface FriendReq { id: string; from_user: { id: string; username: string } | { id: string; username: string }[] }
interface UnreadMsg { id: string; content: string; from_user: { id: string; username: string } | { id: string; username: string }[] }

const pick = <T,>(x: T | T[] | null): T | null => (Array.isArray(x) ? x[0] : x) || null;

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}dk`;
  if (s < 86400) return `${Math.floor(s / 3600)}sa`;
  return `${Math.floor(s / 86400)}g`;
}

const ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  quest_complete: { icon: <Trophy size={18} />, color: '#22c55e' },
  good_deed:      { icon: <Heart size={18} />, color: '#ec4899' },
  friend_request: { icon: <UserPlus size={18} />, color: '#a855f7' },
  friend_accept:  { icon: <UserPlus size={18} />, color: '#22c55e' },
  message:        { icon: <MessageCircle size={18} />, color: '#ff6b2b' },
  info:           { icon: <Bell size={18} />, color: '#536471' },
};

export default function NotificationsClient() {
  const router = useRouter();
  const [data, setData] = useState<{
    friend_requests: FriendReq[];
    unread_messages: UnreadMsg[];
    notifications: DBNotif[];
  } | null>(null);

  useEffect(() => {
    fetch('/api/notifications').then(r => r.ok ? r.json() : null).then(d => d && setData(d));
  }, []);

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    setData(d => d ? { ...d, notifications: d.notifications.map(n => ({ ...n, is_read: true })) } : d);
  };

  const total = (data?.friend_requests.length || 0) + (data?.unread_messages.length || 0) + (data?.notifications.filter(n => !n.is_read).length || 0);

  return (
    <>
      <div className="sticky top-0 z-10 backdrop-blur-md px-4 py-4 flex items-center justify-between"
        style={{ background: 'rgba(255,255,255,0.92)', borderBottom: '1px solid #eff3f4' }}>
        <h1 className="text-xl font-black" style={{ color: '#0f1419' }}>
          Bildirimler {total > 0 && <span className="text-base font-normal ml-1" style={{ color: '#ff6b2b' }}>({total})</span>}
        </h1>
        {total > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(255,107,43,0.08)', color: '#ff6b2b' }}>
            <Check size={12} /> Tümünü okundu işaretle
          </button>
        )}
      </div>

      {!data ? (
        <div className="p-16 text-center"><Bell size={32} className="mx-auto mb-3 animate-pulse" style={{ color: '#eff3f4' }} /></div>
      ) : total === 0 ? (
        <div className="p-16 text-center">
          <Bell size={48} className="mx-auto mb-4" style={{ color: '#eff3f4' }} />
          <p className="text-xl font-black mb-1" style={{ color: '#0f1419' }}>Yeni bildirim yok</p>
          <p className="text-sm" style={{ color: '#536471' }}>Arkadaşların bir şey yapınca burada görürsün.</p>
        </div>
      ) : (
        <>
          {/* Arkadaşlık istekleri */}
          {data.friend_requests.length > 0 && (
            <section>
              <p className="px-4 pt-4 pb-2 text-xs font-bold uppercase tracking-widest" style={{ color: '#536471' }}>Arkadaşlık İstekleri</p>
              {data.friend_requests.map(r => {
                const u = pick(r.from_user);
                return (
                  <Link key={r.id} href="/friends"
                    className="flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors"
                    style={{ borderBottom: '1px solid #eff3f4' }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)' }}>
                      {u?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm" style={{ color: '#0f1419' }}>@{u?.username}</p>
                      <p className="text-sm" style={{ color: '#536471' }}>arkadaş olmak istiyor</p>
                    </div>
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: '#ff6b2b' }} />
                  </Link>
                );
              })}
            </section>
          )}

          {/* Okunmamış mesajlar */}
          {data.unread_messages.length > 0 && (
            <section>
              <p className="px-4 pt-4 pb-2 text-xs font-bold uppercase tracking-widest" style={{ color: '#536471' }}>Yeni Mesajlar</p>
              {data.unread_messages.map(m => {
                const u = pick(m.from_user);
                return (
                  <Link key={m.id} href={`/messages?with=${u?.id}`}
                    className="flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors"
                    style={{ borderBottom: '1px solid #eff3f4' }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
                      {u?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm" style={{ color: '#0f1419' }}>@{u?.username}</p>
                      <p className="text-sm truncate" style={{ color: '#536471' }}>{m.content}</p>
                    </div>
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: '#ff6b2b' }} />
                  </Link>
                );
              })}
            </section>
          )}

          {/* Aktivite bildirimleri */}
          {data.notifications.length > 0 && (
            <section>
              <p className="px-4 pt-4 pb-2 text-xs font-bold uppercase tracking-widest" style={{ color: '#536471' }}>Aktiviteler</p>
              {data.notifications.map(n => {
                const ic = ICONS[n.type] || ICONS.info;
                const content = (
                  <div className="flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors"
                    style={{ borderBottom: '1px solid #eff3f4', background: n.is_read ? undefined : 'rgba(255,107,43,0.03)' }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: ic.color + '18', color: ic.color }}>
                      {ic.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ color: '#0f1419' }}>{n.title}</p>
                      {n.body && <p className="text-sm truncate" style={{ color: '#536471' }}>{n.body}</p>}
                      <p className="text-xs mt-0.5" style={{ color: '#8e8e8e' }}>{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.is_read && <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: '#ff6b2b' }} />}
                  </div>
                );
                return n.link ? (
                  <Link key={n.id} href={n.link}>{content}</Link>
                ) : (
                  <div key={n.id}>{content}</div>
                );
              })}
            </section>
          )}
        </>
      )}
    </>
  );
}
