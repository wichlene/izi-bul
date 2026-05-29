'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2, Trash2 } from 'lucide-react';

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
        ? { background: 'rgba(34,197,94,0.2)', color: '#22c55e' }
        : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>
      {loading ? '...' : current ? '🏪 İşletme' : 'İşletme Yap'}
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
        ? { background: 'rgba(255,215,0,0.2)', color: '#ffd700' }
        : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>
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
