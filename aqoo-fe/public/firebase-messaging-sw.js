// public/firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/11.2.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.2.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyD331gS46jCW24EjPrIk6ZLM1zOF-7FAJU",
  authDomain: "aqoo-6ff04.firebaseapp.com",
  projectId: "aqoo-6ff04",
  storageBucket: "aqoo-6ff04.firebasestorage.app",
  messagingSenderId: "477360750442",
  appId: "1:477360750442:web:171a77b5cb7528aea26f13",
  measurementId: "G-9WT1MZZREY",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("📢 백그라운드 메시지 수신:", payload);

  // payload.data에서 알림 정보 추출
  const title = payload.data.title;
  const body = payload.data.body;
  const icon = payload.data.icon || "/icon.png"; // 기본 아이콘 경로 설정

  const options = {
    body: body,
    icon: icon,
    data: {
      click_action: payload.data.click_action, // 클릭 시 이동할 URL
    },
  };

  // 푸시 알림 표시
  self.registration.showNotification(title, options);
});
