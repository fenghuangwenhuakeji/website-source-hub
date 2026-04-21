import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Spin } from 'antd';
import { isLoggedIn, logout } from './lib/permissionManager';

type Page = 'loading' | 'login' | 'recharge' | 'main';

const DEV_MODE = import.meta.env.DEV;
const SKIP_AUTH = DEV_MODE && new URLSearchParams(window.location.search).has('dev');

const LoginPage = lazy(() => import('./pages/LoginGate'));
const RechargeCenter = lazy(() => import('./pages/RechargeCenter'));
const MainPage = lazy(() => import('./pages/MainPage'));

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
      if (!isLoggedIn()) {
        setPage('login');
        return;
      }
      setPage('recharge');
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

  if (page === 'login') {
    return (
      <Suspense fallback={<PageFallback label="正在加载登录页..." />}>
        <LoginPage onLoginSuccess={() => setPage('recharge')} />
      </Suspense>
    );
  }

  if (page === 'recharge') {
    return (
      <Suspense fallback={<PageFallback label="正在加载充值中心..." />}>
        <RechargeCenter
          onEnterMain={() => setPage('main')}
          onLogout={() => {
            logout();
            setPage('login');
          }}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageFallback label="正在加载桌面..." />}>
      <MainPage
        onLogout={() => {
          logout();
          setPage('login');
        }}
      />
    </Suspense>
  );
}

export default App;
