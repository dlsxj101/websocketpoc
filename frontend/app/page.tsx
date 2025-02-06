'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [userName, setUserName] = useState('');
  const [roomId, setRoomId] = useState('');
  const router = useRouter();

  const handleCreateRoom = () => {
    // "new"를 roomId로 전달하여 GameRoom에서 방 생성 요청을 수행하도록 함
    router.push(`/room/new?userName=${encodeURIComponent(userName)}`);
  };

  const handleJoinRoom = () => {
    if (roomId && userName) {
      router.push(`/room/${roomId}?userName=${encodeURIComponent(userName)}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="mb-4 text-3xl font-bold">Spacebar Tapping Game</h1>
      <div className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Enter your username"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="p-2 border rounded"
        />
        <button
          onClick={handleCreateRoom}
          className="px-4 py-2 text-white bg-blue-500 rounded"
          disabled={!userName}
        >
          Create Room
        </button>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="p-2 border rounded"
          />
          <button
            onClick={handleJoinRoom}
            className="px-4 py-2 text-white bg-green-500 rounded"
            disabled={!userName || !roomId}
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
}
