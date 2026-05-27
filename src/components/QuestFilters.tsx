'use client';

import { useState } from 'react';
import { Category } from '@/types';

interface Props {
  categories: Category[];
}

export default function QuestFilters({ categories }: Props) {
  const [active, setActive] = useState<string>('all');

  return (
    <div className="overflow-x-auto -mx-4 px-4 pb-3">
      <div className="flex gap-2 min-w-max">
        <button
          onClick={() => setActive('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
            active === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
          }`}
        >
          Tümü
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActive(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
              active === cat.id
                ? 'text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}
            style={active === cat.id ? { backgroundColor: cat.color } : {}}
          >
            <span>{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
