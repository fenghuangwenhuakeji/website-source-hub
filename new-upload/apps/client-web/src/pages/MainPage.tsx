import React, { Suspense, lazy, useEffect, useState } from 'react';
import AccessLoading from '@/components/AccessLoading';
import { checkRechargeRequired, isLoggedIn, logout } from '../lib/permissionManager';
import { buildOfficialPath, resolveOfficialSiteUrl } from '../lib/officialSiteUrl';

type MainPageProps = {
  onLogout?: () => void;
};

const MacOSDesktop = lazy(() => import('@/components/MacOSDesktop'));
const APP_MAIN_PATH = '/access/main';

function redirectToOfficial(path: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.location.replace(resolveOfficialSiteUrl(path));
}

function openOfficial(path: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.location.assign(resolveOfficialSiteUrl(path));
}

function DesktopShellFallback() {
  return (
    <AccessLoading
      title="正在载入凤煌桌面"
      description="正在挂载应用面板、程序坞和桌面组件。"
      steps={['挂载桌面外壳', '加载应用清单', '同步窗口状态']}
      compact
    />
  );
}

export default function MainPage(_props: MainPageProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      if (!isLoggedIn()) {
        redirectToOfficial(buildOfficialPath('/login', { from: APP_MAIN_PATH }));
        return;
      }

      const access = await checkRechargeRequired();
      if (access.needsLogin) {
        logout();
        redirectToOfficial(buildOfficialPath('/login', { from: APP_MAIN_PATH }));
        return;
      }

      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <AccessLoading
        title="正在校验账号权限"
        description="正在确认登录状态、会员时长和应用访问权限。"
        steps={['确认登录状态', '同步会员权益', '准备主程序入口']}
      />
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
        <MacOSDesktop onOpenRecharge={() => openOfficial(buildOfficialPath('/recharge', { from: APP_MAIN_PATH }))} />
      </Suspense>
    </div>
  );
}
