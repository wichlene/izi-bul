'use client';

import { useState } from 'react';
import { ShoppingBag, Check, Loader2, X } from 'lucide-react';
import { STORE_ITEMS, CATEGORY_LABELS, StoreItem } from '@/lib/storeItems';

interface Props {
  userPoints: number;
}

interface PurchaseResult {
  code: string;
  item: { title: string; icon: string };
  pointsSpent: number;
  remainingPoints: number;
  expiresAt: string;
}

const CATEGORY_ORDER = ['food', 'discount', 'special', 'premium'] as const;

function ItemCard({ item, userPoints, onBuy }: {
  item: StoreItem;
  userPoints: number;
  onBuy: (item: StoreItem) => void;
}) {
  const canAfford = userPoints >= item.pointsCost;

  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3 transition-all"
      style={{ background: '#fff', border: `1px solid ${canAfford ? '#eff3f4' : '#f3f4f6'}`, opacity: canAfford ? 1 : 0.65 }}>
      <div className="flex items-start justify-between">
        <div className="text-3xl">{item.icon}</div>
        {item.badge && (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
            style={{ background: '#fff4ed', color: '#ff6b2b', border: '1px solid #fecdb2' }}>
            {item.badge}
          </span>
        )}
      </div>
      <div>
        <h3 className="font-black text-sm" style={{ color: '#0f1419' }}>{item.title}</h3>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: '#536471' }}>{item.description}</p>
      </div>
      <div className="flex items-center justify-between mt-auto pt-2" style={{ borderTop: '1px solid #eff3f4' }}>
        <div className="flex items-center gap-1">
          <span className="text-lg font-black" style={{ color: canAfford ? '#ff6b2b' : '#9ca3af' }}>
            {item.pointsCost.toLocaleString()}
          </span>
          <span className="text-xs font-medium" style={{ color: '#536471' }}>puan</span>
        </div>
        <button
          onClick={() => onBuy(item)}
          disabled={!canAfford}
          className="px-3 py-1.5 rounded-full text-xs font-black text-white transition-all disabled:opacity-40"
          style={{ background: canAfford ? '#ff6b2b' : '#9ca3af' }}>
          {canAfford ? 'Al' : 'Yetersiz'}
        </button>
      </div>
    </div>
  );
}

export default function StoreClient({ userPoints: initialPoints }: Props) {
  const [userPoints, setUserPoints] = useState(initialPoints);
  const [confirming, setConfirming] = useState<StoreItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PurchaseResult | null>(null);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const handleBuy = async () => {
    if (!confirming || loading) return;
    setLoading(true);
    setError('');
    const res = await fetch('/api/store/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: confirming.id }),
    });
    const data = await res.json();
    if (res.ok) {
      setResult(data);
      setUserPoints(data.remainingPoints);
      setConfirming(null);
    } else {
      setError(data.error || 'Satın alma başarısız');
    }
    setLoading(false);
  };

  const visibleItems = activeCategory === 'all'
    ? STORE_ITEMS
    : STORE_ITEMS.filter(i => i.category === activeCategory);

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-4" style={{ background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #eff3f4' }}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-black flex items-center gap-2" style={{ color: '#0f1419' }}>
            <ShoppingBag size={22} style={{ color: '#ff6b2b' }} />
            Puan Mağazası
          </h1>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: '#fff4ed', border: '1px solid #fecdb2' }}>
            <span className="text-lg">🏅</span>
            <span className="font-black text-sm" style={{ color: '#ff6b2b' }}>{userPoints.toLocaleString()} puan</span>
          </div>
        </div>
        {/* Kategori filtreleri */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveCategory('all')}
            className="px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0 transition-all"
            style={activeCategory === 'all'
              ? { background: '#ff6b2b', color: '#fff' }
              : { background: '#eff3f4', color: '#536471' }}>
            Tümü
          </button>
          {CATEGORY_ORDER.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0 transition-all"
              style={activeCategory === cat
                ? { background: '#ff6b2b', color: '#fff' }
                : { background: '#eff3f4', color: '#536471' }}>
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Ürünler */}
      <div className="p-4 grid grid-cols-2 gap-3">
        {visibleItems.map(item => (
          <ItemCard key={item.id} item={item} userPoints={userPoints} onBuy={setConfirming} />
        ))}
      </div>

      {/* Onay modalı */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: '#fff' }}>
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">{confirming.icon}</div>
              <h3 className="text-lg font-black" style={{ color: '#0f1419' }}>{confirming.title}</h3>
              <p className="text-sm mt-1" style={{ color: '#536471' }}>{confirming.description}</p>
            </div>
            <div className="rounded-2xl p-4 mb-4 text-center" style={{ background: '#fff4ed' }}>
              <p className="text-sm" style={{ color: '#536471' }}>Harcayacaksın</p>
              <p className="text-2xl font-black" style={{ color: '#ff6b2b' }}>{confirming.pointsCost.toLocaleString()} puan</p>
              <p className="text-xs mt-1" style={{ color: '#536471' }}>Kalan: {(userPoints - confirming.pointsCost).toLocaleString()} puan</p>
            </div>
            {error && (
              <p className="text-xs text-center mb-3" style={{ color: '#ef4444' }}>{error}</p>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setConfirming(null); setError(''); }}
                className="flex-1 py-3 rounded-full font-bold text-sm" style={{ background: '#eff3f4', color: '#536471' }}>
                İptal
              </button>
              <button onClick={handleBuy} disabled={loading}
                className="flex-1 py-3 rounded-full font-black text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: '#ff6b2b' }}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Satın Al'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Başarı modalı */}
      {result && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: '#fff' }}>
            <button onClick={() => setResult(null)}
              className="absolute top-4 right-4 p-2 rounded-full" style={{ background: '#eff3f4' }}>
              <X size={16} style={{ color: '#536471' }} />
            </button>
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.1)' }}>
                <Check size={32} style={{ color: '#22c55e' }} />
              </div>
              <h3 className="text-xl font-black" style={{ color: '#0f1419' }}>Satın Alındı!</h3>
              <p className="text-sm mt-1" style={{ color: '#536471' }}>{result.item.icon} {result.item.title}</p>
            </div>
            <div className="rounded-2xl p-5 text-center mb-4" style={{ background: '#f7f8f8', border: '1px solid #eff3f4' }}>
              <p className="text-xs font-bold mb-2" style={{ color: '#536471' }}>KULLANIM KODUN</p>
              <p className="text-2xl font-black tracking-widest" style={{ color: '#0f1419', letterSpacing: '0.15em' }}>
                {result.code}
              </p>
              <p className="text-xs mt-2" style={{ color: '#8e8e8e' }}>
                30 gün geçerli — işletmeye göster
              </p>
            </div>
            <button
              onClick={() => { navigator.clipboard?.writeText(result.code); }}
              className="w-full py-3 rounded-full font-black text-sm text-white"
              style={{ background: '#ff6b2b' }}>
              Kodu Kopyala
            </button>
          </div>
        </div>
      )}
    </>
  );
}
