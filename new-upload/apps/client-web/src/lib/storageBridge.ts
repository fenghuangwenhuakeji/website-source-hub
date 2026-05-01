import {
  DESKTOP_STORAGE_APP_ID_TOKEN,
  DESKTOP_STORAGE_LOCAL_SEED_TOKEN,
  DESKTOP_STORAGE_SESSION_SEED_TOKEN,
} from './storageBridgeTokens';
import { injectFileSystemBridge } from './fileSystemBridge';

export const STORAGE_BRIDGE_MARKER = 'data-desktop-storage="bridge"';

export const createStorageBridgeScript = (): string => {
  const script = `
(() => {
  const APP_ID = ${JSON.stringify(DESKTOP_STORAGE_APP_ID_TOKEN)};
  const LOCAL_SEED_B64 = ${JSON.stringify(DESKTOP_STORAGE_LOCAL_SEED_TOKEN)};
  const SESSION_SEED_B64 = ${JSON.stringify(DESKTOP_STORAGE_SESSION_SEED_TOKEN)};

  const decodeSeed = (value) => {
    if (!value) return {};
    try {
      const json = decodeURIComponent(escape(atob(value)));
      const parsed = JSON.parse(json);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  };

  const send = (payload) => {
    try {
      window.parent?.postMessage({ type: 'desktop-storage', appId: APP_ID, ...payload }, '*');
    } catch {}
  };

  const createStorage = (seed, scope) => {
    let data = { ...seed };
    const hasKey = (key) => Object.prototype.hasOwnProperty.call(data, key);
    const keys = () => Object.keys(data);

    return {
      get length() {
        return keys().length;
      },
      key: (index) => keys()[index] ?? null,
      getItem: (key) => {
        const normalized = String(key);
        return hasKey(normalized) ? data[normalized] : null;
      },
      setItem: (key, value) => {
        const normalized = String(key);
        data[normalized] = String(value);
        send({ storage: scope, action: 'set', key: normalized, value: data[normalized] });
      },
      removeItem: (key) => {
        const normalized = String(key);
        if (hasKey(normalized)) {
          delete data[normalized];
          send({ storage: scope, action: 'remove', key: normalized });
        }
      },
      clear: () => {
        data = {};
        send({ storage: scope, action: 'clear' });
      },
    };
  };

  const localSeed = decodeSeed(LOCAL_SEED_B64);
  const sessionSeed = decodeSeed(SESSION_SEED_B64);
  const localStorageProxy = createStorage(localSeed, 'local');
  const sessionStorageProxy = createStorage(sessionSeed, 'session');

  try {
    Object.defineProperty(window, 'localStorage', { value: localStorageProxy, configurable: true });
  } catch {
    try {
      window.localStorage = localStorageProxy;
    } catch {}
  }

  try {
    Object.defineProperty(window, 'sessionStorage', { value: sessionStorageProxy, configurable: true });
  } catch {
    try {
      window.sessionStorage = sessionStorageProxy;
    } catch {}
  }

  try {
    window.__desktopStorageBridge__ = true;
  } catch {}
})();
`;
  const safeScript = script.replace(/<\/script>/gi, '<\\/script>');
  return `<script ${STORAGE_BRIDGE_MARKER}>${safeScript}<\/script>`;
};

export const injectStorageBridge = (html: string, notes?: string[]): string => {
  if (html.includes(STORAGE_BRIDGE_MARKER)) return html;

  const bridgeScript = createStorageBridgeScript();
  let result: string;
  const headMatch = html.match(/<head[^>]*>/i);
  if (headMatch) {
    notes?.push('Injected storage bridge for sandboxed iframe.');
    result = html.replace(headMatch[0], `${headMatch[0]}\n${bridgeScript}`);
  } else {
    const htmlMatch = html.match(/<html[^>]*>/i);
    if (htmlMatch) {
      notes?.push('Injected storage bridge for sandboxed iframe.');
      result = html.replace(htmlMatch[0], `${htmlMatch[0]}\n<head>\n${bridgeScript}\n</head>`);
    } else {
      notes?.push('Injected storage bridge for sandboxed iframe.');
      result = `${bridgeScript}\n${html}`;
    }
  }

  // 同时注入文件系统桥接（浏览器本地文件夹访问）
  return injectFileSystemBridge(result, notes);
};
