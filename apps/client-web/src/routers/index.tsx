import React, { lazy } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import AccessLoading from '@/components/AccessLoading';
import { buildAcceptanceAwarePath } from '@/lib/acceptanceMode';

const LoginGate = lazy(() => import('@/pages/LoginGate'));
const RechargeCenter = lazy(() => import('@/pages/RechargeCenter'));
const MainPage = lazy(() => import('@/pages/MainPage'));
const ProfileCenter = lazy(() => import('@/pages/ProfileCenter'));

function RouteFallback() {
  return <AccessLoading title="正在加载页面" description="页面资源正在准备，请稍候。" compact />;
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
    element: <Navigate to={buildAcceptanceAwarePath('/login')} replace />,
  },
  {
    path: '/home',
    element: <Navigate to={buildAcceptanceAwarePath('/login')} replace />,
  },
  {
    path: '*',
    element: <Navigate to={buildAcceptanceAwarePath('/login')} replace />,
  },
];

export default rootRouter;
