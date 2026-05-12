import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './index.css';
import { applyThemeMode, resolveThemeMode } from './themePreference';

const Layout = lazy(() => import('./pages/layout'));
const Dashboard = lazy(() => import('./pages/dashboard'));
const Users = lazy(() => import('./pages/users'));
const Orders = lazy(() => import('./pages/orders'));
const Packages = lazy(() => import('./pages/packages'));
const ExchangeProducts = lazy(() => import('./pages/exchange-products'));
const ExchangeRecords = lazy(() => import('./pages/exchange-records'));
const ExperienceCodes = lazy(() => import('./pages/experience-codes'));
const ExperienceCodeRecords = lazy(() => import('./pages/experience-code-records'));
const LicenseCenter = lazy(() => import('./pages/license-center'));
const Referrals = lazy(() => import('./pages/referrals'));
const Durations = lazy(() => import('./pages/durations'));
const Login = lazy(() => import('./pages/login'));

function RouteFallback() {
  return (
    <div className="admin-loading-screen">
      <div className="admin-loading-card">
        <div className="admin-loading-badge">凤煌科技</div>
        <div className="admin-loading-title">正在加载后台模块</div>
        <div className="admin-loading-copy">按路由拆包后，首屏只会加载当前页面需要的资源。</div>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    applyThemeMode(resolveThemeMode());
  }, []);

  return (
    <Suspense fallback={<RouteFallback />}>
      <BrowserRouter
        basename="/admin"
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="orders" element={<Orders />} />
            <Route path="packages" element={<Packages />} />
            <Route path="exchange-products" element={<ExchangeProducts />} />
            <Route path="exchange-records" element={<ExchangeRecords />} />
            <Route path="experience-codes" element={<ExperienceCodes />} />
            <Route path="experience-code-records" element={<ExperienceCodeRecords />} />
            <Route path="license-center" element={<LicenseCenter />} />
            <Route path="referrals" element={<Referrals />} />
            <Route path="durations" element={<Durations />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </Suspense>
  );
}
