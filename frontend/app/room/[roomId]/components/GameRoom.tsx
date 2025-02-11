'use client';

import { connectStompClient, getStompClient } from '@/lib/stompClient';
import { useEffect, useRef, useState } from 'react';
import Game from './Game';

interface Player {
  userName: string;
  totalPressCount: number;
}

export interface RoomResponse {
  roomId: string;
  players: Player[];
  message: string;
}

interface GameRoomProps {
  initialRoomId: string; // "new"이면 생성자, 아니면 기존 roomId
  initialUserName: string;
}

export default function GameRoom({
  initialRoomId,
  initialUserName,
}: GameRoomProps) {
  // isCreator: 초기 roomId가 "new"이면 생성자, 아니면 참가자
  const isCreator = initialRoomId === 'new';

  // 초기값: 생성자인 경우 roomId는 빈 문자열; 참가자라면 initialRoomId 그대로 사용
  const [userName, setUserName] = useState(initialUserName);
  const [roomId, setRoomId] = useState(isCreator ? '' : initialRoomId);
  const [roomData, setRoomData] = useState<RoomResponse | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  // join 메시지가 한 번만 전송되도록 관리하는 ref
  const hasSentJoinRef = useRef(false);

  useEffect(() => {
    connectStompClient(() => {
      const client = getStompClient();
      if (client) {
        // 방 생성자인 경우: roomId가 없으면 /app/room.create 요청을 보냄
        if (isCreator && !roomId) {
          client.subscribe('/user/queue/room', (message) => {
            const data: RoomResponse = JSON.parse(message.body);
            console.log('Room creation response received:', data);
            if (data.roomId) {
              setRoomId(data.roomId);
            }
          });
          const createMessage = { userName };
          client.publish({
            destination: '/app/room.create',
            body: JSON.stringify(createMessage),
          });
          console.log('Room creation message sent:', createMessage);
        }
        // 방 참가자인 경우: initialRoomId가 제공되면 바로 join 요청
        else if (!isCreator && roomId && userName && !hasSentJoinRef.current) {
          const joinMessage = { roomId, userName };
          client.publish({
            destination: '/app/room.join',
            body: JSON.stringify(joinMessage),
          });
          console.log('Join room message sent (joiner):', joinMessage);
          hasSentJoinRef.current = true;
        }
        // roomId가 설정되었다면(생성자나 참가자 모두) 구독 설정
        if (roomId && userName) {
          client.subscribe(`/topic/room/${roomId}`, (message) => {
            const data: RoomResponse = JSON.parse(message.body);
            console.log('Room update received:', data);
            setRoomData(data);
            if (data.message === 'GAME_STARTED') {
              setGameStarted(true);
            }
          });
          // 단, join 메시지는 참가자에게만 전송되도록 이미 처리함.
        }
      }
    });
  }, [roomId, userName, isCreator]);

  // 게임 시작 처리
  const handleStartGame = () => {
    const client = getStompClient();
    if (client && client.connected) {
      const startMessage = { roomId };
      client.publish({
        destination: '/app/game.start',
        body: JSON.stringify(startMessage),
      });
      console.log('Start game message sent:', startMessage);
    } else {
      console.error('STOMP client is not connected yet.');
    }
  };

  // 방 생성/입장이 처리되기 전에는 로딩 상태 표시
  if (!roomId) {
    return (
      <div className='max-w-md p-4 mx-auto mt-8 bg-white rounded shadow'>
        <h2 className='mb-4 text-2xl font-bold'>
          {isCreator ? 'Creating Room...' : 'Waiting for Room...'}
        </h2>
        <p>Please wait.</p>
      </div>
    );
  }

  // 최종 게임룸 UI
  return (
    <div className='max-w-2xl p-4 mx-auto mt-8 bg-white rounded shadow'>
      <h2 className='mb-4 text-2xl font-bold'>Room: {roomId}</h2>
      <p className='mb-2'>Logged in as: {userName}</p>
      {roomData ? (
        <div className='mb-4'>
          <h3 className='font-semibold'>Players:</h3>
          {roomData.players.length > 0 ? (
            <ul>
              {roomData.players.map((player, index) => (
                <li key={index}>
                  {player.userName}: {player.totalPressCount} taps
                </li>
              ))}
            </ul>
          ) : (
            <p>No players yet.</p>
          )}
        </div>
      ) : (
        <p className='mb-4'>Waiting for room data...</p>
      )}
      {!gameStarted ? (
        <button
          onClick={handleStartGame}
          className='hover:bg-blue-600 px-4 py-2 text-white transition-colors bg-blue-500 rounded'
        >
          Start Game
        </button>
      ) : (
        <Game roomId={roomId} userName={userName} />
      )}
    </div>
  );
}
