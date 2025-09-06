export const popupCenter = (url: string, title: string, width: number = 500, height: number = 550) => {
  const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
  const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;

  const windowWidth = window.innerWidth || document.documentElement.clientWidth || screen.width;
  const windowHeight = window.innerHeight || document.documentElement.clientHeight || screen.height;

  const systemZoom = windowWidth / window.screen.availWidth;
  const left = (windowWidth - width) / 2 / systemZoom + dualScreenLeft;
  const top = (windowHeight - height) / 2 / systemZoom + dualScreenTop;

  const newWindow = window.open(
    url,
    title,
    `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
  );

  if (newWindow) {
    newWindow.focus();
  }

  return newWindow;
};