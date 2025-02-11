// app/layout.tsx
'use client'; // 클라이언트 컴포넌트 설정

import CustomTitleBar from '@/components/CustomTitleBar';
import Navbar from '@/components/NavBar'; // 네비게이션 바
import RecoilProvider from '@/providers/RecoilProvider'; // Recoil Provider
import '@/styles/globals.css'; // Tailwind 전역 스타일
import { usePathname } from 'next/navigation';
import React from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // 네비게이션을 숨기고 싶은 페이지 리스트
  const hiddenNavPaths = ['/', '/user/login', '/register', '/some-other-page'];

  return (
    <html lang='ko'>
      <body className='w-full h-screen overflow-hidden'>
        <RecoilProvider>
          {/* 커스텀 타이틀바는 항상 상단에 고정 */}
          <CustomTitleBar />

          {/* 타이틀바 높이(40px)만큼 콘텐츠에 여백 추가 */}
          <div style={{ paddingTop: '40px' }}>
            {/* 특정 페이지에서만 네비게이션 렌더링 */}
            {!hiddenNavPaths.includes(pathname) && <Navbar />}
            <div className='w-full h-full'>{children}</div>
          </div>
        </RecoilProvider>
      </body>
    </html>
  );
}
