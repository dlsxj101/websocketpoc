'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getStompClient } from '@/lib/stompClient';

interface GameProps {
  roomId: string;
  userName: string;
}

interface RoomResponse {
  roomId: string;
  players: {
    userName: string;
    totalPressCount: number;
  }[];
  message: string;
}

export default function Game({ roomId, userName }: GameProps) {
  const [pressCount, setPressCount] = useState(0);
  const [players, setPlayers] = useState<{ userName: string; totalPressCount: number }[]>([]);
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const router = useRouter();

  // 스페이스바 키 업 이벤트 핸들러 (키를 눌렀다가 뗄 때)
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'Space' && !gameEnded) {
        e.preventDefault();
        setPressCount((prev) => prev + 1);
        const client = getStompClient();
        if (client) {
          const pressMessage = {
            roomId,
            userName,
            pressCount: 1,
          };
          client.publish({
            destination: '/app/game.press',
            body: JSON.stringify(pressMessage),
          });
        }
      }
    },
    [roomId, userName, gameEnded]
  );

  useEffect(() => {
    // "keyup" 이벤트로 스페이스바가 뗄 때 한 번만 처리하도록 함
    window.addEventListener('keyup', handleKeyPress);
    return () => {
      window.removeEventListener('keyup', handleKeyPress);
    };
  }, [handleKeyPress]);

  // 방 업데이트(점수, 플레이어 목록) 수신
  useEffect(() => {
    const client = getStompClient();
    if (client) {
      const subscription = client.subscribe(`/topic/room/${roomId}`, (message) => {
        const data: RoomResponse = JSON.parse(message.body);
        setPlayers(data.players);

        // 플레이어 목록 중 100 이상의 tap을 가진 사람이 있으면 게임 종료로 처리
        const winningPlayer = data.players.find(
          (player) => player.totalPressCount >= 100
        );
        if (winningPlayer) {
          setGameEnded(true);
          setWinner(winningPlayer.userName);
        }
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [roomId]);

  // 결과 확인 버튼 클릭 시, 메인(홈)으로 이동 (게임방 종료)
  const handleResultCheck = () => {
    // 추가로 백엔드에 게임 종료 요청을 보낼 수 있지만 여기서는 단순히 페이지 이동합니다.
    router.push('/');
  };

  // 게임 종료 상태일 때는 tap 이벤트 무시하고 결과 화면을 렌더링
  if (gameEnded) {
    return (
      <div className="p-4 mt-4 bg-white rounded shadow">
        <h3 className="mb-2 text-xl font-bold">Game Over</h3>
        <p className="mb-4">
          Winner: <span className="font-bold">{winner}</span>
        </p>
        <button
          onClick={handleResultCheck}
          className="px-4 py-2 text-white transition-colors bg-green-500 rounded hover:bg-green-600"
        >
          Check Result & Exit
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 mt-4 bg-white rounded shadow">
      <h3 className="mb-2 text-xl font-bold">Game in Progress</h3>
      <p>Your tap count (this session): {pressCount}</p>
      <div className="mt-4">
        <h4 className="font-semibold">Scoreboard:</h4>
        <ul>
          {players.map((player, index) => (
            <li key={index}>
              {player.userName}: {player.totalPressCount} taps
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-2 text-sm text-gray-500">
        Press the <span className="font-bold">Spacebar</span> to tap!
      </p>
    </div>
  );
}
