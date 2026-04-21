/**
 * 浏览器工具 - 网页浏览功能
 */

export interface BrowserState {
  url: string;
  title: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

// 浏览器历史
let history: string[] = [];
let historyIndex = -1;

/**
 * 导航到 URL
 */
export function navigateTo(url: string): string {
  // 确保 URL 格式正确
  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }
  
  // 添加到历史
  if (historyIndex < history.length - 1) {
    history = history.slice(0, historyIndex + 1);
  }
  history.push(normalizedUrl);
  historyIndex++;
  
  return normalizedUrl;
}

/**
 * 后退
 */
export function goBack(): string | null {
  if (historyIndex > 0) {
    historyIndex--;
    return history[historyIndex];
  }
  return null;
}

/**
 * 前进
 */
export function goForward(): string | null {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    return history[historyIndex];
  }
  return null;
}

/**
 * 获取当前 URL
 */
export function getCurrentUrl(): string | null {
  return historyIndex >= 0 ? history[historyIndex] : null;
}

/**
 * 获取浏览器状态
 */
export function getBrowserState(): BrowserState {
  return {
    url: getCurrentUrl() || '',
    title: '',
    loading: false,
    canGoBack: historyIndex > 0,
    canGoForward: historyIndex < history.length - 1
  };
}

/**
 * 常用网站快捷方式
 */
export const quickLinks = [
  { name: 'Google', url: 'https://www.google.com', icon: '🔍' },
  { name: 'GitHub', url: 'https://github.com', icon: '🐙' },
  { name: 'Stack Overflow', url: 'https://stackoverflow.com', icon: '📚' },
  { name: 'MDN', url: 'https://developer.mozilla.org', icon: '📖' },
  { name: 'YouTube', url: 'https://www.youtube.com', icon: '📺' },
  { name: 'Bilibili', url: 'https://www.bilibili.com', icon: '📺' },
];

/**
 * 验证 URL 是否有效
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url.startsWith('http') ? url : 'https://' + url);
    return true;
  } catch {
    return false;
  }
}
