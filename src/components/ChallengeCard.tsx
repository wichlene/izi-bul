'use client';

import Link from 'next/link';
import { MapPin, Gift, Users, Clock } from 'lucide-react';
import { Challenge } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Props {
  challenge: Challenge;
}

export default function ChallengeCard({ challenge }: Props) {
  const timeAgo = formatDistanceToNow(new Date(challenge.created_at), {
    addSuffix: true,
    locale: tr,
  });

  return (
    <Link href={`/challenge/${challenge.id}`}>
      <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer border border-gray-100">
        {/* Fotoğraf */}
        <div className="relative h-52 overflow-hidden bg-gray-200">
          <img
            src={challenge.photo_url}
            alt="Challenge fotoğrafı"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Aktif badge */}
          <div className="absolute top-3 left-3">
            <span className="bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              Aktif
            </span>
          </div>
          {/* Ödül badge */}
          <div className="absolute top-3 right-3">
            <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <Gift size={12} />
              {challenge.reward_type === 'cash' && challenge.reward_amount
                ? `${challenge.reward_amount}₺`
                : 'Ödül'}
            </span>
          </div>
        </div>

        {/* İçerik */}
        <div className="p-4">
          <div className="flex items-center gap-1.5 text-orange-500 font-semibold text-sm mb-1">
            <MapPin size={14} />
            <span>{challenge.cafe_name}</span>
          </div>

          <p className="text-gray-700 text-sm line-clamp-2 mb-3">
            {challenge.description}
          </p>

          <div className="bg-orange-50 rounded-xl p-3 mb-3">
            <p className="text-orange-700 text-sm font-medium flex items-center gap-1.5">
              <Gift size={14} />
              {challenge.reward}
            </p>
          </div>

          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span className="flex items-center gap-1">
              <Users size={12} />
              {challenge.total_guesses} tahmin
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {timeAgo}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
