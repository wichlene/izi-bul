'use client';

import dynamic from 'next/dynamic';
import { Quest } from '@/types';
import LiveLocationTracker from '@/components/LiveLocationTracker';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

interface Props {
  quests: Quest[];
  liveUsers: Array<{ user_id: string; latitude: number; longitude: number; username?: string }>;
  userId?: string;
}

export default function MapView({ quests, liveUsers, userId }: Props) {
  return (
    <div className="w-full h-full">
      {userId && <LiveLocationTracker userId={userId} />}
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
