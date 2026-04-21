import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import rootRouter from '@/routers';
import { getRouterBase } from '@/lib/routerBase';
import { useViewportHeight } from '@/hooks/useMobile';

import './common.scss';
import './styles/mobile.scss';
import './styles/aurora-main.scss';
import './styles/macos-desktop-modern.scss';
import { initI18n } from './i18';

initI18n();

if (typeof document !== 'undefined') {
  document.title = '凤煌科技';
}

const basename = getRouterBase();

const router = createBrowserRouter(rootRouter, {
  basename,
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
});

const AppShell: React.FC = () => {
  useViewportHeight();

  return (
    <RouterProvider
      router={router}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    />
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AppShell />,
);
