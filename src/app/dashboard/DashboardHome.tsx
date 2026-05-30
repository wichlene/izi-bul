'use client';

import { useState, useEffect } from 'react';
import { Quest, Category } from '@/types';
import { calculateDistance } from '@/lib/distance';
import QuestCard from '@/components/QuestCard';
import GoodDeedClient from '@/app/good-deed/GoodDeedClient';
import { MapPin, Heart } from 'lucide-react';

interface Props {
  quests: Quest[];
  categories: Category[];
}

export default function DashboardHome({ quests, categories }: Props) {
  const [tab, setTab] = useState<'quests' | 'good'>('quests');
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setUserPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  const sorted = userPos
    ? [...quests].sort((a, b) =>
        calculateDistance(userPos.lat, userPos.lng, a.latitude, a.longitude) -
        calculateDistance(userPos.lat, userPos.lng, b.latitude, b.longitude)
      )
    : quests;

  return (
    <div>
      {/* Tabs */}
      <div className="sticky top-0 z-10 backdrop-blur-md px-4 py-3 flex items-center gap-3"
        style={{ background: 'rgba(255,255,255,0.92)', borderBottom: '1px solid #eff3f4' }}>
        <button
          onClick={() => setTab('quests')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all"
          style={tab === 'quests'
            ? { background: 'rgba(255,107,43,0.1)', color: '#ff6b2b', border: '1px solid rgba(255,107,43,0.25)' }
            : { background: 'transparent', color: '#536471', border: '1px solid #eff3f4' }}>
          <MapPin size={14} /> Görevler
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs"
            style={{ background: tab === 'quests' ? 'rgba(255,107,43,0.15)' : '#f7f8f8', color: tab === 'quests' ? '#ff6b2b' : '#536471' }}>
            {quests.length}
          </span>
        </button>
        <button
          onClick={() => setTab('good')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all"
          style={tab === 'good'
            ? { background: 'rgba(236,72,153,0.1)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.25)' }
            : { background: 'transparent', color: '#536471', border: '1px solid #eff3f4' }}>
          <Heart size={14} /> İyilik
        </button>
        {tab === 'quests' && userPos && (
          <span className="ml-auto text-xs flex items-center gap-1" style={{ color: '#22c55e' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Yakınımdakiler önce
          </span>
        )}
      </div>

      {tab === 'quests' ? (
        <div className="p-4">
          {quests.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-5xl mb-4">🗺️</div>
              <p style={{ color: '#536471' }}>Henüz görev yok.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sorted.map((q) => (
                <QuestCard
                  key={q.id}
                  quest={q}
                  distance={userPos
                    ? Math.round(calculateDistance(userPos.lat, userPos.lng, q.latitude, q.longitude))
                    : undefined}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <GoodDeedClient />
      )}
    </div>
  );
}
