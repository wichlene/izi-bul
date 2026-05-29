'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Message { id: string; from_user_id: string; to_user_id: string; content: string; created_at: string }
interface Friend { id: string; username: string }

interface Props {
  currentUserId: string;
  friends: Friend[];
  initialMessages: Message[];
  chatWith: Friend | null;
}

export default function ChatClient({ currentUserId, friends, initialMessages, chatWith }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = useRef(createClient());

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!chatWith) return;
    const withId = chatWith.id;

    // Tekrarı önleyerek mesaj ekle
    const addMsg = (msg: Message) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    };

    // 1) Realtime (açıksa anında gelir)
    const channel = supabase.current
      .channel(`messages:${currentUserId}:${withId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `to_user_id=eq.${currentUserId}`,
      }, (payload) => {
        const msg = payload.new as Message;
        if (msg.from_user_id === withId) addMsg(msg);
      })
      .subscribe();

    // 2) Polling fallback (Realtime kapalı olsa bile mesajlar gelsin)
    const poll = () => {
      fetch(`/api/messages?with=${withId}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((data: Message[]) => {
          if (Array.isArray(data)) {
            setMessages((prev) => {
              const ids = new Set(prev.map((m) => m.id));
              const fresh = data.filter((m) => !ids.has(m.id));
              return fresh.length ? [...prev, ...fresh] : prev;
            });
          }
        })
        .catch(() => {});
    };
    const interval = setInterval(poll, 3500);

    return () => {
      supabase.current.removeChannel(channel);
      clearInterval(interval);
    };
  }, [chatWith, currentUserId]);

  const send = async () => {
    if (!input.trim() || !chatWith || sending) return;
    setSending(true);
    setSendError('');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_user_id: chatWith.id, content: input.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        setInput('');
      } else {
        const err = await res.json().catch(() => ({}));
        setSendError(err.error || 'Mesaj gönderilemedi.');
      }
    } catch {
      setSendError('Bağlantı hatası, tekrar dene.');
    }
    setSending(false);
  };

  return (
    <div className="max-w-5xl mx-auto flex h-[calc(100vh-64px)]" style={{ background: '#f7f8f8' }}>
      {/* Sidebar - arkadaş listesi */}
      <div className="w-64 flex flex-col" style={{ background: '#ffffff', borderRight: '1px solid #eff3f4' }}>
        <div className="px-4 py-4" style={{ borderBottom: '1px solid #eff3f4' }}>
          <h2 className="font-bold text-sm" style={{ color: '#0f1419' }}>Mesajlar</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {friends.length === 0 ? (
            <div className="p-6 text-center text-xs" style={{ color: '#536471' }}>Arkadaş yok</div>
          ) : friends.map((f) => (
            <button key={f.id} onClick={() => router.push(`/messages?with=${f.id}`)}
              className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
              style={chatWith?.id === f.id
                ? { background: 'rgba(255,107,43,0.08)', borderLeft: '3px solid #ff6b2b' }
                : { background: 'transparent' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white" style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}>
                {f.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium" style={{ color: chatWith?.id === f.id ? '#ff6b2b' : '#0f1419' }}>@{f.username}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mesaj alanı */}
      <div className="flex-1 flex flex-col" style={{ background: '#ffffff' }}>
        {!chatWith ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle size={40} className="mx-auto mb-3" style={{ color: '#eff3f4' }} />
              <p style={{ color: '#536471' }}>Bir arkadaşını seç</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid #eff3f4' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}>
                {chatWith.username.charAt(0).toUpperCase()}
              </div>
              <span className="font-semibold" style={{ color: '#0f1419' }}>@{chatWith.username}</span>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ background: '#f7f8f8' }}>
              {messages.map((msg) => {
                const isMe = msg.from_user_id === currentUserId;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-xs px-4 py-2.5 rounded-2xl text-sm"
                      style={isMe
                        ? { background: '#ff6b2b', color: '#ffffff' }
                        : { background: '#ffffff', color: '#0f1419', border: '1px solid #eff3f4' }
                      }>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {sendError && (
              <div className="px-4 py-2 text-xs text-center" style={{ background: '#fef2f2', color: '#ef4444' }}>{sendError}</div>
            )}
            <div className="px-4 py-3 flex gap-3" style={{ borderTop: '1px solid #eff3f4', background: '#ffffff' }}>
              <input value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Mesajını yaz..."
                maxLength={500}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                style={{ background: '#f7f8f8', border: '1px solid #eff3f4', color: '#0f1419' }} />
              <button onClick={send} disabled={sending || !input.trim()}
                className="px-4 py-2.5 rounded-xl text-white transition-all"
                style={{ background: input.trim() ? '#ff6b2b' : '#eff3f4', color: input.trim() ? '#ffffff' : '#536471' }}>
                <Send size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
