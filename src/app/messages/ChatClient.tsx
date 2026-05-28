'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send, MessageCircle } from 'lucide-react';

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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!chatWith) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/messages?with=${chatWith.id}`);
      const data = await res.json();
      setMessages(data);
    }, 3000);
    return () => clearInterval(interval);
  }, [chatWith]);

  const send = async () => {
    if (!input.trim() || !chatWith || sending) return;
    setSending(true);
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_user_id: chatWith.id, content: input.trim() }),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setInput('');
    }
    setSending(false);
  };

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };

  return (
    <div className="max-w-5xl mx-auto flex h-[calc(100vh-64px)]">
      {/* Sidebar - arkadaş listesi */}
      <div className="w-64 border-r border-white/5 flex flex-col">
        <div className="px-4 py-4 border-b border-white/5">
          <h2 className="font-bold text-white text-sm">Mesajlar</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {friends.length === 0 ? (
            <div className="p-6 text-center text-white/20 text-xs">Arkadaş yok</div>
          ) : friends.map((f) => (
            <button key={f.id} onClick={() => router.push(`/messages?with=${f.id}`)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
              style={chatWith?.id === f.id ? { background: 'rgba(255,107,43,0.1)' } : {}}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #ff6b2b, #a855f7)' }}>
                {f.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-white/70 font-medium">@{f.username}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mesaj alanı */}
      <div className="flex-1 flex flex-col">
        {!chatWith ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle size={40} className="text-white/10 mx-auto mb-3" />
              <p className="text-white/20">Bir arkadaşını seç</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg, #ff6b2b, #a855f7)' }}>
                {chatWith.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-white font-semibold">@{chatWith.username}</span>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.map((msg) => {
                const isMe = msg.from_user_id === currentUserId;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-xs px-4 py-2.5 rounded-2xl text-sm"
                      style={isMe
                        ? { background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)', color: 'white' }
                        : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }
                      }>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="px-4 py-3 border-t border-white/5 flex gap-3">
              <input value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Mesajını yaz..."
                maxLength={500}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
              <button onClick={send} disabled={sending || !input.trim()}
                className="px-4 py-2.5 rounded-xl text-white transition-all"
                style={{ background: input.trim() ? 'linear-gradient(135deg, #ff6b2b, #ff3d00)' : 'rgba(255,255,255,0.05)' }}>
                <Send size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
