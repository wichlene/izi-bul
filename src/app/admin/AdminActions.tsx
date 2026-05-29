'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2, Trash2, Megaphone, EyeOff } from 'lucide-react';

export function AnnouncementComposer() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const post = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    const res = await fetch('/api/posts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text, post_type: 'announcement' }),
    });
    setLoading(false);
    if (res.ok) { setText(''); router.refresh(); }
  };

  return (
    <div className="flex gap-2">
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Günlük görev duyurusu yaz..."
        className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
        style={{ background: '#f7f8f8', border: '1px solid #eff3f4', color: '#0f1419' }} />
      <button onClick={post} disabled={loading || !text.trim()}
        className="px-4 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-1.5 disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg,#ff6b2b,#ff3d00)' }}>
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Megaphone size={14} />} Duyur
      </button>
    </div>
  );
}

export function ContactStatusButton({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [loading, setLoading] = useState(false);

  const next = current === 'new' ? 'read' : current === 'read' ? 'replied' : current === 'replied' ? 'closed' : 'new';
  const labels: Record<string, string> = { new: 'Yeni', read: 'Okundu', replied: 'Yanıtlandı', closed: 'Kapalı' };
  const colors: Record<string, string> = { new: '#eab308', read: '#3b82f6', replied: '#22c55e', closed: '#536471' };

  const update = async () => {
    setLoading(true);
    const res = await fetch('/api/contact', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: next }),
    });
    setLoading(false);
    if (res.ok) { setCurrent(next); router.refresh(); }
  };

  return (
    <button onClick={update} disabled={loading}
      className="text-xs font-bold px-2.5 py-1 rounded-full disabled:opacity-50 flex-shrink-0"
      style={{ background: colors[current] + '18', color: colors[current] }}>
      {loading ? '...' : labels[current]}
    </button>
  );
}

export function ApproveButton({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const approve = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission_id: submissionId }),
    });
    if (res.ok) {
      setDone(true);
      router.refresh();
    }
    setLoading(false);
  };

  if (done) return <span className="text-xs text-green-400 font-semibold">✓ Onaylandı</span>;

  return (
    <button onClick={approve} disabled={loading}
      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50"
      style={{ background: 'rgba(34,197,94,0.2)', color: '#22c55e' }}>
      {loading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
      Onayla
    </button>
  );
}

export function BusinessToggle({ userId, isBusiness }: { userId: string; isBusiness: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(isBusiness);

  const toggle = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/business', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, is_business: !current }),
    });
    if (res.ok) {
      setCurrent((v) => !v);
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <button onClick={toggle} disabled={loading}
      className="text-xs px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
      style={current
        ? { background: 'rgba(34,197,94,0.1)', color: '#16a34a' }
        : { background: '#f7f8f8', color: '#536471', border: '1px solid #eff3f4' }}>
      {loading ? '...' : current ? '🏪 İşletme' : 'İşletme Yap'}
    </button>
  );
}

export function QuestDeactivateButton({ questId, isActive }: { questId: string; isActive: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(isActive);

  const toggle = async () => {
    if (current && !confirm('Görevi siteden kaldırmak istediğine emin misin?')) return;
    setLoading(true);
    const res = await fetch('/api/admin/quests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quest_id: questId, is_active: !current }),
    });
    if (res.ok) {
      setCurrent((v) => !v);
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <button onClick={toggle} disabled={loading}
      className="text-xs px-2 py-1 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
      style={current
        ? { background: 'rgba(239,68,68,0.1)', color: '#ef4444' }
        : { background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
      {loading ? <Loader2 size={11} className="animate-spin" /> : current ? <><EyeOff size={11} /> Kaldır</> : '✓ Aktif et'}
    </button>
  );
}

export function FeatureToggle({ questId, isFeatured }: { questId: string; isFeatured: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(isFeatured);

  const toggle = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/feature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quest_id: questId, featured: !current }),
    });
    if (res.ok) {
      setCurrent((v) => !v);
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <button onClick={toggle} disabled={loading}
      className="text-xs px-2 py-1 rounded-lg disabled:opacity-50"
      style={current
        ? { background: 'rgba(234,179,8,0.12)', color: '#ca8a04' }
        : { background: '#f7f8f8', color: '#536471', border: '1px solid #eff3f4' }}>
      {loading ? '...' : current ? '⭐ Öne çıkan' : 'Öne çıkar'}
    </button>
  );
}

export function DeletePostButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const del = async () => {
    if (!confirm('Bu gönderiyi silmek istediğine emin misin?')) return;
    setLoading(true);
    const res = await fetch(`/api/admin/posts?id=${postId}`, { method: 'DELETE' });
    if (res.ok) {
      setDeleted(true);
      router.refresh();
    }
    setLoading(false);
  };

  if (deleted) return <span className="text-xs" style={{ color: '#22c55e' }}>Silindi</span>;

  return (
    <button onClick={del} disabled={loading}
      className="p-1.5 rounded-lg transition-colors hover:bg-red-50 disabled:opacity-50 flex-shrink-0"
      style={{ color: '#ef4444' }}>
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
    </button>
  );
}
