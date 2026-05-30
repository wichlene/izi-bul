'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send, MessageCircle, ArrowLeft } from 'lucide-react';
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
  // Mobilde 'list' veya 'chat' görünümü
  const [mobileView, setMobileView] = useState<'list' | 'chat'>(chatWith ? 'chat' : 'list');
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = useRef(createClient());

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    setMessages(initialMessages);
    if (chatWith) setMobileView('chat');
    else setMobileView('list');
  }, [chatWith?.id]); // eslint-disable-line

  useEffect(() => {
    if (!chatWith) return;
    const withId = chatWith.id;

    const addMsg = (msg: Message) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
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
  }, [chatWith?.id, currentUserId]); // eslint-disable-line

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

  const selectFriend = (f: Friend) => {
    router.push(`/messages?with=${f.id}`);
    setMobileView('chat');
  };

  const goBack = () => {
    router.push('/messages');
    setMobileView('list');
  };

  return (
    // Mobilde alt nav (56px) çıkar; md+'da bottom nav yok, tam ekran
    <div className="flex overflow-hidden h-[calc(100dvh-56px)] md:h-screen"
      style={{ background: '#ffffff' }}>


      {/* KONUŞMA LİSTESİ — mobilde mobileView==='list' iken tam ekran */}
      <div className={[
        'flex-col flex-shrink-0 border-r',
        // Mobilde: 'list' görünümündeyse tam genişlik, değilse gizle
        mobileView === 'chat' ? 'hidden md:flex' : 'flex',
        // Masaüstünde sabit genişlik
        'w-full md:w-80',
      ].join(' ')}
        style={{ borderColor: '#eff3f4', background: '#fff' }}>

        {/* Header */}
        <div className="px-5 py-5 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: '1px solid #eff3f4' }}>
          <h1 className="text-xl font-black" style={{ color: '#0f1419' }}>Mesajlar</h1>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto">
          {friends.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle size={40} className="mx-auto mb-3" style={{ color: '#eff3f4' }} />
              <p className="text-base font-semibold" style={{ color: '#0f1419' }}>Henüz arkadaşın yok</p>
              <p className="text-sm mt-1" style={{ color: '#536471' }}>Arkadaş ekleyerek mesajlaşmaya başla</p>
            </div>
          ) : friends.map((f) => {
            const conv = liveConv[f.id];
            const isActive = chatWith?.id === f.id;
            const hasUnread = (conv?.unread || 0) > 0;
            const isMe = conv?.lastFrom === currentUserId;
            return (
              <button key={f.id}
                onClick={() => selectFriend(f)}
                className="w-full flex items-center gap-3 px-4 py-4 transition-colors text-left hover:bg-gray-50"
                style={isActive ? { background: 'rgba(255,107,43,0.06)' } : {}}>

                <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-black text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
                  {f.username.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base truncate" style={{ color: '#0f1419', fontWeight: hasUnread ? 800 : 600 }}>
                      @{f.username}
                    </span>
                    {conv?.lastTime && (
                      <span className="text-xs flex-shrink-0" style={{ color: hasUnread ? '#ff6b2b' : '#8e8e8e' }}>
                        {timeAgo(conv.lastTime)}
                      </span>
                    )}
                  </div>
                  {conv?.lastMsg ? (
                    <p className="text-sm truncate mt-0.5" style={{ color: hasUnread ? '#0f1419' : '#536471', fontWeight: hasUnread ? 700 : 400 }}>
                      {isMe ? 'Sen: ' : ''}{conv.lastMsg}
                    </p>
                  ) : (
                    <p className="text-sm mt-0.5" style={{ color: '#c0c0c0' }}>Henüz mesaj yok</p>
                  )}
                </div>

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

      {/* SOHBET ALANI — mobilde mobileView==='chat' iken tam ekran */}
      <div className={[
        'flex-col flex-1 min-w-0',
        mobileView === 'list' ? 'hidden md:flex' : 'flex',
      ].join(' ')}>

        {!chatWith ? (
          // Masaüstünde boş state
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle size={56} className="mx-auto mb-4" style={{ color: '#eff3f4' }} />
              <p className="text-xl font-black mb-1" style={{ color: '#0f1419' }}>Mesajların</p>
              <p className="text-sm" style={{ color: '#536471' }}>Soldaki bir arkadaşını seç, konuşmaya başla.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Sohbet header — mobilde geri butonu */}
            <div className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
              style={{ borderBottom: '1px solid #eff3f4', background: '#fff' }}>
              <button onClick={goBack}
                className="md:hidden p-2 -ml-1 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                style={{ color: '#0f1419' }}>
                <ArrowLeft size={22} />
              </button>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-black text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
                {chatWith.username.charAt(0).toUpperCase()}
              </div>
              <p className="font-bold text-base" style={{ color: '#0f1419' }}>@{chatWith.username}</p>
            </div>

            {/* Mesajlar */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2" style={{ background: '#f7f8f8' }}>
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
                    <div className="max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
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

            {sendError && (
              <div className="px-4 py-2 text-xs text-center flex-shrink-0" style={{ background: '#fef2f2', color: '#ef4444' }}>
                {sendError}
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 flex gap-2 items-center flex-shrink-0"
              style={{ borderTop: '1px solid #eff3f4', background: '#fff' }}>
              <input value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder={`@${chatWith.username}'e mesaj...`}
                maxLength={500}
                className="flex-1 rounded-full px-5 py-3 text-sm focus:outline-none"
                style={{ background: '#f7f8f8', border: '1px solid #eff3f4', color: '#0f1419' }} />
              <button onClick={send} disabled={sending || !input.trim()}
                className="w-11 h-11 rounded-full flex items-center justify-center text-white flex-shrink-0 disabled:opacity-40 transition-all"
                style={{ background: '#ff6b2b' }}>
                <Send size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
