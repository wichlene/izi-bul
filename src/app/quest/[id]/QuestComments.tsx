'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: { username: string; avatar_url: string | null } | null;
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'az önce';
  if (s < 3600) return `${Math.floor(s / 60)}dk`;
  if (s < 86400) return `${Math.floor(s / 3600)}sa`;
  return `${Math.floor(s / 86400)}g`;
}

export default function QuestComments({ questId, isLoggedIn }: { questId: string; isLoggedIn: boolean }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/quests/${questId}/comments`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { setComments(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [questId]);

  const submit = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const res = await fetch(`/api/quests/${questId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input.trim() }),
    });
    if (res.ok) {
      const c = await res.json();
      setComments(prev => [...prev, c]);
      setInput('');
    }
    setSending(false);
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #eff3f4' }}>
      <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #eff3f4' }}>
        <MessageSquare size={18} style={{ color: '#ff6b2b' }} />
        <h3 className="font-black text-base" style={{ color: '#0f1419' }}>Yorumlar</h3>
        {!loading && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#eff3f4', color: '#536471' }}>
            {comments.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin" style={{ color: '#ff6b2b' }} />
        </div>
      ) : comments.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm font-medium" style={{ color: '#536471' }}>Henüz yorum yok. İlk yorumu sen yaz!</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: '#eff3f4' }}>
          {comments.map(c => {
            const username = c.profiles?.username || 'anonim';
            return (
              <div key={c.id} className="px-5 py-3.5 flex gap-3">
                <Link href={`/user/${c.user_id}`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#ff6b2b,#a855f7)' }}>
                    {username.charAt(0).toUpperCase()}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Link href={`/user/${c.user_id}`} className="text-sm font-bold hover:underline" style={{ color: '#0f1419' }}>
                      @{username}
                    </Link>
                    <span className="text-xs" style={{ color: '#8e8e8e' }}>{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#536471' }}>{c.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isLoggedIn ? (
        <div className="px-4 py-3 flex gap-2 items-center" style={{ borderTop: '1px solid #eff3f4' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submit()}
            placeholder="Yorum yaz... (spoiler verme 😅)"
            maxLength={300}
            className="flex-1 rounded-full px-4 py-2.5 text-sm focus:outline-none"
            style={{ background: '#eff3f4', color: '#0f1419' }}
          />
          <button
            onClick={submit}
            disabled={sending || !input.trim()}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0 disabled:opacity-40 transition-all"
            style={{ background: '#ff6b2b' }}>
            {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </div>
      ) : (
        <div className="px-5 py-3 text-center" style={{ borderTop: '1px solid #eff3f4' }}>
          <Link href="/login" className="text-sm font-bold" style={{ color: '#ff6b2b' }}>
            Yorum yazmak için giriş yap →
          </Link>
        </div>
      )}
    </div>
  );
}
