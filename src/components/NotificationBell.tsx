'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, UserPlus, MessageCircle, Target, X } from 'lucide-react';

interface Notif {
  counts: { friend_requests: number; unread_messages: number; active_quests: number; total: number };
  friend_requests: Array<{ id: string; from_user: { username: string } | { username: string }[] }>;
  unread_messages: Array<{ id: string; content: string; from_user: { id: string; username: string } | { id: string; username: string }[] }>;
  active_quests: Array<{ id: string; current_step: number; quests: { id: string; title: string } | { id: string; title: string }[] | null }>;
}

const pick = <T,>(x: T | T[] | null): T | null => (Array.isArray(x) ? x[0] : x) || null;

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Notif | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const json = await res.json();
        setTimeout(() => setData(json), 0);
      }
    } catch {}
  };

  useEffect(() => {
    void fetchData();
    const i = setInterval(() => void fetchData(), 15000);
    return () => clearInterval(i);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const count = data?.counts.total || 0;
  const card = { background: 'rgba(255,255,255,0.03)' };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors">
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center text-white border-2 border-black"
            style={{ background: '#ff3d00' }}>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-2xl overflow-hidden z-[100]"
          style={{ background: '#15151c', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Bildirimler</h3>
            <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white">
              <X size={14} />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {!data || count === 0 ? (
              <div className="p-8 text-center">
                <Bell size={28} className="text-white/10 mx-auto mb-2" />
                <p className="text-white/30 text-sm">Yeni bildirim yok</p>
              </div>
            ) : (
              <>
                {data.friend_requests.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-bold text-white/40 uppercase tracking-wider">Arkadaşlık İstekleri</div>
                    {data.friend_requests.map((r) => {
                      const u = pick(r.from_user);
                      return (
                        <Link key={r.id} href="/friends" onClick={() => setOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)' }}>
                            <UserPlus size={14} className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">@{u?.username}</p>
                            <p className="text-white/40 text-xs">arkadaş olmak istiyor</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {data.unread_messages.length > 0 && (
                  <div className="border-t border-white/5">
                    <div className="px-4 py-2 text-xs font-bold text-white/40 uppercase tracking-wider">Yeni Mesajlar</div>
                    {data.unread_messages.map((m) => {
                      const u = pick(m.from_user);
                      return (
                        <Link key={m.id} href={`/messages?with=${u?.id}`} onClick={() => setOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg,#22c55e,#10b981)' }}>
                            <MessageCircle size={14} className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">@{u?.username}</p>
                            <p className="text-white/40 text-xs truncate">{m.content}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {data.active_quests.length > 0 && (
                  <div className="border-t border-white/5">
                    <div className="px-4 py-2 text-xs font-bold text-white/40 uppercase tracking-wider">Devam Eden Görevler</div>
                    {data.active_quests.map((p) => {
                      const q = pick(p.quests);
                      return (
                        <Link key={p.id} href={`/quest/${q?.id}`} onClick={() => setOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
                            <Target size={14} className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{q?.title}</p>
                            <p className="text-white/40 text-xs">Adım {p.current_step} · Devam et →</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="border-t border-white/5 grid grid-cols-2">
            <Link href="/friends" onClick={() => setOpen(false)} className="px-4 py-2.5 text-xs text-center text-white/60 hover:bg-white/5 transition-colors">
              Arkadaşlar
            </Link>
            <Link href="/messages" onClick={() => setOpen(false)} className="px-4 py-2.5 text-xs text-center text-white/60 hover:bg-white/5 transition-colors border-l border-white/5">
              Mesajlar
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
