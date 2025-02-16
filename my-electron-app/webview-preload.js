// webview-preload.js
const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  // "recoil-persist" 키에 저장된 데이터를 가져옵니다.
  const recoilData = localStorage.getItem('recoil-persist');

  if (recoilData) {
    try {
      // JSON 파싱 (저장된 데이터는 문자열 형태의 JSON)
      const parsedData = JSON.parse(recoilData);

      // parsedData 객체에서 authAtom.user.mainFishImage를 추출
      const fishPath = parsedData?.authAtom?.user?.mainFishImage;

      if (fishPath) {
        console.log('[webview-preload] fishPath found:', fishPath);
        // 부모 창으로 fishPath를 전달합니다.
        ipcRenderer.sendToHost('fishPath', fishPath);
      } else {
        console.warn('[webview-preload] fishPath not found in recoil data.');
      }
    } catch (error) {
      console.error(
        '[webview-preload] Error parsing recoil-persist data:',
        error
      );
    }
  } else {
    console.warn(
      '[webview-preload] No recoil-persist data found in localStorage.'
    );
  }
});
