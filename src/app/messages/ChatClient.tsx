'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Message { id: string; from_user_id: string; to_user_id: string; content: string; created_at: string }
interface Friend { id: string; username: string }
interface ConvMeta { lastMsg: string; lastTime: string; unread: number; lastFrom: string }

interface Props {
  currentUserId: string;
  friends: Friend[];
  convMap: Record<string, ConvMeta>;
  initialMessages: Message[];
  chatWith: Friend | null;
}

function timeAgo(date: string): string {
  if (!date) return '';
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'şimdi';
  if (s < 3600) return `${Math.floor(s / 60)}dk`;
  if (s < 86400) return `${Math.floor(s / 3600)}sa`;
  return `${Math.floor(s / 86400)}g`;
}

export default function ChatClient({ currentUserId, friends, convMap, initialMessages, chatWith }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [liveConv, setLiveConv] = useState<Record<string, ConvMeta>>(convMap);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = useRef(createClient());

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // chatWith değişince initialMessages'tan güncelle
  useEffect(() => { setMessages(initialMessages); }, [chatWith?.id]); // eslint-disable-line

  useEffect(() => {
    if (!chatWith) return;
    const withId = chatWith.id;

    const addMsg = (msg: Message) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      // Sidebar önizlemesini canlı güncelle
      setLiveConv((prev) => ({
        ...prev,
        [msg.from_user_id === currentUserId ? msg.to_user_id : msg.from_user_id]: {
          lastMsg: msg.content,
          lastTime: msg.created_at,
          unread: msg.from_user_id === withId ? 0 : (prev[withId]?.unread || 0),
          lastFrom: msg.from_user_id,
        },
      }));
    };

    const channel = supabase.current
      .channel(`messages:${currentUserId}:${withId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `to_user_id=eq.${currentUserId}` },
        (payload) => { const msg = payload.new as Message; if (msg.from_user_id === withId) addMsg(msg); })
      .subscribe();

    const poll = () => {
      fetch(`/api/messages?with=${withId}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((data: Message[]) => {
          if (!Array.isArray(data)) return;
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            const fresh = data.filter((m) => !ids.has(m.id));
            return fresh.length ? [...prev, ...fresh] : prev;
          });
        })
        .catch(() => {});
    };
    const interval = setInterval(poll, 3500);

    return () => { supabase.current.removeChannel(channel); clearInterval(interval); };
  }, [chatWith, currentUserId]);

  const send = async () => {
    if (!input.trim() || !chatWith || sending) return;
    const text = input.trim();
    setSending(true); setSendError('');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_user_id: chatWith.id, content: text }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        setLiveConv((prev) => ({
          ...prev,
          [chatWith.id]: { lastMsg: text, lastTime: new Date().toISOString(), unread: 0, lastFrom: currentUserId },
        }));
        setInput('');
      } else {
        const e = await res.json().catch(() => ({}));
        setSendError(e.error || 'Mesaj gönderilemedi.');
      }
    } catch { setSendError('Bağlantı hatası, tekrar dene.'); }
    setSending(false);
  };

  return (
    <div className="flex" style={{ height: '100vh', background: '#ffffff' }}>

      {/* SOL — DM listesi (Instagram gibi) */}
      <div className="w-72 flex-shrink-0 flex flex-col" style={{ borderRight: '1px solid #eff3f4' }}>
        <div className="px-5 py-5" style={{ borderBottom: '1px solid #eff3f4' }}>
          <h1 className="text-xl font-black" style={{ color: '#0f1419' }}>Mesajlar</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {friends.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle size={32} className="mx-auto mb-3" style={{ color: '#eff3f4' }} />
              <p className="text-sm" style={{ color: '#536471' }}>Henüz arkadaşın yok</p>
            </div>
          ) : friends.map((f) => {
            const conv = liveConv[f.id];
            const isActive = chatWith?.id === f.id;
            const hasUnread = (conv?.unread || 0) > 0;
            const isMe = conv?.lastFrom === currentUserId;
            return (
              <button key={f.id}
                onClick={() => router.push(`/messages?with=${f.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left relative"
                style={isActive
                  ? { background: 'rgba(255,107,43,0.07)', borderLeft: '3px solid #ff6b2b' }
                  : { borderLeft: '3px solid transparent' }}>

                {/* Avatar + online dot */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-black text-white"
                    style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
                    {f.username.charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* İsim + son mesaj */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm truncate" style={{ color: '#0f1419', fontWeight: hasUnread ? 800 : 600 }}>
                      @{f.username}
                    </span>
                    {conv?.lastTime && (
                      <span className="text-xs flex-shrink-0" style={{ color: hasUnread ? '#ff6b2b' : '#8e8e8e' }}>
                        {timeAgo(conv.lastTime)}
                      </span>
                    )}
                  </div>
                  {conv?.lastMsg ? (
                    <p className="text-xs truncate mt-0.5" style={{ color: hasUnread ? '#0f1419' : '#536471', fontWeight: hasUnread ? 700 : 400 }}>
                      {isMe ? 'Sen: ' : ''}{conv.lastMsg}
                    </p>
                  ) : (
                    <p className="text-xs mt-0.5" style={{ color: '#c0c0c0' }}>Henüz mesaj yok</p>
                  )}
                </div>

                {/* Okunmamış badge */}
                {hasUnread && (
                  <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white"
                    style={{ background: '#ff6b2b' }}>
                    {conv.unread > 9 ? '9+' : conv.unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SAĞ — sohbet alanı */}
      <div className="flex-1 flex flex-col min-w-0">
        {!chatWith ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle size={56} className="mx-auto mb-4" style={{ color: '#eff3f4' }} />
              <p className="text-xl font-black mb-1" style={{ color: '#0f1419' }}>Mesajların</p>
              <p className="text-sm" style={{ color: '#536471' }}>Soldaki bir arkadaşını seç, konuşmaya başla.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid #eff3f4' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-black text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
                {chatWith.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold" style={{ color: '#0f1419' }}>@{chatWith.username}</p>
              </div>
            </div>

            {/* Mesajlar */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2" style={{ background: '#f7f8f8' }}>
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm" style={{ color: '#8e8e8e' }}>Henüz mesaj yok. İlk sen yaz!</p>
                </div>
              )}
              {messages.map((msg) => {
                const isMe = msg.from_user_id === currentUserId;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mr-2 self-end mb-0.5"
                        style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
                        {chatWith.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="max-w-[65%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                      style={isMe
                        ? { background: '#ff6b2b', color: '#fff', borderBottomRightRadius: 4 }
                        : { background: '#fff', color: '#0f1419', border: '1px solid #eff3f4', borderBottomLeftRadius: 4 }}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            {sendError && (
              <div className="px-4 py-2 text-xs text-center" style={{ background: '#fef2f2', color: '#ef4444' }}>
                {sendError}
              </div>
            )}
            <div className="px-4 py-3 flex gap-2 items-center" style={{ borderTop: '1px solid #eff3f4', background: '#fff' }}>
              <input value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder={`@${chatWith.username}'e mesaj...`}
                maxLength={500}
                className="flex-1 rounded-full px-5 py-2.5 text-sm focus:outline-none"
                style={{ background: '#f7f8f8', border: '1px solid #eff3f4', color: '#0f1419' }} />
              <button onClick={send} disabled={sending || !input.trim()}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 disabled:opacity-40 transition-all"
                style={{ background: '#ff6b2b' }}>
                <Send size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
