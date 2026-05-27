'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Send, Trophy, MapPin, Loader2, Navigation } from 'lucide-react';
import { Challenge } from '@/types';
import { formatDistance } from '@/lib/distance';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

interface GuessResult {
  isWinner: boolean;
  distance: number;
  reward: string | null;
}

interface Props {
  challenge: Challenge;
}

export default function GuessMap({ challenge }: Props) {
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GuessResult | null>(null);
  const [error, setError] = useState('');

  if (!challenge.is_active) {
    return (
      <div className="h-96 flex items-center justify-center text-gray-400 p-8 text-center">
        <div>
          <Trophy size={40} className="mx-auto mb-3 text-yellow-400" />
          <p className="font-semibold text-gray-600">Bu challenge sona erdi</p>
          <p className="text-sm mt-1">Kazanan: {challenge.winner_name}</p>
        </div>
      </div>
    );
  }

  if (result?.isWinner) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-center p-8">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-2xl font-extrabold text-green-600 mb-2">Buldun!</h3>
        <p className="text-gray-600 mb-4">
          Konuma sadece <strong>{formatDistance(result.distance)}</strong> uzaktaydın.
        </p>
        <div className="bg-orange-50 rounded-2xl p-4 w-full">
          <p className="text-orange-600 font-semibold text-sm mb-1">Ödülün:</p>
          <p className="text-orange-800 font-bold text-xl">{result.reward}</p>
          <p className="text-gray-500 text-xs mt-2">
            Ödülünü almak için kafeyı ziyaret et ve &quot;İzi Bul&quot; kazandım de!
          </p>
        </div>
      </div>
    );
  }

  if (result && !result.isWinner) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-center p-8">
        <div className="text-5xl mb-4">📍</div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">Yakın değildin</h3>
        <p className="text-gray-500 mb-4">
          Konuma <strong className="text-red-500">{formatDistance(result.distance)}</strong> uzaktaydın.
          Maksimum mesafe: {formatDistance(challenge.max_distance_meters)}.
        </p>
        <button
          onClick={() => { setResult(null); setSelectedLat(null); setSelectedLng(null); }}
          className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
        >
          Tekrar dene
        </button>
      </div>
    );
  }

  const handleGuess = async () => {
    if (!selectedLat || !selectedLng) { setError('Haritada bir yer seç!'); return; }
    if (!userName.trim()) { setError('İsim girmeden tahmin yapamazsın!'); return; }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/guesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge_id: challenge.id,
          user_name: userName.trim(),
          latitude: selectedLat,
          longitude: selectedLng,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Harita */}
      <div className="h-72">
        <MapPicker onLocationSelect={(lat, lng) => { setSelectedLat(lat); setSelectedLng(lng); }} />
      </div>

      {/* Form */}
      <div className="p-4 space-y-3 border-t border-gray-100">
        {selectedLat && (
          <div className="flex items-center gap-1.5 text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
            <Navigation size={13} />
            <span>Pin bırakıldı — tahmin hazır</span>
          </div>
        )}

        <input
          type="text"
          placeholder="Adın (kazanırsan gösterilecek)"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          maxLength={30}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={handleGuess}
          disabled={loading || !selectedLat}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Kontrol ediliyor...</>
          ) : (
            <><Send size={16} /> Tahmin Et</>
          )}
        </button>

        <div className="flex items-center gap-1.5 text-gray-400 text-xs">
          <MapPin size={11} />
          <span>Konuma {formatDistance(challenge.max_distance_meters)} içinde olman gerekiyor</span>
        </div>
      </div>
    </div>
  );
}
