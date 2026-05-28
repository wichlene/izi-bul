'use client';

import dynamic from 'next/dynamic';
import { Quest } from '@/types';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

interface Props {
  quests: Quest[];
  liveUsers: Array<{ user_id: string; latitude: number; longitude: number; username?: string }>;
}

export default function MapView({ quests, liveUsers }: Props) {
  return (
    <div className="w-full h-full">
      <MapPicker
        readOnly
        initialLat={39.0}
        initialLng={35.0}
        zoom={6}
        quests={quests.map((q) => ({
          id: q.id,
          latitude: q.latitude,
          longitude: q.longitude,
          title: q.title,
          category: q.category,
        }))}
        liveUsers={liveUsers}
      />
    </div>
  );
}
