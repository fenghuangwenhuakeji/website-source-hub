import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Spin } from 'antd';
import { isLoggedIn, logout } from './lib/permissionManager';
import { buildOfficialPath, resolveOfficialSiteUrl } from './lib/officialSiteUrl';

type Page = 'loading' | 'main';

const DEV_MODE = import.meta.env.DEV;
const SKIP_AUTH = DEV_MODE && new URLSearchParams(window.location.search).has('dev');
const APP_MAIN_PATH = '/access/main';

const MainPage = lazy(() => import('./pages/MainPage'));

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

function PageFallback({ label }: { label: string }) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding:
          'calc(env(safe-area-inset-top, 0px) + 24px) 20px calc(env(safe-area-inset-bottom, 0px) + 24px)',
        background:
          'radial-gradient(circle at top left, rgba(124, 58, 237, 0.24), transparent 30%), radial-gradient(circle at top right, rgba(34, 211, 238, 0.16), transparent 24%), linear-gradient(180deg, #050814 0%, #0b1220 58%, #111827 100%)',
      }}
    >
      <div style={{ display: 'grid', justifyItems: 'center', gap: 12, textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ color: '#dbe7ff', fontSize: 14, fontWeight: 600 }}>{label}</div>
      </div>
    </div>
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
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding:
            'calc(env(safe-area-inset-top, 0px) + 24px) 20px calc(env(safe-area-inset-bottom, 0px) + 24px)',
          background:
            'radial-gradient(circle at top left, rgba(124, 58, 237, 0.24), transparent 30%), radial-gradient(circle at top right, rgba(34, 211, 238, 0.16), transparent 24%), linear-gradient(180deg, #050814 0%, #0b1220 58%, #111827 100%)',
        }}
      >
        <div style={{ display: 'grid', justifyItems: 'center', gap: 12 }}>
          <Spin size="large" />
          <div style={{ color: '#dbe7ff', fontSize: 14, fontWeight: 600 }}>正在加载中...</div>
        </div>
      </div>
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
