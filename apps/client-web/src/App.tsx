import React, { Suspense, lazy, useEffect, useState } from 'react';
import AccessLoading from './components/AccessLoading';
import { isLoggedIn, logout } from './lib/permissionManager';
import { buildOfficialPath, resolveOfficialSiteUrl } from './lib/officialSiteUrl';

type Page = 'loading' | 'main';

const DEV_MODE = import.meta.env.DEV;
const SKIP_AUTH = DEV_MODE && new URLSearchParams(window.location.search).has('dev');
const APP_MAIN_PATH = '/access/main';

const MainPage = lazy(() => import('./pages/MainPage'));

function isDesktopRuntime() {
  return typeof window !== 'undefined' && Boolean(window.electronAPI);
}

function redirectToOfficial(path: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.location.replace(resolveOfficialSiteUrl(path));
}

function shouldSendToOfficialPage(pathname: string, pageName: 'login' | 'recharge') {
  return pathname === `/${pageName}` || pathname.endsWith(`/access/${pageName}`);
}

function getOfficialAuthPath(search: string) {
  const mode = new URLSearchParams(search).get('mode');

  if (mode === 'register') {
    return '/register';
  }

  if (mode === 'sms' || mode === 'wechat') {
    return `/login?mode=${mode}`;
  }

  return '/login';
}

function shouldSendToOfficialProfile(pathname: string) {
  return pathname === '/profile' || pathname.endsWith('/access/profile');
}

function shouldSendToOfficialRegister(pathname: string) {
  return pathname === '/register' || pathname.endsWith('/access/register');
}

function resolveBrowserAccessFallback(pathname: string, search: string) {
  if (shouldSendToOfficialPage(pathname, 'login')) {
    return buildOfficialPath(getOfficialAuthPath(search), { from: APP_MAIN_PATH });
  }

  if (shouldSendToOfficialRegister(pathname)) {
    return buildOfficialPath('/register', { from: APP_MAIN_PATH });
  }

  if (shouldSendToOfficialPage(pathname, 'recharge')) {
    return buildOfficialPath('/recharge', { from: APP_MAIN_PATH });
  }

  if (shouldSendToOfficialProfile(pathname)) {
    return buildOfficialPath('/profile', { from: APP_MAIN_PATH });
  }

  // The desktop launcher is app-only. Web traffic should return to the
  // official site instead of rendering the Electron-facing workspace shell.
  return buildOfficialPath('/download', { from: APP_MAIN_PATH });
}

function PageFallback({ label }: { label: string }) {
  return (
    <AccessLoading title={label} description="桌面模块正在接入，请稍候片刻。" compact />
  );
}

function App() {
  const [page, setPage] = useState<Page>('loading');

  useEffect(() => {
    const checkAuth = () => {
      if (SKIP_AUTH) {
        localStorage.setItem('token', 'dev-token');
        localStorage.setItem('user', JSON.stringify({ username: 'dev-user', role: 'admin' }));
        setPage('main');
        return;
      }

      const pathname = typeof window === 'undefined' ? '' : window.location.pathname;
      const search = typeof window === 'undefined' ? '' : window.location.search;

      if (!isDesktopRuntime()) {
        redirectToOfficial(resolveBrowserAccessFallback(pathname, search));
        return;
      }

      if (shouldSendToOfficialPage(pathname, 'login')) {
        redirectToOfficial(buildOfficialPath(getOfficialAuthPath(search), { from: APP_MAIN_PATH }));
        return;
      }

      if (shouldSendToOfficialPage(pathname, 'recharge')) {
        redirectToOfficial(buildOfficialPath('/recharge', { from: APP_MAIN_PATH }));
        return;
      }

      if (!isLoggedIn()) {
        redirectToOfficial(buildOfficialPath('/login', { from: APP_MAIN_PATH }));
        return;
      }

      setPage('main');
    };
    checkAuth();
  }, []);

  if (page === 'loading') {
    return (
      <AccessLoading
        title="正在启动凤煌应用端"
        description="正在检查登录状态，并准备你的应用桌面。"
        steps={['检查登录状态', '读取本地会话', '进入凤煌应用端']}
      />
    );
  }

  return (
    <Suspense fallback={<PageFallback label="正在加载桌面..." />}>
      <MainPage
        onLogout={() => {
          logout();
          redirectToOfficial(buildOfficialPath('/login', { from: APP_MAIN_PATH }));
        }}
      />
    </Suspense>
  );
}

export default App;
