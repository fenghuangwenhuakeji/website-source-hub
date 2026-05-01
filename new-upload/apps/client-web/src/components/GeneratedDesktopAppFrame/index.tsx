import React from 'react';
import { Copy, ExternalLink, FolderOpen, Gauge, HardDrive, Package, RefreshCw } from 'lucide-react';
import styles from './index.module.scss';
import { launchNativeApp } from '@/lib/nativeAppLauncher';
import { buildRouterPath, getRouterBase } from '@/lib/routerBase';
import { injectStorageBridge } from '@/lib/storageBridge';
import { getCurrentUserScopeId } from '@/lib/userScopedStorage';
import {
  DESKTOP_STORAGE_APP_ID_TOKEN,
  DESKTOP_STORAGE_LOCAL_SEED_TOKEN,
  DESKTOP_STORAGE_SESSION_SEED_TOKEN,
} from '@/lib/storageBridgeTokens';
import type { DesktopAppDefinition } from '@/types/desktopApp';

interface GeneratedDesktopAppFrameProps {
  app: DesktopAppDefinition;
}

const logGeneratedFrame = (...args: unknown[]) => {
  if (typeof window === 'undefined') return;
  console.info('[GeneratedDesktopAppFrame]', ...args);
};
const warnGeneratedFrame = (...args: unknown[]) => {
  if (typeof window === 'undefined') return;
  console.warn('[GeneratedDesktopAppFrame]', ...args);
};

const isAbsoluteWebUrl = (value: string): boolean => /^(https?:)?\/\//i.test(value);

const isRootLevelAppRoute = (route: string): boolean =>
  /^\/(login|register|home|main|novels|writing|showcase|profile|recharge)([/?#]|$)/i.test(route);

const isStaticBundleRoute = (route: string): boolean =>
  /^\/(?:access\/)?desktop-bundles\/[^?#]+/i.test(route);

const MOBILE_FOCUS_FRAME_APP_IDS = new Set(['webChat', 'codeEditor', 'ai-agent', 'long-writing']);

const normalizeStaticBundleRoute = (route: string): string =>
  /^\/access\/desktop-bundles\//i.test(route) ? route : route.replace(/^\/desktop-bundles\//i, '/access/desktop-bundles/');

const resolveDesktopRoute = (route: string): string => {
  if (!route || isAbsoluteWebUrl(route) || route.startsWith('data:')) {
    return route;
  }

  if (isStaticBundleRoute(route)) {
    return normalizeStaticBundleRoute(route);
  }

  if (isRootLevelAppRoute(route)) {
    return route;
  }

  const routerBase = getRouterBase();

  if (routerBase !== '/' && (route === routerBase || route.startsWith(`${routerBase}/`))) {
    return route;
  }

  return buildRouterPath(route);
};

const encodeSeed = (seed: Record<string, string>): string => {
  if (!seed || Object.keys(seed).length === 0) return '';
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(seed))));
  } catch {
    return '';
  }
};

const collectStorageSeed = (storage: Storage | null, prefix: string): Record<string, string> => {
  if (!storage) return {};
  const output: Record<string, string> = {};
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || !key.startsWith(prefix)) continue;
    const value = storage.getItem(key);
    if (value !== null) {
      output[key.slice(prefix.length)] = value;
    }
  }
  return output;
};

const replaceAllTokens = (source: string, token: string, value: string): string =>
  source.split(token).join(value);

const copyToClipboard = async (value: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
};

const FRAME_FALLBACK_STYLE = `
  html, body {
    min-height: 100%;
    background: #fffaf6;
    color: #4b2a1e;
  }
  body {
    margin: 0;
    min-height: 100dvh;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    visibility: visible !important;
    opacity: 1 !important;
  }
  body, body * {
    box-sizing: border-box;
  }
  body > * {
    max-width: 100%;
  }
  img, video, canvas, svg {
    max-width: 100%;
    height: auto;
  }
  a {
    color: inherit;
  }
`;

