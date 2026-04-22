import React, { lazy } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { buildAcceptanceAwarePath } from '@/lib/acceptanceMode';

const LoginGate = lazy(() => import('@/pages/LoginGate'));
const OfficialHomeRedirect = lazy(() => import('@/pages/OfficialHomeRedirect'));
const RechargeCenter = lazy(() => import('@/pages/RechargeCenter'));
const MainPage = lazy(() => import('@/pages/MainPage'));
const ProfileCenter = lazy(() => import('@/pages/ProfileCenter'));

function RouteFallback() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--mobile-shell-background)',
        color: '#1f2937',
        padding: 'calc(env(safe-area-inset-top, 0px) + 24px) 24px calc(env(safe-area-inset-bottom, 0px) + 24px)',
        textAlign: 'center',
      }}
    >
      <div>
        <div style={{ fontSize: 14, letterSpacing: '0.12em', opacity: 0.6 }}>凤煌 Access</div>
        <div style={{ marginTop: 14, fontSize: 16 }}>正在加载页面...</div>
      </div>
    </div>
  );
}

const rootRouter: RouteObject[] = [
  {
    path: '/login',
    element: (
      <React.Suspense fallback={<RouteFallback />}>
        <LoginGate />
      </React.Suspense>
    ),
  },
  {
    path: '/recharge',
    element: (
      <React.Suspense fallback={<RouteFallback />}>
        <RechargeCenter />
      </React.Suspense>
    ),
  },
  {
    path: '/rechange',
    element: <Navigate to={buildAcceptanceAwarePath('/recharge')} replace />,
  },
  {
    path: '/main',
    element: (
      <React.Suspense fallback={<RouteFallback />}>
        <MainPage />
      </React.Suspense>
    ),
  },
  {
    path: '/profile',
    element: (
      <React.Suspense fallback={<RouteFallback />}>
        <ProfileCenter />
      </React.Suspense>
    ),
  },
  {
    path: '/mian',
    element: <Navigate to={buildAcceptanceAwarePath('/main')} replace />,
  },
  {
    path: '/',
    element: (
      <React.Suspense fallback={<RouteFallback />}>
        <OfficialHomeRedirect />
      </React.Suspense>
    ),
  },
  {
    path: '/home',
    element: (
      <React.Suspense fallback={<RouteFallback />}>
        <OfficialHomeRedirect />
      </React.Suspense>
    ),
  },
  {
    path: '*',
    element: <Navigate to={buildAcceptanceAwarePath('/')} replace />,
  },
];

export default rootRouter;
