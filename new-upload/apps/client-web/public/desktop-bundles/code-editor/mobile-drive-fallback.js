(function () {
  const isMobile =
    window.matchMedia('(max-width: 768px)').matches ||
    window.matchMedia('(pointer: coarse)').matches;
  const hasNativeDrive = Boolean(window.electronAPI || window.electron);

  if (!isMobile || hasNativeDrive) return;

  document.documentElement.dataset.mobileStaticIde = 'true';

  const DRIVE_ERROR_RE =
    /(加载)?(本地|桌面)?驱动器(加载)?失败|加载驱动器失败|桌面文件系统不可用|readDirectory.*failed|网络错误，请检查服务器是否运行|请在 Electron 环境中使用此功能/i;
  const FALLBACK_TEXT = '手机端已启用临时工作区';

  const rewriteTextNode = (node) => {
    if (!node || node.nodeType !== Node.TEXT_NODE || !node.nodeValue) return;
    if (DRIVE_ERROR_RE.test(node.nodeValue)) {
      node.nodeValue = FALLBACK_TEXT;
    }
  };

  const walk = (root) => {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      rewriteTextNode(node);
      node = walker.nextNode();
    }
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          rewriteTextNode(node);
        } else {
          walk(node);
        }
      }
      if (mutation.type === 'characterData') rewriteTextNode(mutation.target);
    }
  });

  const start = () => {
    walk(document.body);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  };

  if (document.body) {
    start();
  } else {
    window.addEventListener('DOMContentLoaded', start, { once: true });
  }
})();
