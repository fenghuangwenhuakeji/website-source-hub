import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { buildAcceptanceAwarePath } from '../lib/acceptanceMode';
import { checkRechargeRequired, isLoggedIn, logout } from '../lib/permissionManager';

type MainPageProps = {
  onLogout?: () => void;
};

const MacOSDesktop = lazy(() => import('@/components/MacOSDesktop'));

function DesktopShellFallback() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding:
          'calc(env(safe-area-inset-top, 0px) + 24px) 20px calc(env(safe-area-inset-bottom, 0px) + 24px)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gap: 12,
          justifyItems: 'center',
          textAlign: 'center',
          padding: '28px 24px',
          borderRadius: 24,
          background: 'rgba(8, 13, 24, 0.78)',
          border: '1px solid rgba(148, 163, 184, 0.18)',
          boxShadow: '0 18px 40px rgba(2, 6, 23, 0.26)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <Spin size="large" />
        <div style={{ color: '#f5f7ff', fontSize: 14, fontWeight: 700 }}>正在载入凤煌桌面...</div>
        <div style={{ color: 'rgba(226, 232, 240, 0.72)', fontSize: 12 }}>
          桌面能力会在主程序里延续为同一套深空界面。
        </div>
      </div>
    </div>
  );
}

export default function MainPage(_props: MainPageProps) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      if (!isLoggedIn()) {
        navigate(buildAcceptanceAwarePath('/login'), { replace: true });
        return;
      }

      const access = await checkRechargeRequired();
      if (access.needsLogin) {
        logout();
        navigate(buildAcceptanceAwarePath('/login'), { replace: true });
        return;
      }

      if (access.needsRecharge) {
        navigate(buildAcceptanceAwarePath('/recharge'), { replace: true });
        return;
      }

      setReady(true);
    })();
  }, [navigate]);

  if (!ready) {
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
            'radial-gradient(circle at top left, rgba(124, 58, 237, 0.24), transparent 28%), radial-gradient(circle at top right, rgba(34, 211, 238, 0.16), transparent 24%), linear-gradient(180deg, #050814 0%, #0b1220 58%, #111827 100%)',
        }}
      >
        <Spin size="large" description="正在校验登录与使用权限..." />
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100dvh',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
        background:
          'radial-gradient(circle at top left, rgba(124, 58, 237, 0.24), transparent 28%), radial-gradient(circle at top right, rgba(34, 211, 238, 0.16), transparent 24%), linear-gradient(180deg, #050814 0%, #0b1220 58%, #111827 100%)',
      }}
    >
      <Suspense fallback={<DesktopShellFallback />}>
        <MacOSDesktop onOpenRecharge={() => navigate(buildAcceptanceAwarePath('/recharge'))} />
      </Suspense>
    </div>
  );
}