const injectIntoHead = (html: string, snippet: string): string => {
  const headMatch = html.match(/<head[^>]*>/i);
  if (headMatch) {
    return html.replace(headMatch[0], `${headMatch[0]}\n${snippet}`);
  }

  const htmlMatch = html.match(/<html[^>]*>/i);
  if (htmlMatch) {
    return html.replace(htmlMatch[0], `${htmlMatch[0]}\n<head>\n${snippet}\n</head>`);
  }

  return `${snippet}\n${html}`;
};

const getStaticRouteBaseHref = (route: string): string => {
  if (!route) return '';
  try {
    const url = new URL(route, typeof window !== 'undefined' ? window.location.href : 'http://localhost/');
    url.pathname = url.pathname.replace(/[^/]*$/, '/');
    url.search = '';
    url.hash = '';
    return url.href;
  } catch {
    return '';
  }
};

const prepareFrameHtml = (html: string, baseHref?: string): string => {
  let output = html || '<!DOCTYPE html><html lang="zh-CN"><head></head><body></body></html>';
  if (baseHref && !/<base\b/i.test(output)) {
    output = injectIntoHead(output, `<base href="${baseHref}">`);
  }
  output = injectIntoHead(output, `<style>${FRAME_FALLBACK_STYLE}</style>`);
  // srcDoc 模式�?crossorigin 属性会导致模块脚本�?CORS 失败，移除它
  output = output.replace(/\scrossorigin(?:=["']?[^"'>\s]*["']?)?/gi, '');
  return output;
};

