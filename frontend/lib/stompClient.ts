import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient: Client | null = null;

export const connectStompClient = (onConnect: () => void) => {
  stompClient = new Client({
    // 백엔드의 웹소켓 엔드포인트 (필요에 따라 수정)
    // 만약 SockJS를 사용한다면 아래 webSocketFactory 옵션을 사용하세요.
    // brokerURL: 'ws://localhost:8080/ws',
    webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
    reconnectDelay: 5000,
    debug: (str) => {
      console.log(str);
    },
  });

  stompClient.onConnect = () => {
    console.log('Connected to STOMP');
    onConnect();
  };

  stompClient.activate();
};

export const getStompClient = () => {
  return stompClient;
};

export const disconnectStompClient = () => {
  if (stompClient) {
    stompClient.deactivate();
  }
};
