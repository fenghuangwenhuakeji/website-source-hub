import React from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import LoginPage from '../../pages/LoginGate';
import MacOSDesktop from '../MacOSDesktop';
import RechargeCenter from '../../pages/RechargeCenter';

function CopyrightFooter() {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '12px 20px calc(16px + env(safe-area-inset-bottom, 0px))',
        color: '#666',
        fontSize: 12,
        marginTop: 'auto',
        background: 'var(--mobile-shell-background)',
      }}
    >
      漏 2024 瓒呮棤绌圭郴缁?- 璁╁垱鎰忔棤闄愬欢浼?
    </div>
  );
}

const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: <LoginPage />,
    },
    {
      path: '/recharge',
      element: <RechargeCenter />,
    },
    {
      path: '/main',
      element: <MacOSDesktop />,
    },
    {
      path: '/mian',
      element: <Navigate to="/main" replace />,
    },
    {
      path: '/',
      element: <Navigate to="/login" replace />,
    },
    {
      path: '*',
      element: <Navigate to="/login" replace />,
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  },
);

export default function AppRouter() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--mobile-shell-background)' }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        <RouterProvider router={router} />
      </div>
      <CopyrightFooter />
    </div>
  );
}
