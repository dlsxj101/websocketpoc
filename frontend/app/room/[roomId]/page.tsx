'use client';

import { useSearchParams } from 'next/navigation';
import GameRoom from './components/GameRoom';

interface RoomPageProps {
  params: { roomId: string }
}

export default function RoomPage({ params }: RoomPageProps) {
  const { roomId } = params;
  const searchParams = useSearchParams();
  const userName = searchParams.get('userName') || '';

  return (
    <div className="min-h-screen p-4 bg-gray-100">
      <GameRoom initialRoomId={roomId} initialUserName={userName} />
    </div>
  );
}
