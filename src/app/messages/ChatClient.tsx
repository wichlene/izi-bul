'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send, MessageCircle, ArrowLeft, Search, PenSquare, Smile } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { playMessage } from '@/lib/sounds';

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

const EMOJIS = ['😀','😂','🥰','😍','🤩','😎','🥳','🤔','😅','😭','😤','😡','🤯','🤗','😴','🤮','👋','👍','👎','❤️','🔥','✨','💯','🎉','🏆','🗺️','📍','🎯','💪','🙏','👀','🤌','😂','💀','🤷','🫶','😊','🥺','😈','🤣'];

function timeAgo(date: string): string {
  if (!date) return '';
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'şimdi';
  if (s < 3600) return `${Math.floor(s / 60)}dk`;
  if (s < 86400) return `${Math.floor(s / 3600)}sa`;
  const d = Math.floor(s / 86400);
  return d < 7 ? `${d}g` : `${Math.floor(d / 7)}h`;
}

export default function ChatClient({ currentUserId, friends, convMap, initialMessages, chatWith }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [liveConv, setLiveConv] = useState<Record<string, ConvMeta>>(convMap);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>(chatWith ? 'chat' : 'list');
  const [showEmoji, setShowEmoji] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = useRef(createClient());

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!chatWith) return;
    const withId = chatWith.id;

    const addMsg = (msg: Message) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      if (msg.from_user_id !== currentUserId) playMessage();
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

    const sb = supabase.current;
    const channel = sb
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
            if (fresh.length) {
              const hasIncoming = fresh.some((m) => m.from_user_id !== currentUserId);
              if (hasIncoming) playMessage();
              return [...prev, ...fresh];
            }
            return prev;
          });
        })
        .catch(() => {});
    };
    const interval = setInterval(poll, 1500);
    return () => { sb.removeChannel(channel); clearInterval(interval); };
  }, [chatWith?.id, currentUserId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const filteredFriends = search.trim()
    ? friends.filter((f) => f.username.toLowerCase().includes(search.toLowerCase()))
    : friends;

  return (
    <div className="flex overflow-hidden h-[calc(100dvh-56px)] md:h-screen" style={{ background: '#fff' }}>

      {/* ── KONUŞMA LİSTESİ ── */}
      <div className={[
        'flex-col flex-shrink-0',
        mobileView === 'chat' ? 'hidden md:flex' : 'flex',
        'w-full md:w-[360px]',
      ].join(' ')}
        style={{ borderRight: '1px solid #eff3f4' }}>

        {/* Header — X Sohbet stili */}
        <div className="px-5 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-black" style={{ color: '#0f1419' }}>Sohbet</h1>
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors" style={{ color: '#0f1419' }}>
              <PenSquare size={20} />
            </button>
          </div>
          {/* Arama */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-full" style={{ background: '#eff3f4' }}>
            <Search size={16} style={{ color: '#536471', flexShrink: 0 }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ara"
              className="flex-1 text-sm bg-transparent focus:outline-none"
              style={{ color: '#0f1419' }}
            />
          </div>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto">
          {filteredFriends.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle size={40} className="mx-auto mb-3" style={{ color: '#eff3f4' }} />
              <p className="text-base font-semibold" style={{ color: '#0f1419' }}>
                {search ? 'Sonuç bulunamadı' : 'Henüz arkadaşın yok'}
              </p>
              <p className="text-sm mt-1" style={{ color: '#536471' }}>
                {search ? 'Farklı bir isim dene' : 'Arkadaş ekleyerek mesajlaşmaya başla'}
              </p>
            </div>
          ) : filteredFriends.map((f) => {
            const conv = liveConv[f.id];
            const isActive = chatWith?.id === f.id;
            const hasUnread = (conv?.unread || 0) > 0;
            const isMe = conv?.lastFrom === currentUserId;

            return (
              <button key={f.id}
                onClick={() => { router.push(`/messages?with=${f.id}`); setMobileView('chat'); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50"
                style={isActive ? { background: 'rgba(255,107,43,0.05)' } : {}}>

                {/* Avatar */}
                <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-lg font-black text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
                  {f.username.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-[15px] truncate leading-tight"
                      style={{ color: '#0f1419', fontWeight: hasUnread ? 800 : 700 }}>
                      {f.username}
                    </span>
                    {conv?.lastTime && (
                      <span className="text-[13px] flex-shrink-0"
                        style={{ color: hasUnread ? '#ff6b2b' : '#8e8e8e' }}>
                        {timeAgo(conv.lastTime)}
                      </span>
                    )}
                  </div>
                  <p className="text-[14px] truncate leading-tight"
                    style={{ color: hasUnread ? '#0f1419' : '#536471', fontWeight: hasUnread ? 600 : 400 }}>
                    {conv?.lastMsg
                      ? `${isMe ? 'Sen: ' : ''}${conv.lastMsg}`
                      : 'Henüz mesaj yok'}
                  </p>
                </div>

                {hasUnread && (
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: '#ff6b2b' }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SOHBET ALANI ── */}
      <div className={[
        'flex-col flex-1 min-w-0',
        mobileView === 'list' ? 'hidden md:flex' : 'flex',
      ].join(' ')}>

        {!chatWith ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-8">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: '#eff3f4' }}>
                <MessageCircle size={36} style={{ color: '#536471' }} />
              </div>
              <p className="text-xl font-black mb-2" style={{ color: '#0f1419' }}>Mesajlarını seç</p>
              <p className="text-sm" style={{ color: '#536471' }}>
                Soldaki arkadaşını seçip yazmaya başla.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
              style={{ borderBottom: '1px solid #eff3f4' }}>
              <button onClick={() => { router.push('/messages'); setMobileView('list'); }}
                className="md:hidden p-2 -ml-1 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                style={{ color: '#0f1419' }}>
                <ArrowLeft size={22} />
              </button>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-black text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
                {chatWith.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-[15px] leading-tight" style={{ color: '#0f1419' }}>
                  {chatWith.username}
                </p>
                <p className="text-xs" style={{ color: '#536471' }}>@{chatWith.username}</p>
              </div>
            </div>

            {/* Mesajlar */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2" style={{ background: '#f7f8f8' }}>
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center text-xl font-black text-white"
                    style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
                    {chatWith.username.charAt(0).toUpperCase()}
                  </div>
                  <p className="font-bold" style={{ color: '#0f1419' }}>{chatWith.username}</p>
                  <p className="text-sm mt-1" style={{ color: '#536471' }}>Henüz mesaj yok. İlk sen yaz!</p>
                </div>
              )}
              {messages.map((msg) => {
                const isMe = msg.from_user_id === currentUserId;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                    {!isMe && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
                        {chatWith.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="max-w-[72%] px-4 py-2.5 rounded-[20px] text-[15px] leading-relaxed"
                      style={isMe
                        ? { background: '#ff6b2b', color: '#fff', borderBottomRightRadius: 4 }
                        : { background: '#fff', color: '#0f1419', border: '1px solid #e5e7eb', borderBottomLeftRadius: 4 }}>
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
            {showEmoji && (
              <div className="px-3 pb-2 flex flex-wrap gap-1">
                {EMOJIS.map((e) => (
                  <button key={e} onClick={() => { setInput((v) => v + e); setShowEmoji(false); }}
                    className="text-xl hover:bg-gray-100 rounded p-1 transition-colors">
                    {e}
                  </button>
                ))}
              </div>
            )}
            <div className="px-4 py-3 flex gap-2 items-center flex-shrink-0"
              style={{ borderTop: '1px solid #eff3f4', background: '#fff' }}>
              <button onClick={() => setShowEmoji((v) => !v)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                style={{ color: showEmoji ? '#ff6b2b' : '#536471' }}>
                <Smile size={20} />
              </button>
              <input value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Bir mesaj yaz..."
                maxLength={500}
                className="flex-1 rounded-full px-5 py-3 text-[15px] focus:outline-none"
                style={{ background: '#eff3f4', color: '#0f1419' }} />
              <button onClick={send} disabled={sending || !input.trim()}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 disabled:opacity-40 transition-all"
                style={{ background: '#ff6b2b' }}>
                <Send size={17} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
