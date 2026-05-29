'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { UserPlus, Check, X, MessageCircle, Search, Loader2 } from 'lucide-react';

interface Profile { id: string; username: string; total_finds: number }
interface Request { id: string; from_user: Profile; status: string }
interface Friendship { id: string; friend: Profile }

interface Props {
  initialRequests: Request[];
  initialFriends: Friendship[];
  currentUserId: string;
}

export default function FriendsClient({ initialRequests, initialFriends, currentUserId }: Props) {
  const params = useSearchParams();
  const addUserId = params.get('add');
  const [requests, setRequests] = useState(initialRequests);
  const [friends, setFriends] = useState(initialFriends);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!addUserId || addUserId === currentUserId) return;
    if (friends.some((f) => f.friend.id === addUserId)) {
      setTimeout(() => setSuccessMsg('Bu kullanıcı zaten arkadaşın'), 0);
      return;
    }
    (async () => {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', to_user_id: addUserId }),
      });
      const ok = res.ok;
      const d = ok ? null : await res.json().catch(() => ({}));
      setTimeout(() => {
        if (ok) {
          setSuccessMsg('Arkadaşlık isteği gönderildi!');
          setSentRequests((s) => new Set([...s, addUserId]));
        } else {
          const m = d?.error || '';
          if (m.includes('duplicate') || m.includes('unique')) setError('Bu kullanıcıya zaten istek gönderilmiş');
          else setError(m || 'İstek gönderilemedi');
        }
      }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addUserId]);

  const searchUsers = async () => {
    if (!search.trim()) return;
    setSearching(true);
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(search)}`);
    const data = await res.json();
    setSearchResults(data.filter((u: Profile) => u.id !== currentUserId));
    setSearching(false);
  };

  const sendRequest = async (toUserId: string) => {
    setError('');
    const res = await fetch('/api/friends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send', to_user_id: toUserId }),
    });
    if (res.ok) {
      setSentRequests((s) => new Set([...s, toUserId]));
    } else {
      const d = await res.json().catch(() => ({ error: 'Bilinmeyen hata' }));
      const msg = d.error || '';
      if (msg.includes('duplicate') || msg.includes('unique')) setError('Bu kullanıcıya zaten istek gönderilmiş');
      else setError(msg || 'İstek gönderilemedi');
    }
  };

  const respond = async (requestId: string, action: 'accept' | 'reject') => {
    await fetch('/api/friends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, request_id: requestId }),
    });
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    if (action === 'accept') {
      const req = requests.find((r) => r.id === requestId);
      if (req) setFriends((prev) => [...prev, { id: requestId, friend: req.from_user }]);
    }
  };

  const card = { background: '#ffffff', border: '1px solid #eff3f4' };
  const inp = { background: '#f7f8f8', border: '1px solid #eff3f4', color: '#0f1419' };

  return (
    <div className="space-y-5">
      {/* Kullanıcı ara */}
      <div className="rounded-2xl p-4" style={card}>
        <h2 className="font-bold mb-3 text-sm" style={{ color: '#0f1419' }}>Kullanıcı Ara</h2>
        <div className="flex gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
            placeholder="Kullanıcı adı..."
            className="flex-1 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
            style={{ ...inp, placeholder: '#536471' } as React.CSSProperties} />
          <button onClick={searchUsers} disabled={searching}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#ff6b2b' }}>
            {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          </button>
        </div>
        {error && (
          <div className="mt-3 rounded-xl p-3 text-sm" style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mt-3 rounded-xl p-3 text-sm" style={{ background: 'rgba(34,197,94,0.08)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.2)' }}>
            ✓ {successMsg}
          </div>
        )}
        {searchResults.length > 0 && (
          <div className="mt-3 space-y-2">
            {searchResults.map((u) => {
              const isFriend = friends.some((f) => f.friend.id === u.id);
              const sent = sentRequests.has(u.id);
              return (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#f7f8f8', border: '1px solid #eff3f4' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}>
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: '#0f1419' }}>@{u.username}</div>
                    <div className="text-xs" style={{ color: '#536471' }}>{u.total_finds} görev buldu</div>
                  </div>
                  {isFriend ? (
                    <span className="text-xs" style={{ color: '#536471' }}>Arkadaş</span>
                  ) : sent ? (
                    <span className="text-xs" style={{ color: '#536471' }}>İstek gönderildi</span>
                  ) : (
                    <button onClick={() => sendRequest(u.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                      style={{ background: '#ff6b2b' }}>
                      <UserPlus size={12} /> Ekle
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Gelen istekler */}
      {requests.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={card}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid #eff3f4' }}>
            <h2 className="font-bold text-sm" style={{ color: '#0f1419' }}>Gelen İstekler ({requests.length})</h2>
          </div>
          <div>
            {requests.map((req) => (
              <div key={req.id} className="flex items-center gap-3 p-4" style={{ borderBottom: '1px solid #eff3f4' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white" style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}>
                  {req.from_user.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: '#0f1419' }}>@{req.from_user.username}</div>
                  <div className="text-xs" style={{ color: '#536471' }}>arkadaşlık isteği gönderdi</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => respond(req.id, 'accept')} className="p-2 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a' }}>
                    <Check size={14} />
                  </button>
                  <button onClick={() => respond(req.id, 'reject')} className="p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626' }}>
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Arkadaş listesi */}
      <div className="rounded-2xl overflow-hidden" style={card}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid #eff3f4' }}>
          <h2 className="font-bold text-sm" style={{ color: '#0f1419' }}>Arkadaşlar ({friends.length})</h2>
        </div>
        {friends.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: '#536471' }}>Henüz arkadaş yok. Yukarıdan kullanıcı ara!</div>
        ) : (
          <div>
            {friends.map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-4" style={{ borderBottom: '1px solid #eff3f4' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white" style={{ background: 'linear-gradient(135deg, #ff6b2b, #ff3d00)' }}>
                  {f.friend.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: '#0f1419' }}>@{f.friend.username}</div>
                  <div className="text-xs" style={{ color: '#536471' }}>{f.friend.total_finds} görev buldu</div>
                </div>
                <Link href={`/messages?with=${f.friend.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                  style={{ background: '#ff6b2b' }}>
                  <MessageCircle size={12} /> Mesaj
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
