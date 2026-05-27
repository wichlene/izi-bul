import Link from 'next/link';
import { MapPin, Coins, Users } from 'lucide-react';
import { Quest, DIFFICULTIES } from '@/types';

interface Props {
  quest: Quest;
}

export default function QuestCard({ quest }: Props) {
  const diff = DIFFICULTIES[quest.difficulty];

  return (
    <Link href={`/quest/${quest.id}`}>
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer border border-gray-100 h-full flex flex-col">
        <div className="relative h-48 overflow-hidden bg-gray-200">
          <img
            src={quest.photo_url}
            alt={quest.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3 flex gap-1.5">
            {quest.category && (
              <span
                className="bg-white/95 backdrop-blur text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                style={{ color: quest.category.color }}
              >
                <span>{quest.category.icon}</span>
                {quest.category.name}
              </span>
            )}
          </div>
          <div className="absolute top-3 right-3">
            <span
              className="text-white text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: diff.color }}
            >
              {diff.label}
            </span>
          </div>
          {quest.region && (
            <div className="absolute bottom-3 left-3">
              <span className="bg-black/60 backdrop-blur text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                <MapPin size={11} />
                {quest.region}
              </span>
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-bold text-gray-900 mb-1.5 line-clamp-1">{quest.title}</h3>
          <p className="text-gray-500 text-sm line-clamp-2 mb-3 flex-1">{quest.description}</p>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-orange-600 font-bold text-sm">
              <Coins size={14} />
              <span>{quest.points} puan</span>
              {quest.cash_reward > 0 && (
                <span className="text-green-600">+ {quest.cash_reward}₺</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <Users size={12} />
              {quest.total_solved} çözdü
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