const GeneratedDesktopAppFrame: React.FC<GeneratedDesktopAppFrameProps> = ({ app }) => {
  const isMobileFocusFrame = MOBILE_FOCUS_FRAME_APP_IDS.has(app.id);
  const [launching, setLaunching] = React.useState(false);
  const [launchMessage, setLaunchMessage] = React.useState<string | null>(null);
  const [launchError, setLaunchError] = React.useState<string | null>(null);
  const [staticRouteStatus, setStaticRouteStatus] = React.useState<'idle' | 'checking' | 'ready' | 'missing' | 'error'>('idle');
  const [staticRouteMessage, setStaticRouteMessage] = React.useState<string>('');
  const [staticRouteRetrySeed, setStaticRouteRetrySeed] = React.useState(0);
  const [staticRouteHtml, setStaticRouteHtml] = React.useState('');
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  const frameBodyRef = React.useRef<HTMLDivElement | null>(null);
  const [frameScale, setFrameScale] = React.useState(1);
  const bundleHtmlLength = app.bundle?.html ? app.bundle.html.length : 0;
  const bundleFileCount = app.bundle?.files?.length ?? 0;
  const staticRoute = React.useMemo(
    () => (app.runtime === 'static-web' && app.route ? resolveDesktopRoute(app.route) : ''),
    [app.route, app.runtime],
  );
  const userScopeId = getCurrentUserScopeId();

  const localStoragePrefix = React.useMemo(
    () => `desktop-app-storage:${userScopeId}:${app.id}:`,
    [app.id, userScopeId],
  );
  const sessionStoragePrefix = React.useMemo(
    () => `desktop-app-session:${userScopeId}:${app.id}:`,
    [app.id, userScopeId],
  );

  const [localSeed, sessionSeed] = React.useMemo(() => {
    if (typeof window === 'undefined') return ['', ''];
    let localStorageRef: Storage | null = null;
    let sessionStorageRef: Storage | null = null;
    try {
      localStorageRef = window.localStorage;
    } catch {}
    try {
      sessionStorageRef = window.sessionStorage;
    } catch {}
    const local = encodeSeed(collectStorageSeed(localStorageRef, localStoragePrefix));
    const session = encodeSeed(collectStorageSeed(sessionStorageRef, sessionStoragePrefix));
    return [local, session];
  }, [localStoragePrefix, sessionStoragePrefix]);

  const srcDoc = React.useMemo(() => {
    if (!app.bundle?.html) return '';
    let html = injectStorageBridge(app.bundle.html);
    html = replaceAllTokens(html, DESKTOP_STORAGE_APP_ID_TOKEN, app.id);
    html = replaceAllTokens(html, DESKTOP_STORAGE_LOCAL_SEED_TOKEN, localSeed);
    html = replaceAllTokens(html, DESKTOP_STORAGE_SESSION_SEED_TOKEN, sessionSeed);
    return prepareFrameHtml(html);
  }, [app.bundle?.html, app.id, localSeed, sessionSeed]);

  const frameScaleStyle = React.useMemo(
    () => ({ '--frame-scale': frameScale } as React.CSSProperties),
    [frameScale],
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const element = frameBodyRef.current;
    if (!element) return undefined;

    const updateScale = () => {
      const width = element.clientWidth;
      if (!width) return;
      const isNarrow = typeof window !== 'undefined' && window.matchMedia?.('(max-width: 768px)')?.matches;
      const nextScale = isNarrow ? 1 : Math.min(1, width / 960);
      setFrameScale((prev) => (Math.abs(prev - nextScale) > 0.01 ? Number(nextScale.toFixed(3)) : prev));
    };

    updateScale();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateScale);
      return () => window.removeEventListener('resize', updateScale);
    }

    const observer = new ResizeObserver(updateScale);
    observer.observe(element);
    return () => observer.disconnect();
  }, [app.id]);

  React.useEffect(() => {
    logGeneratedFrame('app-meta', {
      id: app.id,
      title: app.title,
      description: app.description,
      runtime: app.runtime,
      route: app.route ?? '',
      bundleMode: app.bundle?.mode ?? '',
      bundleEntry: app.bundle?.entryFile ?? '',
      bundleFiles: bundleFileCount,
    });
  }, [
    app.id,
    app.title,
    app.description,
    app.runtime,
    app.route,
    app.bundle?.mode,
    app.bundle?.entryFile,
    bundleFileCount,
  ]);

  React.useEffect(() => {
      if (!app.bundle?.html) {
        if (app.runtime === 'static-web' && app.route) {
        logGeneratedFrame('static route detected', {
          id: app.id,
          runtime: app.runtime,
          route: resolveDesktopRoute(app.route),
        });
        return;
      }
      warnGeneratedFrame('missing bundle html', { id: app.id, runtime: app.runtime });
      return;
    }
    logGeneratedFrame('srcdoc prepared', {
      id: app.id,
      entryFile: app.bundle.entryFile,
      mode: app.bundle.mode,
      htmlLength: bundleHtmlLength,
      srcDocLength: srcDoc.length,
    });
  }, [app.id, app.runtime, app.bundle?.entryFile, app.bundle?.mode, bundleHtmlLength, srcDoc.length]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (!app.bundle) return undefined;

    const handleMessage = (event: MessageEvent) => {
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return;
      if (!event.data || typeof event.data !== 'object') return;

      const payload = event.data as {
        type?: string;
        appId?: string;
        storage?: 'local' | 'session';
        action?: 'set' | 'remove' | 'clear';
        key?: string;
        value?: string;
      };

      if (payload.type !== 'desktop-storage' || payload.appId !== app.id) return;

      let targetStorage: Storage | null = null;
      try {
        targetStorage = payload.storage === 'session' ? window.sessionStorage : window.localStorage;
      } catch {
        targetStorage = null;
      }
      const prefix = payload.storage === 'session' ? sessionStoragePrefix : localStoragePrefix;
      if (!targetStorage) return;

      if (payload.action === 'clear') {
        for (let index = targetStorage.length - 1; index >= 0; index -= 1) {
          const key = targetStorage.key(index);
          if (key && key.startsWith(prefix)) {
            targetStorage.removeItem(key);
          }
        }
        return;
      }

      const normalizedKey = typeof payload.key === 'string' ? payload.key : '';
      if (!normalizedKey) return;

      if (payload.action === 'set') {
        targetStorage.setItem(`${prefix}${normalizedKey}`, payload.value ?? '');
        return;
      }

      if (payload.action === 'remove') {
        targetStorage.removeItem(`${prefix}${normalizedKey}`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [app.bundle, app.id, localStoragePrefix, sessionStoragePrefix]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (app.runtime !== 'static-web' || !app.route) {
      setStaticRouteStatus('idle');
      setStaticRouteMessage('');
      return undefined;
    }

    if (isAbsoluteWebUrl(app.route) || app.route.startsWith('data:')) {
      setStaticRouteStatus('ready');
      setStaticRouteMessage('外部页面已直接挂�?);
      setStaticRouteHtml('');
      return undefined;
    }

    if (isStaticBundleRoute(app.route)) {
      setStaticRouteStatus('ready');
      setStaticRouteMessage(`已挂载：${staticRoute}`);
      setStaticRouteHtml('');
      return undefined;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 4500);

    setStaticRouteStatus('checking');
    setStaticRouteMessage('正在检查静态页面是否可访问...');
    setStaticRouteHtml('');

    const probeRoute = async () => {
      try {
        const response = await fetch(staticRoute, {
          method: 'GET',
          headers: {
            Accept: 'text/html,application/xhtml+xml',
          },
          cache: 'no-store',
          signal: controller.signal,
        });

        if (cancelled) return;

        if (response.ok) {
          const rawHtml = await response.text();
          const baseHref = getStaticRouteBaseHref(staticRoute);
          let preparedHtml = prepareFrameHtml(injectStorageBridge(rawHtml), baseHref);
          preparedHtml = replaceAllTokens(preparedHtml, DESKTOP_STORAGE_APP_ID_TOKEN, app.id);
          preparedHtml = replaceAllTokens(preparedHtml, DESKTOP_STORAGE_LOCAL_SEED_TOKEN, localSeed);
          preparedHtml = replaceAllTokens(preparedHtml, DESKTOP_STORAGE_SESSION_SEED_TOKEN, sessionSeed);
          if (cancelled) return;
          setStaticRouteHtml(preparedHtml);
          setStaticRouteStatus('ready');
          setStaticRouteMessage(`已挂载：${staticRoute}`);
          return;
        }

        setStaticRouteStatus('missing');
        setStaticRouteMessage(`静态页面返�?${response.status} ${response.statusText || 'Not Found'}。`);
      } catch (error) {
        if (cancelled) return;
        setStaticRouteStatus(controller.signal.aborted ? 'missing' : 'error');
        setStaticRouteMessage(
          error instanceof Error
            ? `静态页面检查失败：${error.message}`
            : '静态页面检查失�?,
        );
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    void probeRoute();

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [app.id, app.route, app.runtime, localSeed, sessionSeed, staticRoute, staticRouteRetrySeed]);

  if (app.runtime === 'native-exe' && app.native) {
    const launchTarget = app.native.launcherPath || app.native.executablePath;

    const handleLaunch = async () => {
      setLaunching(true);
      setLaunchError(null);
      setLaunchMessage(null);

      try {
        const launched = await launchNativeApp(app.native);
        setLaunchMessage(
          launched.resolvedPath !== app.native.executablePath
            ? `桌面已启动本地程序，系统自动识别为：${launched.resolvedPath}`
            : '桌面已启动本地程序',
        );
      } catch (error) {
        setLaunchError(error instanceof Error ? error.message : '本地程序启动失败�?);
      } finally {
        setLaunching(false);
      }
    };

    return (
      <div
        className={`${styles.frameShell} ${styles.nativeFrameShell}`}
        data-app-id={app.id}
        data-mobile-focus={isMobileFocusFrame ? 'core' : undefined}
      >
        <div className={`${styles.metaBar} ${styles.nativeMetaBar}`}>
          <div className={styles.metaList}>
            <span className={`${styles.metaPill} ${styles.nativeMetaPill}`}>
              <HardDrive size={12} />
              本地 EXE 应用
            </span>
            <span className={`${styles.metaPill} ${styles.nativeMetaPill}`}>
              <Gauge size={12} />
              {app.native.launchArgs?.length ?? 0} 个启动参�?            </span>
          </div>

          <div className={`${styles.metaList} ${styles.nativeMetaInfo}`}>
            <span>已经注册成桌面应用入�?/span>
            <span>在桌面里点击图标会直接启动本地程�?/span>
          </div>
        </div>

        <div className={styles.nativeShell}>
          <div className={styles.nativeCard}>
            <div className={styles.nativeHeader}>
              <div>
                <strong>{app.title}</strong>
                <span>{app.description}</span>
              </div>
              <span className={styles.nativeBadge}>桌面启动�?/span>
            </div>

            <div className={styles.nativeList}>
              <div className={styles.nativeRow}>
                <span>主程序路�?/span>
                <code>{app.native.executablePath}</code>
              </div>
              {app.native.launcherPath ? (
                <div className={styles.nativeRow}>
                  <span>启动器路�?/span>
                  <code>{app.native.launcherPath}</code>
                </div>
              ) : null}
              {app.native.workingDirectory ? (
                <div className={styles.nativeRow}>
                  <span>工作目录</span>
                  <code>{app.native.workingDirectory}</code>
                </div>
              ) : null}
              {app.native.sourceRoot ? (
                <div className={styles.nativeRow}>
                  <span>源程序目�?/span>
                  <code>{app.native.sourceRoot}</code>
                </div>
              ) : null}
              <div className={styles.nativeRow}>
                <span>启动参数</span>
                <code>{app.native.launchArgs?.join(' ') || '�?}</code>
              </div>
            </div>

            <div className={styles.nativeActions}>
              <button
                className={styles.nativeButton}
                onClick={() => {
                  if (!launchTarget) return;
                  void copyToClipboard(launchTarget).then((copied) => {
                    if (copied) {
                      setLaunchError(null);
                      setLaunchMessage('路径已复制�?);
                      return;
                    }
                    setLaunchMessage(null);
                    setLaunchError('复制失败，请手动复制�?);
                  });
                }}
              >
                <Copy size={14} />
                复制启动路径
              </button>
              {app.native.sourceRoot ? (
                <button
                  className={styles.nativeButton}
                  onClick={() => {
                    if (!app.native?.sourceRoot) return;
                    void copyToClipboard(app.native.sourceRoot).then((copied) => {
                      if (copied) {
                        setLaunchError(null);
                        setLaunchMessage('路径已复制�?);
                        return;
                      }
                      setLaunchMessage(null);
                      setLaunchError('复制失败，请手动复制�?);
                    });
                  }}
                >
                  <FolderOpen size={14} />
                  复制程序目录
                </button>
              ) : null}
              <button
                className={styles.nativeLink}
                type="button"
                onClick={() => void handleLaunch()}
                disabled={launching}
              >
                <ExternalLink size={14} />
                {launching ? '启动�?..' : '启动本地程序'}
              </button>
            </div>

            {launchMessage ? <div className={`${styles.nativeNote} ${styles.nativeStatusSuccess}`}>{launchMessage}</div> : null}
            {launchError ? <div className={`${styles.nativeNote} ${styles.nativeStatusError}`}>{launchError}</div> : null}

            <div className={styles.nativeNotes}>
              {(app.native.notes ?? []).map((note) => (
                <div key={note} className={styles.nativeNote}>{note}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (app.runtime === 'static-web' && app.route) {
    const frameClassName = `${styles.frame} ${styles.frameScaled}`;
    const frameKey = `${userScopeId}:${staticRoute || app.route}-${staticRouteRetrySeed}`;
    return (
      <div
        className={`${styles.frameShell} ${styles.staticImmersiveShell}`}
        data-app-id={app.id}
        data-mobile-focus={isMobileFocusFrame ? 'core' : undefined}
      >
        {staticRouteStatus === 'ready' ? (
          <div className={styles.frameBody} ref={frameBodyRef} style={frameScaleStyle}>
            <div className={styles.frameViewport}>
              <iframe
                key={frameKey}
                className={frameClassName}
                src={\`\${staticRoute}?v=2\`}
                loading="eager"
                referrerPolicy="no-referrer"
                title={app.title}
              />
            </div>
          </div>
        ) : (
          <div className={styles.frameBody} ref={frameBodyRef}>
            <div className={styles.empty}>
              <div className={styles.emptyCard}>
                <span className={styles.emptyBadge}>
                  {staticRouteStatus === 'checking' ? '正在检�? : '静态应用未就绪'}
                </span>
                <strong>{app.title}</strong>
                <p>{staticRouteMessage || '当前静态页面暂时无法打开，已阻止进入空白窗口�?}</p>
                <div className={styles.emptyMeta}>
                  <span>路由：{staticRoute || app.route}</span>
                  <span>状态：{staticRouteStatus === 'checking' ? '检查中' : '需要修�?}</span>
                </div>
              <div className={styles.emptyActions}>
                <button className={styles.emptyButton} type="button" onClick={() => setStaticRouteRetrySeed((value) => value + 1)}>
                  <RefreshCw size={14} />
                  重新检�?                  </button>
                  <button
                    className={styles.emptyButton}
                    type="button"
                    onClick={() => {
                      if (!staticRoute) return;
                      void copyToClipboard(staticRoute).then((copied) => {
                        if (copied) {
                          setLaunchError(null);
                          setLaunchMessage('路径已复制�?);
                          return;
                        }
                        setLaunchMessage(null);
                        setLaunchError('复制失败，请手动复制�?);
                      });
                    }}
                  >
                  <Copy size={14} />
                  复制路径
                </button>
              </div>
              {launchMessage ? <div className={`${styles.emptyNote} ${styles.emptyNoteSuccess}`}>{launchMessage}</div> : null}
              {launchError ? <div className={`${styles.emptyNote} ${styles.emptyNoteError}`}>{launchError}</div> : null}
            </div>
          </div>
        </div>
        )}
      </div>
    );
  }

  if (!app.bundle?.html) {
    return (
      <div
        className={styles.frameShell}
        data-app-id={app.id}
        data-mobile-focus={isMobileFocusFrame ? 'core' : undefined}
      >
        <div className={styles.metaBar}>
          <div className={styles.metaList}>
            <span className={styles.metaPill}>
              <Package size={12} />
              前端包缺�?            </span>
            <span className={styles.metaPill}>
              <Gauge size={12} />
              {app.bundle?.entryFile || '未提�?HTML 入口'}
            </span>
          </div>
          <div className={styles.metaList}>
            <span>已阻止自动打开空白�?/span>
            <span>请重新生成或补齐 bundle html</span>
          </div>
        </div>

        <div className={styles.frameBody} ref={frameBodyRef} style={frameScaleStyle}>
          <div className={styles.empty}>
            <div className={styles.emptyCard}>
              <span className={styles.emptyBadge}>前端包缺�?/span>
              <strong>{app.title}</strong>
              <p>这个应用暂时没有可运行的前端包。已停止自动打开，避免直接进入空白窗口或黑窗口�?/p>
              <div className={styles.emptyMeta}>
                <span>入口：{app.bundle?.entryFile || '未配�?}</span>
                <span>文件数：{bundleFileCount}</span>
                <span>说明：{app.bundle?.notes?.length ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.frameShell}
      data-app-id={app.id}
      data-mobile-focus={isMobileFocusFrame ? 'core' : undefined}
    >
      <div className={styles.metaBar}>
        <div className={styles.metaList}>
          <span className={styles.metaPill}>
            <Package size={12} />
            {app.bundle.mode === 'html-entry' ? 'HTML 入口' : '模块入口'}
          </span>
          <span className={styles.metaPill}>
            <Gauge size={12} />
            {app.bundle.entryFile}
          </span>
        </div>

        <div className={styles.metaList}>
          <span>{app.bundle.files.length} 个源文件</span>
          <span>{app.bundle.notes.length} 条转换说�?/span>
        </div>
      </div>

      <div className={styles.frameBody} ref={frameBodyRef} style={frameScaleStyle}>
        <div className={styles.frameViewport}>
          <iframe
            className={`${styles.frame} ${styles.frameScaled}`}
            ref={iframeRef}
            srcDoc={srcDoc}
            sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
            title={app.title}
          />
        </div>
      </div>
    </div>
  );
};

export default GeneratedDesktopAppFrame;
